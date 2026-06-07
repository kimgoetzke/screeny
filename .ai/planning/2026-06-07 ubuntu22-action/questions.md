# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Workflow artefact vs GitHub Release

The current plan produces an AppImage as a workflow run artefact via `upload-artifact`, which a user would download from the workflow run in the Actions tab. It does **not** currently create a GitHub Release page with a version label and downloadable release asset. Do you want the implementation to stay as a manual workflow artefact, or should it instead create/publish a GitHub Release when manually triggered?

### Response

It should create/publish a GitHub Release when manually triggered.
<!-- Processed -->

## Q2: Release version source

Should the manually triggered workflow derive the GitHub Release tag/name from the app version already in the repo (`package.json` and `src-tauri/tauri.conf.json`, currently `0.1.0` → `v0.1.0`), or should the person triggering the workflow choose the release tag/version manually?

### Response

Derive the GitHub Release tag/name from the app version already in the repo.
<!-- Processed -->

## Q3: Existing release behaviour

If the target GitHub Release/tag already exists, should the workflow fail, or should it update/replace the AppImage asset on the existing release?

### Response

The workflow should fail in that case.
<!-- Processed -->
