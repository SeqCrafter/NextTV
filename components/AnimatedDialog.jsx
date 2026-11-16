"use client";

import { useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDialogLifecycle } from "@/hooks/useDialogLifecycle";
import { backdropMotion, reducedMotionQuery, surfaceMotion } from "@/lib/motion";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AnimatedDialog({ isOpen, ...props }) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && <DialogSurface key="dialog" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function DialogSurface({ children, onClose, className, overlayClassName, label, labelledBy, initialFocusSelector }) {
  const dialogRef = useRef(null);
  const isPresent = useIsPresent();
  const isSheet = useMediaQuery("(max-width: 639px)");
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  useDialogLifecycle({ dialogRef, onClose, isPresent, initialFocusSelector });

  return (
    <m.div
      {...backdropMotion}
      className={overlayClassName}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <m.div
        {...surfaceMotion(isSheet, reduceMotion)}
        layoutRoot
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={className}
      >
        {children}
      </m.div>
    </m.div>
  );
}
