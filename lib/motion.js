export const snappySpring = { type: "spring", stiffness: 480, damping: 34 };
export const pressSpring = { type: "spring", stiffness: 600, damping: 28 };
export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.14 } },
  transition: { duration: 0.18 },
};

export function surfaceMotion(isSheet, reduceMotion) {
  const hidden = reduceMotion
    ? { opacity: 0 }
    : isSheet
      ? { opacity: 0, y: "100%" }
      : { opacity: 0, y: 8, scale: 0.97 };

  return {
    initial: hidden,
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { ...hidden, transition: { duration: reduceMotion ? 0.1 : 0.16, ease: "easeIn" } },
    transition: {
      type: "spring",
      visualDuration: isSheet ? 0.3 : 0.22,
      bounce: isSheet ? 0.08 : 0.12,
      opacity: { duration: 0.16 },
    },
  };
}
