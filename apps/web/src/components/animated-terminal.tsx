"use client";

import { Suspense, useEffect, useRef } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";

const LANGS = ["python", "javascript", "cpp", "java"] as const;
type Language = (typeof LANGS)[number];

const SAMPLE_CODE: Record<Language, string> = {
  python: `$ python3
>>> name = "Coder"
>>> print(f"Hello, {name}!")
Hello, Coder!`,

  javascript: `$ node
> const name = "Coder"
> console.log(\`Hello, \${name}!\`)
Hello, Coder!`,

  cpp: `$ g++ hello.cpp && ./a.out
cout << "Hello, Coder!" << endl;
[Output]
Hello, Coder!`,

  java: `$ java Hello.java
System.out.println("Hello, Coder!");
[Output]
Hello, Coder!`,
};

interface SplineElements {
  terminal: any;
  dropdown: any;
  selectedLangIcons: Record<Language, any>;
}

const AnimatedTerminal = () => {
  const splineRef = useRef<Application>(undefined);
  const elementsRef = useRef<SplineElements>(undefined);
  const typingIntervalRef = useRef<NodeJS.Timeout>(undefined);
  const blinkingIntervalRef = useRef<NodeJS.Timeout>(undefined);
  const isDropdownOpen = useRef(false);
  const lastToggleAt = useRef(0);
  const targetRotation = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(undefined);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const tween = (
    duration: number,
    onUpdate: (t: number) => void,
    onComplete?: () => void,
  ) => {
    const start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      onUpdate(t);
      if (t < 1) requestAnimationFrame(step);
      else onComplete?.();
    };
    requestAnimationFrame(step);
  };

  const setDropdownVisible = (visible: boolean) => {
    if (!splineRef.current || !elementsRef.current?.dropdown) return;
    const dropdown = elementsRef.current.dropdown;
    const fromY = dropdown.position.y;
    const toY = visible ? 30 : 80;

    // Make items visible BEFORE animating opacity up
    if (visible) {
      LANGS.forEach((lang) => {
        const obj = splineRef.current?.findObjectByName(lang);
        if (obj) obj.visible = true;
      });
    }

    tween(300, (t) => {
      dropdown.position.y = fromY + (toY - fromY) * t;
    });

    LANGS.forEach((lang, i) => {
      const from = visible ? 0 : 100;
      const to = visible ? 100 : 0;
      setTimeout(() => {
        tween(
          300,
          (t) => {
            splineRef.current?.setVariable(
              `${lang}-opacity`,
              from + (to - from) * t,
            );
          },
          () => {
            if (!visible) {
              const obj = splineRef.current?.findObjectByName(lang);
              if (obj) obj.visible = false;
            }
          },
        );
      }, i * 80);
    });
  };

  const selectLanguage = (lang: Language) => {
    if (!splineRef.current || !elementsRef.current) return;

    splineRef.current.setVariable("selected-lang", lang);
    Object.entries(elementsRef.current.selectedLangIcons).forEach(
      ([l, icon]) => {
        if (icon) icon.visible = l === lang;
      },
    );

    const code = SAMPLE_CODE[lang];
    let idx = 0;
    let cursorVisible = true;

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (blinkingIntervalRef.current) clearInterval(blinkingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      if (!splineRef.current) {
        clearInterval(typingIntervalRef.current);
        return;
      }
      if (idx < code.length) {
        splineRef.current.setVariable(
          "terminal-text",
          code.slice(0, idx) + "_",
        );
        idx++;
      } else {
        clearInterval(typingIntervalRef.current);
        blinkingIntervalRef.current = setInterval(() => {
          if (!splineRef.current) {
            clearInterval(blinkingIntervalRef.current);
            return;
          }
          cursorVisible = !cursorVisible;
          splineRef.current.setVariable(
            "terminal-text",
            code + (cursorVisible ? "_" : ""),
          );
        }, 530);
      }
    }, 50);
  };

  const initializeElements = (app: Application) => {
    splineRef.current = app;
    elementsRef.current = {
      terminal: app.findObjectByName("terminal"),
      dropdown: app.findObjectByName("drop-down"),
      selectedLangIcons: LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [lang]: app.findObjectByName(`selected-lang-icon-${lang}`),
        }),
        {} as Record<Language, any>,
      ),
    };

    if (elementsRef.current.dropdown) {
      elementsRef.current.dropdown.visible = true;
      elementsRef.current.dropdown.position.y = 80;
    }
    LANGS.forEach((lang) => {
      const obj = app.findObjectByName(lang);
      if (obj) obj.visible = false;
      app.setVariable(`${lang}-opacity`, 0);
    });

    const terminal = elementsRef.current.terminal;
    if (terminal) {
      terminal.visible = true;
      terminal.scale.set(1, 1, 1);
      terminal.rotation.set(0, isMobile ? 0 : -0.4, 0);
      if (isMobile) {
        terminal.position.x = 0;
        terminal.position.y = -400;
        app.setVariable("sub-divs", 3);
      } else {
        terminal.position.x = 600;
        terminal.position.y = 150;
        app.setVariable("sub-divs", 6);
      }
    }

    selectLanguage("python");

    app.addEventListener("mouseDown", (e) => {
      if (LANGS.includes(e.target.name as Language)) {
        selectLanguage(e.target.name as Language);
        setDropdownVisible(false);
        isDropdownOpen.current = false;
        return;
      }
      if (e.target.name === "lang-selector") {
        const now = performance.now();
        if (now - lastToggleAt.current < 400) return;
        lastToggleAt.current = now;
        isDropdownOpen.current = !isDropdownOpen.current;
        setDropdownVisible(isDropdownOpen.current);
      }
    });
  };

  // Mouse-driven rotation with simple lerp via rAF
  useEffect(() => {
    if (isMobile) return;

    const baseY = -0.4;

    const onMouseMove = (e: MouseEvent) => {
      const normalizedX = ((e.clientX - 500) / window.innerWidth) * 2 - 1;
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotation.current = {
        x: normalizedY * 0.5,
        y: baseY + normalizedX * 0.5,
      };
    };

    const onMouseLeave = () => {
      targetRotation.current = { x: 0, y: baseY };
    };

    const tick = () => {
      const terminal = elementsRef.current?.terminal;
      if (terminal) {
        terminal.rotation.x +=
          (targetRotation.current.x - terminal.rotation.x) * 0.08;
        terminal.rotation.y +=
          (targetRotation.current.y - terminal.rotation.y) * 0.08;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    targetRotation.current = { x: 0, y: baseY };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (blinkingIntervalRef.current)
        clearInterval(blinkingIntervalRef.current);
    };
  }, []);

  return (
    <Suspense
      fallback={<div className="text-white">Loading 3D terminal...</div>}
    >
      <Spline
        onLoad={(app) => setTimeout(() => initializeElements(app), 100)}
        scene="/3d-terminal.spline"
      />
    </Suspense>
  );
};

export default AnimatedTerminal;
