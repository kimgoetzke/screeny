type KeyboardTargetLike = {
  tagName?: string;
  isContentEditable?: boolean;
  parentElement?: KeyboardTargetLike | null;
};

type KeyboardBindingEvent = {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  target?: EventTarget | KeyboardTargetLike | null;
};

function asKeyboardTarget(target: EventTarget | KeyboardTargetLike | null | undefined) {
  if (!target || typeof target !== "object") return null;
  return target as KeyboardTargetLike;
}

export function isTextEditingTarget(target: EventTarget | KeyboardTargetLike | null | undefined) {
  let currentTarget = asKeyboardTarget(target);

  while (currentTarget) {
    const tagName = currentTarget.tagName?.toUpperCase();
    if (tagName === "INPUT" || tagName === "TEXTAREA" || currentTarget.isContentEditable) {
      return true;
    }
    currentTarget = currentTarget.parentElement ?? null;
  }

  return false;
}

export function isContextualKeyboardBinding(event: KeyboardBindingEvent) {
  return (
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey &&
    !event.metaKey &&
    (event.key === "Enter" || event.key === "Escape")
  );
}

export function shouldHandleTimelineKeyboardBinding(event: KeyboardBindingEvent) {
  return !isContextualKeyboardBinding(event) && !isTextEditingTarget(event.target);
}
