"use client";

import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { reducedMotionQuery } from "@/lib/motion";

export function ResultItem({ index, children }) {
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  return (
    <m.div
      initial={index < 6 ? { opacity: 0, y: reduceMotion ? 0 : 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", duration: reduceMotion ? 0.1 : 0.22, ease: "easeOut", delay: reduceMotion || index >= 6 ? 0 : index * 0.025 }}
    >
      {children}
    </m.div>
  );
}
