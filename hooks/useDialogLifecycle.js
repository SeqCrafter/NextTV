"use client";

import { useEffect, useEffectEvent } from "react";

let scrollLocks = 0;
let previousOverflow = "";

export function useDialogLifecycle({ dialogRef, onClose, isPresent, modal = true, initialFocusSelector }) {
  const handleKeyDown = useEffectEvent((event) => {
    const dialog = dialogRef.current;
    if (event.key === "Escape" && isPresent) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab" || !modal || !dialog) return;
    if (!isPresent) {
      event.preventDefault();
      return;
    }

    const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
      .filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.focus();
    } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    if (modal) {
      if (scrollLocks === 0) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }
      scrollLocks += 1;
    }
    const initialFocus = (initialFocusSelector && dialog?.querySelector(initialFocusSelector))
      || dialog?.querySelector('[aria-selected="true"]')
      || dialog?.querySelector("input, button")
      || dialog;
    initialFocus?.focus({ preventScroll: true });

    const listener = (event) => handleKeyDown(event);
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      if (modal) {
        scrollLocks -= 1;
        if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
      }
      const focus = document.activeElement;
      if (previousFocus?.isConnected && !previousFocus.closest?.("[inert]")
        && (focus === document.body || dialog?.contains(focus))) {
        previousFocus.focus?.({ preventScroll: true });
      }
    };
  }, [dialogRef, modal, initialFocusSelector]);
}
