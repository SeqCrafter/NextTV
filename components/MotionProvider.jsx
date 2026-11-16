"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import { snappySpring } from "@/lib/motion";

export function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={snappySpring}>
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
