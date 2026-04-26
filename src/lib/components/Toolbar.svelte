<script lang="ts">
    import { onMount } from "svelte";
    import { getVersion } from "@tauri-apps/api/app";
    import { invoke } from "@tauri-apps/api/core";
    import { openUrl } from "@tauri-apps/plugin-opener";
    import HelpMenu from "$lib/components/HelpMenu.svelte";
    import WindowControls from "$lib/components/WindowControls.svelte";
    import { frameStore } from "$lib/stores/frames.svelte";
    import { createProjectLifecycle } from "$lib/projectLifecycle";
    import type { DialogProvider } from "$lib/actions";
    import { helpKeyBindings } from "$lib/help-keybindings";
    import FilePicker from "$lib/components/FilePicker.svelte";
    import NotificationDialog from "$lib/components/NotificationDialog.svelte";
    import { cancelCurrentGifDecode, tauriGifBackend } from "$lib/tauriGifBackend";

    let { onLoad }: { onLoad?: () => Promise<void> | void } = $props();

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

        if (
            frameStore.loadingProgress !== null &&
            frameStore.loadingProgress > 0
        ) {
            return `Loading ${frameStore.loadingProgress}%`;
        }

        return "Loading...";
    });

    const { handleOpen, handleCancelLoad, handleExport } = createProjectLifecycle({
        getDialog,
        backend: tauriGifBackend,
        onLoad: async () => { await onLoad?.(); },
        onLoadingChange: (v) => { loading = v; },
        onStatusChange: (v) => { statusMessage = v; },
        cancelDecode: cancelCurrentGifDecode,
    });

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

    function toggleHelpMenu() {
        showHelpMenu = !showHelpMenu;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
        if (
            !event.ctrlKey &&
            !event.altKey &&
            !event.shiftKey &&
            !event.metaKey &&
            event.key === "F1"
        ) {
            event.preventDefault();
            toggleHelpMenu();
            return;
        }

        if (
            event.ctrlKey &&
            !event.altKey &&
            !event.shiftKey &&
            !event.metaKey &&
            (event.key === "q" || event.key === "Q")
        ) {
            if (!frameStore.hasFrames) return;
            event.preventDefault();
            handleClose();
        }
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

    $effect(() => {
        window.addEventListener("keydown", handleWindowKeyDown);
        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
        };
    });
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
        {#if frameStore.isLoading}
            <button
                onclick={handleCancelLoad}
                data-testid="btn-cancel">Cancel</button
            >
        {:else if frameStore.hasFrames}
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
        {#if !showSaveInput && (frameStore.isLoading || statusMessage)}
            <div class="toolbar-inline-feedback">
                {#if frameStore.isLoading}
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
        {/if}
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
        {/if}

        <div class="toolbar-titlebar-actions">
            <button
                class="icon-btn titlebar-btn"
                onclick={toggleHelpMenu}
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

            <WindowControls />
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
        gap: 12px;
        justify-content: flex-end;
    }

    .toolbar-drag-region {
        min-width: 0;
        flex: 1;
    }

    .toolbar-inline-feedback {
        display: flex;
        align-items: center;
        min-width: 0;
        max-width: 420px;
        flex: 0 1 420px;
    }

    .toolbar-drag-region {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        user-select: none;
    }

    .toolbar-titlebar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
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
        min-width: 0;
        white-space: nowrap;
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
