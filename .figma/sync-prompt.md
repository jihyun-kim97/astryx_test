# AstryStock code-to-Figma synchronization

You are running in CI after protected-branch code changes were merged.

## Required inputs

- Read `.figma/run-plan.json` first.
- Read `.figma/sync-map.json` for the Figma file key, existing node IDs, source ownership, and validation rules.
- Inspect only the Git diff and source files needed for the targets in the run plan.
- The target Figma file is the existing `AstryStock Design System` file. Never create a new Figma file.

## Required Figma workflow

1. Use the installed `figma-use` skill before every `use_figma` call.
2. Use `figma-generate-design` for screen or modal changes.
3. Use `figma-generate-library` together with `figma-use` when tokens, variables, text/effect styles, or reusable component sets changed.
4. Create one Figma session and reuse its exact `sessionId` throughout this run.
5. Inspect existing mapped nodes before mutating them.
6. Update mapped nodes in place whenever practical. Preserve node IDs, component instances, variable bindings, names, auto-layout, and Light/Dark behavior.
7. New repeated UI must be a component with instances. New tokenizable values must use Astryx variables instead of raw values.
8. If a genuinely new screen or reusable component is required, add it to `06 Product Screens` or the appropriate design-system page and update `.figma/sync-map.json` with its returned node ID.
9. Never import a screenshot or flattened full UI as the deliverable.

## Validation and reporting

- For every affected screen, verify descendant types, component instances, variable bindings, and absence of full-screen image fills.
- Take a full-frame screenshot of every affected screen after composition. Inspect for clipping, overlap, placeholder copy, wrong variants, and typography problems.
- Apply targeted fixes and take one post-fix screenshot only when a defect is found.
- The product font token is Pretendard. The current Figma environment uses Noto Sans KR as the documented fallback; report this as a warning, not as a new regression.
- Do not modify application source code unless it is required to repair a build failure caused by the merged change.
- Your final response must be JSON matching `.figma/sync-output.schema.json`. Use `status: "failed"` if any required target could not be updated or did not pass visual validation.
