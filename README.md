# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Self-contained media export

The working copy keeps project-owned media pointers for Lovable. External builds
now automatically download validated media into a temporary standalone copy,
rewrite all media references to local files, and compile that copy. No ZIP or
manual image upload is needed. The deployed site serves its own images and fonts;
Lovable is needed only during preparation, not for serving those deployed files.

GitHub Pages: the manual workflow runs this automatically. Vercel: use
`bun run build:standalone` as the build command, with `NITRO_PRESET=vercel`.
Other compatible hosts can also use `bun run build:standalone` with their Nitro
preset. Build machines need Node and Bun; Pages additionally needs Python.
Plain `bun run build` remains the Lovable build and does not materialize media.
If media cannot be downloaded or validated, the external build stops before
deployment. Set `STANDALONE_ASSET_ORIGIN` to another accessible Lovable deployment
of this project if the default published origin is unavailable.

Optional source-only export for advanced use with Python 3:

```sh
python3 scripts/export_standalone.py --output /tmp/fresh-teacher-standalone --origin https://YOUR-ACCESSIBLE-LOVABLE-DOMAIN
```

The destination must be outside this repository and must not already exist.
The origin is only needed while downloading the media; the finished export does
not use it. The exporter includes all pointer-backed images, icons, fonts, and
audio in `public/local-media/`, rewrites source, CSS, manifests and media maps,
and preserves existing pointer imports as local file descriptors. It stops if
any media is missing, rather than shipping broken links. Repository metadata,
credentials, dependencies and generated output are excluded.

### Deploy the exported folder on Vercel

1. Connect the working project to GitHub; no ZIP is necessary.
2. Import that repository into Vercel, with this folder as the project root.
3. Use install command `bun install` and build command `bun run build:standalone`.
4. Set `NITRO_PRESET` to `vercel` in Vercel's environment variables.
5. Let Nitro generate Vercel's deployment output; do not force a static `dist`
   output directory or add an asset proxy rewrite.

For Node hosting, set `NITRO_PRESET=node-server` during the build and start with
`node .output/server/index.mjs`. The existing runtime configuration is preserved.
External hosting deployment has not been performed from this project.

**Scope:** included media is self-contained, not the entire internet-connected
library. Teaching documents still come from their original repositories, and
third-party document viewers, remote stylesheets, analytics and contact links
still need their respective services. This export is not a complete offline
mirror of all teaching documents.

Export checks: `python3 -m unittest discover -s src/test -p 'test_standalone_export.py'`.

## Migrate the existing GitHub Pages site safely

The workflow accepts the working copy and creates standalone media automatically. Keep the existing
`Fresh-Teacher/fresh-teacher.github.io` repository and hostname. This preparation
does not change your live site, repository connection, or Pages settings.

1. Back up the current site on a separate branch and download a backup. Record
   the current Pages publishing source and any Actions workflow so rollback is ready.
2. Add the project code to a migration branch and open a pull request. Preserve
   repository metadata. Disable/remove any old automatic deployment workflow in
   that branch so merging cannot unexpectedly deploy. Review old URL coverage;
   imported catalogs are not proof that every URL in the live repository exists.
3. In that branch, install with `bun install --frozen-lockfile` and run
   `VITE_ENABLE_ADSENSE=true bun run build:pages`. Review `dist/client` on a static
   test server, including `/`, `/p1.html`, `/baby.html`, search, document links,
   downloads, images, `/ads.txt`, and phones. Test old bookmarks and installed apps.
4. Only when ready, merge the reviewed PR, set repository **Settings → Pages →
   Source → GitHub Actions**, then manually run **Deploy standalone library to
   GitHub Pages** from the chosen branch. Switching publishing sources can cause
   a temporary interruption; schedule a quiet period. No zero-downtime promise.
5. Verify the live addresses and Google Search Console, then check AdSense's site
   status, ads.txt recognition and reports. Roll back using the recorded previous
   publishing source/branch or redeploy the last known-good artifact.

### Ads and hosting limitations

- The existing publisher `ca-pub-8782637659456848` and `ads.txt` are retained.
  The head loads AdSense only on `fresh-teacher.github.io`, only when the Pages
  production flag is enabled, and after **Accept all**. Preview/staging and
  **Essential only** do not request ads. No analytics or Tag Manager is enabled.
- This is the AdSense loader for Auto ads; confirm Auto ads in your AdSense
  account. Existing manual ad placements have not been recreated, and ad serving
  or revenue continuity cannot be guaranteed. Never click your own ads to test.
- The cookie notice is **not** a Google-certified consent management platform.
  Configure Google's required certified CMP/privacy messages before serving ads
  to visitors in the EEA, UK or Switzerland; review other applicable requirements.
- Catalog/class URLs are prerendered with page-specific metadata and literal
  `.html` files. Unenumerated `/doc/...` and `/more/...` URLs use TanStack's app
  shell through Pages' `404.html`: they may render for users, but the HTTP status
  remains **404**. This is not SEO-equivalent to SSR. Prefer Vercel/Cloudflare
  with a custom domain if those document URLs need indexable 200 responses.
- GitHub Pages runs no server functions. Search/navigation remain interactive;
  external teaching documents and third-party viewers still require the internet.
- The workflow intentionally runs manually, not on each push. Do not use this
  root-domain setup for a repository subpath such as `/modern-library/`.
