# AstryStock Figma automatic synchronization

This repository is configured to update the existing AstryStock Figma file after mapped UI changes are merged into `main`.

## How it works

1. `.github/workflows/figma-sync.yml` runs after a matching push to `main` or a manual dispatch.
2. `scripts/figma-sync-plan.mjs` compares the merged commit with its base and maps changed files to Figma targets using `.figma/sync-map.json`.
3. Codex reads the Git diff and updates the existing Figma variables, components, or product screens through the remote Figma MCP server.
4. Codex validates editable layers, component instances, variable bindings, and full-frame screenshots.
5. `scripts/figma-sync-verify.mjs` rejects incomplete or visually failed results.
6. The workflow uploads the plan/result as an artifact and posts a report on the merged commit.
7. When new Figma nodes are created, their IDs are written to `.figma/sync-map.json` and committed automatically.

## One-time setup

### 1. Install a dedicated GitHub Actions runner

Create a **self-hosted Windows x64 runner** for the repository and add the custom label `figma-sync`. Run it under a dedicated Windows account that has access only to this repository and the target Figma file.

Do not use a public or shared runner for this workflow. It retains the Figma OAuth session needed for unattended writes.

### 2. Configure Codex and Figma on the runner account

Open PowerShell while signed in as the same Windows account that runs the GitHub runner:

```powershell
$env:CODEX_HOME = "C:\Users\RUNNER_USER\.codex-figma-ci"
codex mcp add figma --url https://mcp.figma.com/mcp
codex mcp list
```

Complete the browser authorization when prompted. The authenticated Figma account must have edit access to `AstryStock Design System` and a Full seat for canvas writes.

### 3. Add repository configuration

Add these in **GitHub > Settings > Secrets and variables > Actions**:

- Secret `OPENAI_API_KEY`: OpenAI API key used by the Codex GitHub Action.
- Variable `CODEX_FIGMA_HOME`: the persistent absolute path used above, for example `C:\Users\RUNNER_USER\.codex-figma-ci`.

Protect the `main` branch so this workflow runs only after reviewed changes are merged. The workflow intentionally does not run on pull requests because its Codex step has Figma write access.

### 4. Test before enabling normal merges

Run **Actions > Sync merged UI changes to Figma > Run workflow** with `force` enabled. Confirm:

- the workflow can list the `figma` MCP connection;
- all mapped screens pass screenshot validation;
- the workflow posts a commit report;
- `.figma/sync-map.json` remains valid if IDs are updated.

## Local checks

```powershell
npm.cmd run figma:sync:plan
npm.cmd run figma:sync:verify
```

For planning without Git, supply newline-separated paths:

```powershell
$env:FIGMA_SYNC_CHANGED_FILES = "src/App.tsx`nsrc/App.css"
npm.cmd run figma:sync:plan
```

## Operational notes

- Figma MCP authorization uses OAuth and may occasionally expire. Reauthorize on the runner account if the authentication preflight fails.
- Figma plan and seat rate limits still apply.
- Pretendard remains the product font token. The current Figma file documents Noto Sans KR as the rendering fallback where Pretendard is unavailable.
- The synchronization agent updates mapped nodes in place. It creates new screens only when the merged feature requires them.

Official references:

- Figma remote MCP and Codex setup: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Figma MCP write capabilities: https://developers.figma.com/docs/figma-mcp-server/
- Codex GitHub Action: https://github.com/openai/codex-action
