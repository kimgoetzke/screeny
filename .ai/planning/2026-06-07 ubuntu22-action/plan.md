# Plan: Manual Ubuntu 22.04 build workflow

## Goal

Add a manually triggered GitHub Actions workflow that builds an AppImage for this Tauri app on Ubuntu 22.04 and publishes it as a versioned GitHub Release asset.

## User Prompt

Propose a GitHub Action using Ubuntu 22.04 for this Tauri project, but avoid a workflow that runs blindly on pushes to `main`. The user has since clarified that the workflow should be manually triggered and should create/publish a GitHub Release showing the version number with a downloadable AppImage asset. I assume AppImage remains the primary artefact because the user asked for cross-distro portability.

## Status

In progress — Phase 3/6 complete; next: Phase 4: Add draft release mode

## Work

### Phase 1: Lock the workflow spec

- [x] Read the relevant skills for this phase before editing any file: none
- [x] Lock the trigger to `workflow_dispatch` only; no `push` trigger and no automatic `main` trigger
- [x] Lock the job shape to one Linux job on `ubuntu-22.04`; no build matrix in v1
- [x] Lock the artefact scope to AppImage only in v1, using `pnpm tauri build --bundles appimage`
- [x] Lock the system dependencies to the Ubuntu packages already identified from Tauri docs: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `xdg-utils`
- [x] Lock the setup/build/release steps: checkout, setup Node + pnpm, setup Rust, install apt packages, `pnpm install --frozen-lockfile`, build AppImage, derive release tag/name from repo version, fail if that release/tag already exists, create/publish GitHub Release, attach `src-tauri/target/release/bundle/appimage/*.AppImage`
- [x] Keep workflow inputs minimal; no manual version input in v1 because release version comes from the repo
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 2: Implement the fixed spec

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Add `.github/workflows/linux-portable.yml` with the locked manual Ubuntu 22.04 AppImage build-and-release job
- [x] Grant only the permissions needed to create/update a GitHub Release and upload release assets
- [x] Use straightforward dependency caching where helpful
- [x] Add a short README note explaining how to trigger the workflow and where to find the published GitHub Release
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 3: Verify and hand off

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Validate workflow syntax and every referenced command/path against the repo config
- [x] Run relevant local verification where feasible, and record the boundary between local validation and GitHub-hosted execution
- [x] Summarise the manual trigger flow: Actions tab → select workflow → Run workflow → GitHub Release appears with version label and attached AppImage asset
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 4: Add draft release mode

- [ ] Read the relevant skills for this phase before editing any file: `tdd`
- [ ] Add a minimal `workflow_dispatch` input for release mode, defaulting to the current published behaviour while allowing an explicit draft path
- [ ] Update `.github/workflows/linux-portable.yml` so the release step passes `--draft` to `gh release create` when draft mode is selected, without changing the existing tag/version checks
- [ ] Update `README.md` to explain how to choose draft mode and how a maintainer publishes the draft afterwards
- [ ] Run relevant tests/verification for the draft-release behaviour and record any GitHub-hosted-only limits
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 5: Add release notes generation

- [ ] Read the relevant skills for this phase before editing any file: `tdd`
- [ ] Update `.github/workflows/linux-portable.yml` so each release uses GitHub-generated notes via `gh release create --generate-notes`, while preserving a short automation preface if still useful
- [ ] Ensure the release title/version logic stays repo-derived and compatible with generated notes
- [ ] Update `README.md` to explain that GitHub now generates the notes and where maintainers can review/edit them
- [ ] Run relevant tests/verification for release-note generation and record any GitHub-hosted-only limits
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 6: Publish AppImage, `.deb`, and `.rpm` in one release

- [ ] Read the relevant skills for this phase before editing any file: `tdd`
- [ ] Extend the workflow build step to `pnpm tauri build --bundles appimage,deb,rpm`
- [ ] Update `.github/workflows/linux-portable.yml` so asset discovery and release publication attach exactly one AppImage, one `.deb`, and one `.rpm` to the same versioned GitHub Release
- [ ] Keep the existing fail-if-release-exists behaviour and version-derivation logic unchanged while broadening the uploaded asset set
- [ ] Update `README.md` to explain the full multi-asset release output and any packaging caveats
- [ ] Run relevant tests/verification for the multi-asset release flow and record any GitHub-hosted-only limits
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Use a manual GitHub Actions trigger (`workflow_dispatch`) as the default proposal | Matches the user's request to avoid blind push-to-main execution |
| Treat AppImage as the default artefact target | Best match for the user's portability goal across Linux distros |
| Use Ubuntu 22.04 as the CI baseline | Matches user request and Tauri portability guidance discussed earlier |
| Use `workflow_dispatch` only in v1 | Removes blind triggering and keeps artefact generation explicit |
| Use a single Linux job, not a matrix | The user asked for one portable Linux artefact path, not broad CI coverage |
| Build AppImage only in v1 | Best fit for portability; simpler than offering deb/rpm/appimage choices up front |
| Do not add workflow inputs in v1 | Simplest manual UX; extra knobs can be added later if needed |
| Install exact Ubuntu Tauri prerequisites plus `xdg-utils` | Matches Tauri docs and avoids the earlier `xdg-open` class of failure |
| Publish a GitHub Release rather than only a workflow-run artefact | Matches the user's clarified desired outcome |
| Derive the release tag/name from the repo version | Matches user preference and keeps release metadata aligned with source-controlled versioning |
| Fail if the target release/tag already exists | Prevents silent overwrites of an existing published release |
| Attach `src-tauri/target/release/bundle/appimage/*.AppImage` to the GitHub Release | Direct output path for the portable Linux bundle |
| Add draft mode as a manual workflow input rather than a separate workflow | Keeps one release path while adding an explicit draft option |
| Use GitHub-generated release notes for the next enhancement phase | Reuses native release-note generation instead of inventing a custom templating layer |
| Build `appimage`, `deb`, and `rpm` together for the final enhancement phase | Tauri already supports these bundle targets, so one release can carry all three Linux artefacts |

## Errors Encountered

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |
| 2026-06-07 10:00 | Local NixOS AppImage bundling expected `/usr/bin/xdg-open` | 1 | Plan around Ubuntu 22.04 GitHub-hosted builds instead of local NixOS AppImage bundling |
| 2026-06-07 10:54 | `python3` command blocked by policy in this environment | 1 | Switched YAML validation to `pnpm dlx yaml valid` instead of Python-based parsing |
| 2026-06-07 11:11 | `gh release create --help` blocked by command policy | 1 | Use a different `gh` help path rather than repeating the blocked command |
| 2026-06-07 11:13 | Shell interpreted backticks in an `rg` verification command and tried to execute `.AppImage` | 1 | Re-run verification with single-quoted pattern instead of backticks |

## Notes

- Update `## Status` and phase status as you progress
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
