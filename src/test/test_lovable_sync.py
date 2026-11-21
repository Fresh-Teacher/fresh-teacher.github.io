import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location(
    "lovable_sync", Path(__file__).resolve().parents[2] / "scripts/sync_from_lovable.py"
)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class LovableSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / "source"
        self.target = Path(self.temp.name) / "target"
        self.source.mkdir()
        self.target.mkdir()
        self.commands = {
            "build:pages": "node scripts/build_standalone.mjs --pages",
            "build:pages:runtime": "vite build --config vite.github-pages.config.ts && python3 scripts/prepare_github_pages.py",
            "build:standalone": "node scripts/build_standalone.mjs",
        }
        self.write(self.target, "package.json", json.dumps({"scripts": self.commands}))
        self.write(self.source, "package.json", json.dumps({
            "scripts": {"dev": "vite dev", "build:pages": "wrong incoming command"},
            "dependencies": {"example": "2.0.0"},
        }))
        for name in set(sync.PROTECTED_FILES + sync.REQUIRED_FILES):
            self.write(self.target, name, f"production:{name}\n")

    def write(self, root, name, content):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def test_preserves_every_publishing_file_when_source_omits_them(self):
        expected = {name: (self.target / name).read_bytes() for name in sync.PROTECTED_FILES}
        sync.sync_app(self.source, self.target)
        for name, content in expected.items():
            with self.subTest(name=name):
                self.assertEqual((self.target / name).read_bytes(), content)

    def test_preserves_every_publishing_file_when_source_replaces_them(self):
        for name in sync.PROTECTED_FILES:
            self.write(self.source, name, "stale source version")
        sync.sync_app(self.source, self.target)
        for name in sync.PROTECTED_FILES:
            with self.subTest(name=name):
                self.assertEqual((self.target / name).read_text(), f"production:{name}\n")

    def test_preserves_all_workflows_and_asset_origin(self):
        workflow = "env:\n  STANDALONE_ASSET_ORIGIN: https://current-preview.lovable.app\n"
        self.write(self.target, ".github/workflows/deploy-pages.yml", workflow)
        self.write(self.target, ".github/workflows/sync-from-lovable.yml", "current sync")
        self.write(self.source, ".github/workflows/deploy-pages.yml", "obsolete origin")
        sync.sync_app(self.source, self.target)
        self.assertEqual((self.target / ".github/workflows/deploy-pages.yml").read_text(), workflow)
        self.assertEqual((self.target / ".github/workflows/sync-from-lovable.yml").read_text(), "current sync")

    def test_merges_package_but_keeps_exact_publishing_commands(self):
        sync.sync_app(self.source, self.target)
        package = json.loads((self.target / "package.json").read_text())
        for name, command in self.commands.items():
            with self.subTest(name=name):
                self.assertEqual(package["scripts"][name], command)
        self.assertEqual(package["scripts"]["dev"], "vite dev")
        self.assertEqual(package["dependencies"], {"example": "2.0.0"})

    def test_updates_app_and_deletes_obsolete_app_files(self):
        self.write(self.target, "src/obsolete.ts", "old")
        self.write(self.target, "src/app.ts", "old app")
        self.write(self.source, "src/app.ts", "new app")
        sync.sync_app(self.source, self.target)
        self.assertEqual((self.target / "src/app.ts").read_text(), "new app")
        self.assertFalse((self.target / "src/obsolete.ts").exists())

    def test_excludes_secrets_and_nested_repository_metadata(self):
        self.write(self.target, ".git/config", "target history")
        for name in (".env.production", ".dev.vars", "nested/.git/config", "node_modules/example.js"):
            self.write(self.source, name, "must not copy")
        sync.sync_app(self.source, self.target)
        self.assertEqual((self.target / ".git/config").read_text(), "target history")
        for name in (".env.production", ".dev.vars", "nested/.git/config", "node_modules/example.js"):
            self.assertFalse((self.target / name).exists())

    def test_missing_publishing_file_refuses_sync_before_app_changes(self):
        (self.target / "vite.github-pages.config.ts").unlink()
        self.write(self.target, "src/app.ts", "unchanged")
        with self.assertRaisesRegex(ValueError, "Missing production publishing file"):
            sync.sync_app(self.source, self.target)
        self.assertEqual((self.target / "src/app.ts").read_text(), "unchanged")


if __name__ == "__main__":
    unittest.main()
