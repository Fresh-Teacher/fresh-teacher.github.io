"""Copy the app without replacing production-owned GitHub Pages tooling."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess


PROTECTED_FILES = (
    "vite.github-pages.config.ts",
    "scripts/prepare_github_pages.py",
    "scripts/build_standalone.mjs",
    "scripts/build_standalone.d.mts",
    "scripts/export_standalone.py",
    "scripts/github-pages-config.ts",
    "scripts/sync_from_lovable.py",
    "src/test/test_github_pages.py",
    "src/test/test_standalone_export.py",
    "src/test/test_lovable_sync.py",
    "public/googlebd45bc9d8ec020ce.html",
)
REQUIRED_FILES = (
    "vite.github-pages.config.ts",
    "scripts/prepare_github_pages.py",
    "scripts/build_standalone.mjs",
    "scripts/export_standalone.py",
    "scripts/github-pages-config.ts",
    ".github/workflows/deploy-pages.yml",
)
PROTECTED_SCRIPTS = ("build:pages", "build:pages:runtime", "build:standalone")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sync_app(source, target):
    source, target = Path(source).resolve(), Path(target).resolve()
    if source == target or source in target.parents or target in source.parents:
        raise ValueError("Source and target must be separate directories.")
    for name in REQUIRED_FILES:
        if not (target / name).is_file():
            raise ValueError(f"Missing production publishing file: {name}")
    old_package = json.loads((target / "package.json").read_text())
    incoming_package = json.loads((source / "package.json").read_text())
    saved_scripts = {}
    for name in PROTECTED_SCRIPTS:
        value = old_package.get("scripts", {}).get(name)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"Missing production publishing command: {name}")
        saved_scripts[name] = value
    if not isinstance(incoming_package.get("scripts", {}), dict):
        raise ValueError("Incoming package scripts must be an object.")
    preserved = [target / name for name in PROTECTED_FILES if (target / name).is_file()]
    preserved.extend(path for path in (target / ".github/workflows").rglob("*") if path.is_file())
    before = {path: digest(path) for path in preserved}
    # rsync exclusions protect existing files from both replacement and --delete.
    exclusions = [
        ".git", ".jj", "node_modules", "dist", "dist-ssr", ".output",
        ".tanstack", ".nitro", ".wrangler", "__pycache__", ".env*", ".dev.vars*",
        "/.github/workflows/", *(f"/{name}" for name in PROTECTED_FILES),
    ]
    subprocess.run([
        "rsync", "-a", "--checksum", "--delete", *(f"--exclude={name}" for name in exclusions),
        f"{source}/", f"{target}/",
    ], check=True)
    incoming_package.setdefault("scripts", {}).update(saved_scripts)
    (target / "package.json").write_text(json.dumps(incoming_package, indent=2) + "\n")
    for path, checksum in before.items():
        if not path.is_file() or digest(path) != checksum:
            raise RuntimeError(f"Publishing file changed during sync: {path.relative_to(target)}")
    result = json.loads((target / "package.json").read_text())
    for name, value in saved_scripts.items():
        if result["scripts"].get(name) != value:
            raise RuntimeError(f"Publishing command changed during sync: {name}")
    print(f"Synced app; verified {len(before)} protected files and {len(saved_scripts)} publishing commands.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    sync_app(args.source, args.target)
