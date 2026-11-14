<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Repository import
- Preserve imported TanStack routes, shared library shell, and static catalogs to retain navigation and search behavior.
- Rehome imported binary media with project-owned asset pointers so another project’s storage is not required.
- Keep the current project runtime and generated route tree; repository imports must not replace deployment configuration or repository metadata.

## Standalone exports
- Keep Lovable media pointers in the working project; materialize and rewrite them only in an external source export so self-hosted media needs no Lovable proxy.
- External hosting builds use the staged standalone builder to download validated media and rewrite references before compiling; this keeps deployed assets local without changing Lovable's working media pointers.
- Use the export script to validate every downloaded media file and reject unmapped media references so exports cannot silently contain broken media.

## External static deployment
- Derive sitemap pages from explicit route decisions and registered legacy catalogs; prerender XML for Pages and verify each listed HTML file before deployment, excluding shell-only document/repository URLs and non-page-specific dates.
- Keep GitHub Pages configuration separate from the Lovable runtime; prerender catalog URLs and convert directory output to literal legacy HTML files to preserve incoming links.
- Deploy Pages only by manual workflow that materializes standalone source automatically; refuse unresolved media or missing page output so failed preparation cannot replace the live site.
- Prefer dedicated TanStack shell files for Pages 404 output, falling back to the validated homepage when absent, so differing prerender layouts remain deployable.
- Load AdSense only on the approved production hostname with the production flag and accepted cookie choice; previews must not generate ad traffic.

## Manual advertisements
- Keep manual unit IDs in `src/data/ad-units.json` (null until supplied); render fixed-size labeled bands after eight catalog items and after document information, never inside resource cards or readers, to separate ads from downloads.
- Queue each ad DOM element once and only on the approved production host after consent; keep preview placeholders request-free and preserve the existing production bootstrap.

## Visitor notices
- Coordinate install and cookie notices in the shared root with an explicit completion callback; this prevents overlap and preserves the sequence on direct document visits without delaying consent-gated ads.
