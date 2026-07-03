import type { Transition } from "motion/react";

/** Crisp spring for pad position/size changes while dragging or resizing a grid cell. */
export const padLayoutSpring: Transition = { type: "spring", duration: 0.24, bounce: 0.06 };

/** Snappier spring for subtle press/lift feedback without visible wobble. */
export const padLiftSpring: Transition = { type: "spring", duration: 0.18, bounce: 0.04 };

/** Used in place of the springs above when the user prefers reduced motion. */
export const motionInstant: Transition = { duration: 0 };
