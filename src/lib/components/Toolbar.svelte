<script lang="ts">
    import { onMount } from "svelte";
    import { getVersion } from "@tauri-apps/api/app";
    import { openUrl } from "@tauri-apps/plugin-opener";
    import HelpMenu from "$lib/components/HelpMenu.svelte";
    import WindowControls from "$lib/components/WindowControls.svelte";
    import { frameStore } from "$lib/stores/frames.svelte";
    import type { ProjectLifecycle } from "$lib/project-lifecycle/projectLifecycle.svelte";
    import { helpKeyBindings } from "$lib/app-shell/help-keybindings";
    import { isContextualKeyboardBinding } from "$lib/app-shell/keyboardPolicy";

    let { lifecycle }: { lifecycle: ProjectLifecycle } = $props();

    let showHelpMenu = $state(false);
    let appVersion = $state("Loading…");

    const toolbarFeedback = $derived(lifecycle.toolbarFeedback);

    onMount(() => {
        getVersion().then((version) => {
            appVersion = version;
        });
    });

    function toggleHelpMenu() {
        showHelpMenu = !showHelpMenu;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
        if (isContextualKeyboardBinding(event)) return;

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
            if (!lifecycle.canClose) return;
            event.preventDefault();
            lifecycle.requestClose();
        }
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
        {#if lifecycle.projectState === "Loading"}
            <button
                onclick={() => {
                    void lifecycle.cancel();
                }}
                data-testid="btn-cancel">Cancel</button
            >
        {:else if lifecycle.hasProject}
            <button
                onclick={() => lifecycle.requestClose()}
                disabled={!lifecycle.canClose}
                data-testid="btn-close">Close</button
            >
        {:else}
            <button
                onclick={() => {
                    void lifecycle.open();
                }}
                disabled={!lifecycle.canOpen}
                data-testid="btn-open">Open</button
            >
        {/if}
        {#if lifecycle.canImport}
            <button
                onclick={() => {
                    void lifecycle.importFrames();
                }}
                data-testid="btn-import"
            >
                Import
            </button>
        {/if}
        <button
            onclick={() => {
                void lifecycle.export();
            }}
            disabled={!lifecycle.canExport}
            data-testid="btn-export"
        >
            Export
        </button>
        {#if toolbarFeedback.kind !== "none"}
            <div class="toolbar-inline-feedback">
                {#if toolbarFeedback.kind === "loading"}
                    <div class="loading-progress" data-testid="loading-progress">
                        <div class="progress-track">
                            <div
                                class="progress-fill"
                                style="width: {toolbarFeedback.percent}%"
                            ></div>
                        </div>
                        <span class="progress-label">{toolbarFeedback.label}</span>
                    </div>
                {:else if toolbarFeedback.kind === "status"}
                    <span class="status" data-testid="status-message"
                        >{toolbarFeedback.message}</span
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
        display: flex;
        align-items: center;
        justify-content: flex-end;
        user-select: none;
    }

    .toolbar-inline-feedback {
        display: flex;
        align-items: center;
        min-width: 0;
        max-width: 420px;
        flex: 0 1 420px;
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
