"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDialogLifecycle } from "@/hooks/useDialogLifecycle";
import { useActivityPortal } from "@/hooks/useActivityPortal";
import { backdropMotion, reducedMotionQuery, surfaceMotion } from "@/lib/motion";

export function AnimatedDialog({ isOpen, ...props }) {
  const portalRoot = useActivityPortal();
  if (!portalRoot) return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && <DialogSurface key="dialog" {...props} />}
    </AnimatePresence>,
    portalRoot,
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
