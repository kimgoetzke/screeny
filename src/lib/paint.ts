import { tick } from "svelte";

export async function waitForNextPaint(): Promise<void> {
  await tick();
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}
