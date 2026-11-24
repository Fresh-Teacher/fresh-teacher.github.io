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

## Imported application architecture
- Keep the target TanStack bootstrap and pinned framework versions while importing compatible application modules, so hosting stays supported.
- Resolve the public resource library from the bundled catalog and legacy manifests; retain existing CDN media and document providers because the source has no account database.
- Render fixed document-page shells directly in JSX rather than parsing captured HTML at runtime, preserving existing wrapper classes so styling stays unchanged.

## External GitHub Pages sync
- Keep production-owned publishing tooling and workflows byte-for-byte during app sync, merging only the publishing commands into the incoming package manifest; this prevents source imports from breaking static deployment.
- Validate sync preservation with `scripts/sync_from_lovable.py` and its Python regression tests before pushing a review branch; deployment stays a separate manual action so importing code cannot replace the live website.
