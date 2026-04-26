<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";

    async function handleMinimise() {
        await getCurrentWindow().minimize();
    }

    async function handleToggleMaximise() {
        await getCurrentWindow().toggleMaximize();
    }

    async function handleClose() {
        await getCurrentWindow().close();
    }
</script>

<div class="window-controls">
    <button
        class="icon-btn titlebar-btn window-control-btn"
        onclick={handleMinimise}
        data-testid="btn-window-minimise"
        title="Minimise window"
        aria-label="Minimise window"
    >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="7.25" width="10" height="1.5" fill="currentColor" />
        </svg>
    </button>
    <button
        class="icon-btn titlebar-btn window-control-btn"
        onclick={handleToggleMaximise}
        data-testid="btn-window-maximise"
        title="Maximise window"
        aria-label="Maximise window"
    >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
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
        onclick={handleClose}
        data-testid="btn-window-close"
        title="Close window"
        aria-label="Close window"
    >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
                fill="currentColor"
                d="M4.28 3.22 8 6.94l3.72-3.72 1.06 1.06L9.06 8l3.72 3.72-1.06 1.06L8 9.06l-3.72 3.72-1.06-1.06L6.94 8 3.22 4.28Z"
            />
        </svg>
    </button>
</div>

<style>
    .window-controls {
        display: flex;
        align-items: center;
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
        background: var(--color-surface);
        color: var(--color-text-brightest);
        cursor: pointer;
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
        background: var(--color-border);
        border-color: var(--color-text-muted);
    }

    .window-close-btn:hover:not(:disabled) {
        background: var(--color-error);
        border-color: var(--color-error);
        color: white;
    }
</style>
