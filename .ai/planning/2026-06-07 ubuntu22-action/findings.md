# Findings

## Plan Size

**Multi-phase: Yes**

Reasoning: likely implementation touches at least a new GitHub workflow file and probably documentation, and will require more than 5 tool uses to inspect current build config, add workflow logic, and verify YAML/config. Even if code churn stays below 150 lines, the planning skill marks this as multi-phase once any criterion is met.

## Requirements

- Propose a GitHub Actions workflow for this Tauri app.
- Use Ubuntu 22.04 as the build environment.
- Do not trigger blindly on pushes to `main`.
- Provide a user-triggered option to generate the build artefact.
- Focus on a portable Linux artefact strategy, following prior discussion about AppImage.
- When manually triggered, create/publish a GitHub Release rather than only a workflow-run artefact.
- Ensure the release shows a version number and exposes the AppImage as a downloadable release asset.
- Extend the plan with a separate phase for draft release mode.
- Extend the plan with a separate phase for release notes generation.
- Extend the plan with a separate phase for publishing AppImage plus `.deb` and `.rpm` in the same release.

## Research Findings

- Planning skill requires plan files under `.ai/planning/2026-06-07 ubuntu22-action/`.
- Planning templates were read before creating plan files.
- Prior repo research already established this is a Tauri 2 app with `pnpm tauri build` as the build entrypoint.
- Prior packaging research showed AppImage is the best fit for cross-distro Linux portability, and building on Ubuntu 22.04 / Debian 12 is the recommended baseline.
- Prior local AppImage attempt failed on NixOS because bundling looked for `/usr/bin/xdg-open`, while this machine exposes `xdg-open` via Nix paths.
- No existing `.github/workflows/*` files were found, so this plan likely adds a new workflow from scratch.
- `src-tauri/tauri.conf.json` currently enables bundling and only lists `deb` and `rpm` targets; AppImage is not declared in config today.
- `package.json` exposes the build entrypoints needed by CI: `pnpm build`, `pnpm tauri`, and `pnpm test:unit`.
- `package.json` and `src-tauri/tauri.conf.json` both currently declare version `0.1.0`, so there is an obvious candidate source for a GitHub Release tag/name.
- User confirmed the workflow should derive the GitHub Release tag/name from the version already in the repo, rather than asking the triggering user to supply it manually.
- User confirmed the workflow should fail if the target release/tag already exists, rather than updating or replacing assets on an existing release.
- `README.md` already documents `pnpm tauri build` as the release build path and notes Linux AppImage bundling can fail on some setups while still producing the raw binary.
- User feedback on the first draft was valid: Phase 1 was too vague and deferred too many decisions that were already known.
- The first tightened v1 plan targeted a workflow-run artefact downloaded from the Actions UI.
- User has now clarified that the desired outcome is a manually triggered workflow that creates/publishes a GitHub Release with a version label and downloadable AppImage asset.
- The plan therefore needs release creation/upload steps instead of, or in addition to, plain `upload-artifact` handling.
- The remaining release semantics are now resolved: derive the versioned release tag/name from the repo version and fail if that release already exists.
- Implementation has started. Pre-change checks confirmed `.github/workflows/linux-portable.yml` did not yet exist, which made workflow-file creation a good first tracer-bullet assertion.
- `README.md` initially had no section documenting a manual GitHub Release workflow, so implementation needed a short usage note for triggering/releases.
- Implementation added `.github/workflows/linux-portable.yml` with `workflow_dispatch` only, `permissions: contents: write`, Ubuntu 22.04 build dependencies, Node/pnpm/Rust setup, Rust caching, repo-version derivation, existing-tag/release failure checks, AppImage build, and `gh release create` publication.
- Implementation added a README section describing the manual release flow and the fail-if-tag-exists behaviour.
- Follow-up documentation change added a separate ultra-concise README section showing only the steps needed to trigger portable binary generation and download the resulting `.AppImage`.
- Local verification succeeded for workflow structure and release semantics using regex checks, `pnpm dlx yaml valid`, repo-version matching, remote-tag availability checks, and `pnpm test:unit`.
- Local verification cannot prove end-to-end GitHub Release publication because that requires an actual GitHub-hosted workflow run with repository write permissions.
- User asked to extend the existing plan rather than create a new one, with three distinct follow-on phases: draft releases, release notes, and multi-asset releases (`.AppImage`, `.deb`, `.rpm`).
- The existing workflow already centralises release creation in one place, so the follow-on work can be planned as additive phases against `.github/workflows/linux-portable.yml` and `README.md` rather than as a fresh workflow design.
- `pnpm tauri build --help` confirms Tauri supports multiple bundle types via `--bundles [<BUNDLES>...]` with `deb`, `rpm`, and `appimage`, which fits the planned multi-asset release phase.
- A direct `gh release create --help` shell invocation was blocked by command policy in this environment, so any further GitHub CLI capability checks must use a different help path rather than repeating that exact command.
- `gh help release` confirmed the current workflow is already using the right command family (`create`, `edit`, `upload`) for the planned follow-on enhancements.
- `gh help release create` confirmed the specific flags needed for the plan extensions: `--draft` for draft releases and `--generate-notes` for GitHub-generated release notes.
- Reading `.github/workflows/linux-portable.yml` confirmed the current implementation already has a single release-publication step, so draft mode, generated release notes, and multi-asset upload can all be layered onto that step rather than split across separate workflows.
- The extended plan now makes three concrete follow-on choices: add draft mode as a manual workflow input, use GitHub-generated release notes, and expand the build/upload step to include AppImage plus `.deb` and `.rpm` in one release.

## Resources

- `/home/kgoe/.pi/agent/skills/planning/SKILL.md`
- `/home/kgoe/.pi/agent/skills/planning/templates/findings.md`
- `/home/kgoe/.pi/agent/skills/planning/templates/plan.md`
- `/home/kgoe/.pi/agent/skills/planning/templates/questions.md`
- `/home/kgoe/.pi/agent/skills/planning/templates/progress.md`
- `package.json`
- `src-tauri/tauri.conf.json`
- `README.md`
- `.github/` (no workflow files present)
- Tauri AppImage docs: https://v2.tauri.app/distribute/appimage/
- Tauri prerequisites docs: https://v2.tauri.app/start/prerequisites/
- GitHub issue re `/usr/bin/xdg-open` on NixOS: https://github.com/tauri-apps/tauri/issues/15430

## Visual/Browser Findings

- Tauri docs indicate AppImage is the portable Linux distribution format.
- Tauri docs indicate building on Ubuntu 22.04 or Debian 12 improves Linux compatibility because of glibc/WebKitGTK baselines.
- Tauri prerequisites docs list Ubuntu/Debian packages including `libwebkit2gtk-4.1-dev`.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
