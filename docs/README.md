# Diagrams

Exported diagrams referenced by the top-level `README.md`.

## Architecture diagram

Drop the exported system architecture diagram in this folder as `architecture.png`
(`architecture.svg` also works). The root README references it as:

`![Secure Content Portal — system architecture](docs/architecture.png)`

A few notes for a clean result on GitHub:

- Export at 2x scale so the figure stays sharp on high-density displays.
- Use a light background. GitHub renders the README against both a light and a
  dark theme, and a mid-tone or transparent background tends to look washed out
  in one of them.
- Keep the labels in the exported image consistent with the component names used
  in the README's Components table.
- If you prefer to embed the topology as code instead, the four Mermaid
  diagrams under "Request Flows" in the root README cover the runtime behaviour
  and can be extended with a component diagram if needed.
