"use client";

import { useEffect } from "react";
import { driver } from "driver.js";

import "driver.js/dist/driver.css";

const TOUR_SEEN_KEY = "sd-onboarding-seen";

function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true; // storage unavailable — don't nag.
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // ignore
  }
}

/** Briefly shakes the popover to nudge the user to keep going. */
function shakePopover() {
  const el = document.querySelector<HTMLElement>(".driver-popover");
  if (!el) return;
  el.classList.remove("sd-tour-shake");
  void el.offsetWidth; // force reflow so the animation can replay
  el.classList.add("sd-tour-shake");
}

/**
 * Fires the system-design onboarding walkthrough.
 *
 * When `strict` is true (the mandatory first run), ESC / overlay clicks /
 * close button won't dismiss it until the user reaches the last step — they
 * get a shake instead.
 */
export function startSystemDesignTour({ strict = false } = {}) {
  const tour = driver({
    showProgress: true,
    overlayColor: "rgba(0, 0, 0, 0.65)",
    allowClose: true,
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Let's build 🚀",
    popoverClass: "sd-tour-popover",
    onDestroyStarted: () => {
      const finished = tour.isLastStep();
      if (!strict || finished) {
        tour.destroy(); // triggers onDestroyed → markTourSeen()
        return;
      }
      // Not done yet — refuse to close and nudge them along.
      shakePopover();
    },
    onDestroyed: () => {
      markTourSeen();
    },
    steps: [
      {
        popover: {
          title: "Welcome to System Design 🦆",
          description:
            "You design the architecture, we throw real traffic at it. Quick 20-second tour — let's go!",
        },
      },
      {
        element: "[data-tour='sd-briefing']",
        popover: {
          title: "Your mission",
          description:
            "Read the objective and stay on budget. The checklist tracks your progress as you go.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='sd-palette']",
        popover: {
          title: "Your toolbox",
          description:
            "Databases, caches, load balancers and more. Drag one onto the canvas — or just click it.",
          side: "right",
          align: "center",
        },
      },
      {
        element: "[data-tour='sd-canvas']",
        popover: {
          title: "Your playground",
          description:
            "Arrange blocks here, then drag from one port to another to wire them together.",
          side: "left",
          align: "center",
        },
      },
      {
        element: "[data-tour='sd-start']",
        popover: {
          title: "Go live",
          description:
            "Happy with your design? Hit this and watch how it holds up under load.",
          side: "top",
          align: "center",
        },
      },
      {
        element: "[data-tour='sd-phase']",
        popover: {
          title: "Know where you are",
          description:
            "Building → Production → Results. That's the whole loop. Now go break some servers!",
          side: "bottom",
          align: "start",
        },
      },
    ],
  });

  tour.drive();
}

/**
 * Auto-starts the tour once per visitor (tracked in localStorage). The first
 * run is mandatory — it can't be dismissed until completed. Renders nothing.
 */
export function OnboardingTour() {
  useEffect(() => {
    if (hasSeenTour()) return;

    // Let the canvas + sidebar mount before we point at them.
    const timer = setTimeout(() => startSystemDesignTour({ strict: true }), 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
