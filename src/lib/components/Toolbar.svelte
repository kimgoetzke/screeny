<script lang="ts">
    import { onMount } from "svelte";
    import { getVersion } from "@tauri-apps/api/app";
    import { Channel, invoke } from "@tauri-apps/api/core";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { openUrl } from "@tauri-apps/plugin-opener";
    import HelpMenu from "$lib/components/HelpMenu.svelte";
    import { frameStore } from "$lib/stores/frames.svelte";
    import { waitForNextPaint } from "$lib/paint";
    import { openGifStreaming, exportGif } from "$lib/actions";
    import type { DialogProvider, GifBackend } from "$lib/actions";
    import type { DecodeEvent } from "$lib/types";
    import { helpKeyBindings } from "$lib/help-keybindings";
    import FilePicker from "$lib/components/FilePicker.svelte";
    import NotificationDialog from "$lib/components/NotificationDialog.svelte";

    let { onLoad }: { onLoad?: () => void } = $props();

    let loading = $state(false);
    let statusMessage = $state("");
    let isE2e = $state(false);

    let showFilePicker = $state(false);
    let filePickerResolve: ((path: string | null) => void) | null = null;
    let filePickerReject: ((error: unknown) => void) | null = null;

    let showCloseConfirm = $state(false);

    let showSaveInput = $state(false);
    let savePath = $state("");
    let saveResolve: ((path: string | null) => void) | null = null;
    let showHelpMenu = $state(false);
    let appVersion = $state("Loading…");

    invoke<boolean>("e2e_check").then((result) => {
        isE2e = result;
    });

    onMount(() => {
        getVersion().then((version) => {
            appVersion = version;
        });
    });

    const nativeDialog: DialogProvider = {
        openFile: () =>
            new Promise((resolve, reject) => {
                filePickerResolve = resolve;
                filePickerReject = reject;
                showFilePicker = true;
            }),

        saveFile: async () => {
            const suggested: string = await invoke("suggest_export_path");
            savePath = suggested;
            showSaveInput = true;
            return new Promise((resolve) => {
                saveResolve = resolve;
            });
        },
    };

    function handleFilePickerConfirm(path: string) {
        showFilePicker = false;
        filePickerResolve?.(path);
        filePickerResolve = null;
        filePickerReject = null;
    }

    function handleFilePickerCancel() {
        showFilePicker = false;
        filePickerResolve?.(null);
        filePickerResolve = null;
        filePickerReject = null;
    }

    // E2E: open uses the native file picker path; only save is bypassed
    function getDialog(): DialogProvider {
        return {
            openFile: nativeDialog.openFile,
            saveFile: isE2e
                ? () => invoke("e2e_save_path")
                : nativeDialog.saveFile,
        };
    }

    const loadingProgressPercent = $derived.by(() => {
        const totalFrames = frameStore.loadingTotalFrames;
        if (
            totalFrames !== null &&
            totalFrames > 0 &&
            frameStore.loadingFrameCount > 0
        ) {
            return Math.round(
                (Math.min(frameStore.loadingFrameCount, totalFrames) /
                    totalFrames) *
                    100,
            );
        }

        return frameStore.loadingProgress ?? 0;
    });

    const loadingLabel = $derived.by(() => {
        const totalFrames = frameStore.loadingTotalFrames;
        if (
            totalFrames !== null &&
            totalFrames > 0 &&
            frameStore.loadingFrameCount > 0
        ) {
            return `Loading frame ${Math.min(
                frameStore.loadingFrameCount,
                totalFrames,
            )} of ${totalFrames}`;
        }

        if (frameStore.loadingProgress !== null) {
            return `Loading ${frameStore.loadingProgress}%`;
        }

        return "Loading";
    });

    const backend: GifBackend = {
        decodeStreaming: async (path, onStart, onFrame, onProgress) => {
            const channel = new Channel<DecodeEvent>();
            channel.onmessage = (event) => {
                if (event.type === "start") {
                    onStart(event.data);
                } else if (event.type === "frame") {
                    onFrame(event.data);
                } else if (event.type === "progress") {
                    const percentage =
                        event.data.totalBytes === 0
                            ? 0
                            : Math.round(
                                  (event.data.bytesRead /
                                      event.data.totalBytes) *
                                      100,
                              );
                    onProgress(percentage);
                }
            };
            await invoke("decode_gif_stream", { path, onEvent: channel });
        },
        export: (frames, path) => invoke("export_gif", { frames, path }),
    };

    async function handleOpen() {
        loading = true;
        statusMessage = "";
        try {
            const result = await openGifStreaming(
                getDialog(),
                backend,
                (frame) => frameStore.addFrame(frame),
                (progress) => frameStore.setLoadingProgress(progress),
                {
                    beforeDecode: async () => {
                        frameStore.startLoading();
                        await waitForNextPaint();
                    },
                    onStart: (start) => {
                        frameStore.setLoadingTotalFrames(start.totalFrames);
                    },
                },
            );
            if (result.error) {
                statusMessage = result.error;
            } else {
                statusMessage = result.message ?? "";
                onLoad?.();
            }
        } finally {
            if (frameStore.isLoading) {
                await waitForNextPaint();
                frameStore.finishLoading();
            }
            loading = false;
        }
    }

    async function handleExport() {
        loading = true;
        statusMessage = "Exporting…";
        try {
            const result = await exportGif(
                getDialog(),
                backend,
                frameStore.frames,
            );
            if (result.error) {
                statusMessage = result.error;
            } else if (result.message) {
                statusMessage = result.message;
            } else {
                statusMessage = "";
            }
        } finally {
            loading = false;
        }
    }

    function confirmSave() {
        showSaveInput = false;
        saveResolve?.(savePath || null);
        saveResolve = null;
    }

    function cancelSave() {
        showSaveInput = false;
        saveResolve?.(null);
        saveResolve = null;
    }

    function handleClose() {
        showCloseConfirm = true;
    }

    function confirmClose() {
        frameStore.clear();
        showCloseConfirm = false;
    }

    function cancelClose() {
        showCloseConfirm = false;
    }

    async function handleOpenGitHub() {
        await openUrl("https://github.com/kimgoetzke/screeny");
        showHelpMenu = false;
    }

    async function handleMinimiseWindow() {
        await getCurrentWindow().minimize();
    }

    async function handleToggleMaximiseWindow() {
        await getCurrentWindow().toggleMaximize();
    }

    async function handleCloseWindow() {
        await getCurrentWindow().close();
    }
</script>

{#if showFilePicker}
    <FilePicker
        onConfirm={handleFilePickerConfirm}
        onCancel={handleFilePickerCancel}
    />
{/if}

{#if showCloseConfirm}
    <NotificationDialog
        message={"Any unsaved changes will be lost.\nDo you want to continue?"}
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={confirmClose}
        onCancel={cancelClose}
    />
{/if}

{#if showHelpMenu}
    <HelpMenu
        version={appVersion}
        keyBindings={helpKeyBindings}
        onClose={() => (showHelpMenu = false)}
        onOpenGitHub={handleOpenGitHub}
    />
{/if}

<div class="toolbar" data-testid="toolbar">
    <div class="toolbar-primary">
        {#if frameStore.hasFrames}
            <button
                onclick={handleClose}
                disabled={loading}
                data-testid="btn-close">Close</button
            >
        {:else}
            <button
                onclick={handleOpen}
                disabled={loading}
                data-testid="btn-open">Open</button
            >
        {/if}
        <button
            onclick={handleExport}
            disabled={loading || !frameStore.hasFrames}
            data-testid="btn-export"
        >
            Export
        </button>
        <div class="toolbar-drag-region" data-tauri-drag-region></div>
    </div>

    {#if frameStore.hasFrames}
        <div class="toolbar-playback">
            <button
                class="icon-btn"
                onclick={() => frameStore.play()}
                disabled={frameStore.isPlaying}
                data-testid="btn-play"
                title="Play"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                >
                    <polygon points="3,2 13,8 3,14" fill="currentColor" />
                </svg>
            </button>
            <button
                class="icon-btn"
                onclick={() => frameStore.stop()}
                disabled={!frameStore.isPlaying}
                data-testid="btn-stop"
                title="Stop"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="3"
                        width="10"
                        height="10"
                        fill="currentColor"
                    />
                </svg>
            </button>
        </div>
    {/if}

    <div class="toolbar-feedback">
        <div class="toolbar-status-area">
            {#if showSaveInput}
                <div class="save-input-row" data-testid="save-input-row">
                    <input
                        type="text"
                        bind:value={savePath}
                        placeholder="~/export.gif"
                        data-testid="save-path-input"
                        onkeydown={(e) => {
                            if (e.key === "Enter") confirmSave();
                            if (e.key === "Escape") cancelSave();
                        }}
                    />
                    <button onclick={confirmSave} data-testid="btn-save-confirm"
                        >Save</button
                    >
                    <button onclick={cancelSave} data-testid="btn-save-cancel"
                        >Cancel</button
                    >
                </div>
            {:else if frameStore.isLoading}
                    <div class="loading-progress" data-testid="loading-progress">
                        <div class="progress-track">
                            <div
                                class="progress-fill"
                                style="width: {loadingProgressPercent}%"
                            ></div>
                        </div>
                        <span class="progress-label">{loadingLabel}</span>
                </div>
            {:else if statusMessage}
                <span class="status" data-testid="status-message"
                    >{statusMessage}</span
                >
            {/if}
        </div>

        <div class="toolbar-titlebar-actions">
            <button
                class="icon-btn titlebar-btn"
                onclick={() => (showHelpMenu = true)}
                data-testid="btn-help"
                title="Help"
                aria-label="Open help menu"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                >
                    <path
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        d="M5.5 5.5 A2.5 2.5 0 0 1 10.5 5.5 C10.5 8 8 7.5 8 9.5 L8 10.5"
                    />
                    <circle cx="8" cy="13" r="0.85" fill="currentColor" />
                </svg>
            </button>

            <div class="window-controls">
                <button
                    class="icon-btn titlebar-btn window-control-btn"
                    onclick={handleMinimiseWindow}
                    data-testid="btn-window-minimise"
                    title="Minimise window"
                    aria-label="Minimise window"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                    >
                        <rect
                            x="3"
                            y="7.25"
                            width="10"
                            height="1.5"
                            fill="currentColor"
                        />
                    </svg>
                </button>
                <button
                    class="icon-btn titlebar-btn window-control-btn"
                    onclick={handleToggleMaximiseWindow}
                    data-testid="btn-window-maximise"
                    title="Maximise window"
                    aria-label="Maximise window"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                    >
                        <rect
                            x="3.25"
                            y="3.25"
                            width="9.5"
                            height="9.5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                    </svg>
                </button>
                <button
                    class="icon-btn titlebar-btn window-control-btn window-close-btn"
                    onclick={handleCloseWindow}
                    data-testid="btn-window-close"
                    title="Close window"
                    aria-label="Close window"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                    >
                        <path
                            fill="currentColor"
                            d="M4.28 3.22 8 6.94l3.72-3.72 1.06 1.06L9.06 8l3.72 3.72-1.06 1.06L8 9.06l-3.72 3.72-1.06-1.06L6.94 8 3.22 4.28Z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 16px;
        padding: 10px 16px;
        background: var(--color-bg-elevated);
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
    }

    .toolbar-primary,
    .toolbar-playback,
    .toolbar-feedback {
        display: flex;
        gap: 10px;
        align-items: center;
        min-width: 0;
    }

    .toolbar-primary {
        grid-column: 1;
        justify-self: start;
        width: 100%;
    }

    .toolbar-playback {
        grid-column: 2;
        justify-self: center;
    }

    .toolbar-feedback {
        grid-column: 3;
        justify-self: end;
        width: 100%;
        justify-content: flex-end;
        gap: 12px;
    }

    .toolbar-drag-region,
    .toolbar-status-area {
        min-width: 0;
        flex: 1;
    }

    .toolbar-drag-region {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        user-select: none;
    }

    .toolbar-status-area,
    .toolbar-titlebar-actions,
    .window-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .toolbar-status-area {
        justify-content: flex-end;
    }

    .toolbar-titlebar-actions {
        flex-shrink: 0;
    }

    .window-controls {
        gap: 0;
        border-radius: 8px;
    }

    .icon-btn {
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .titlebar-btn {
        min-width: 36px;
        min-height: 36px;
        padding: 0;
    }

    .window-control-btn {
        border: 1px solid var(--color-border);
        border-radius: 0;
        position: relative;
        margin-left: -1px;
    }

    .window-controls .window-control-btn:first-child {
        border-radius: 8px 0 0 8px;
        margin-left: 0;
    }

    .window-controls .window-control-btn:last-child {
        border-radius: 0 8px 8px 0;
    }

    .window-control-btn:hover:not(:disabled) {
        z-index: 1;
    }

    .window-close-btn:hover:not(:disabled) {
        background: var(--color-error);
        border-color: var(--color-error);
        color: white;
    }

    button {
        padding: 8px 20px;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background: var(--color-surface);
        color: var(--color-text-brightest);
        font-size: 15px;
        cursor: pointer;
    }

    button:hover:not(:disabled) {
        background: var(--color-border);
        border-color: var(--color-text-muted);
    }

    button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .status {
        font-size: 14px;
        color: var(--color-text-muted);
        padding: 4px 8px;
    }

    .save-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        max-width: 520px;
    }

    .save-input-row input[type="text"] {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background: var(--color-surface);
        color: var(--color-text-brightest);
        font-size: 14px;
        min-width: 0;
    }

    .save-input-row input[type="text"]:focus {
        outline: none;
        border-color: var(--color-text-muted);
    }

    .save-input-row button {
        padding: 6px 14px;
        font-size: 14px;
    }

    .loading-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-width: 0;
        max-width: 420px;
    }

    .progress-track {
        flex: 1;
        height: 6px;
        background: var(--color-border);
        border-radius: 3px;
        overflow: hidden;
        min-width: 0;
    }

    .progress-fill {
        height: 100%;
        background: var(--color-accent);
        border-radius: 3px;
        transition: width 0.1s ease;
    }

    .progress-label {
        font-size: 13px;
        color: var(--color-text-muted);
        white-space: nowrap;
        flex-shrink: 0;
    }
</style>
