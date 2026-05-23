"use client";

import type { MotionValue, SpringOptions } from "motion/react";
import * as React from "react";
import { motion, useSpring, useTransform } from "motion/react";

import { cn } from "~/lib/utils";

interface SlidingNumberRollerProps {
  prevValue: number;
  value: number;
  place: number;
  transition: SpringOptions;
}

function SlidingNumberRoller({
  prevValue,
  value,
  place,
  transition,
}: SlidingNumberRollerProps) {
  const startNumber = Math.floor(prevValue / place) % 10;
  const targetNumber = Math.floor(value / place) % 10;
  const animatedValue = useSpring(startNumber, transition);

  React.useEffect(() => {
    animatedValue.set(targetNumber);
  }, [targetNumber, animatedValue]);

  return (
    <span
      data-slot="sliding-number-roller"
      className="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums"
    >
      <span className="invisible">0</span>
      {Array.from({ length: 10 }, (_, i) => (
        <SlidingNumberDisplay
          key={i}
          motionValue={animatedValue}
          number={i}
          transition={transition}
        />
      ))}
    </span>
  );
}

interface SlidingNumberDisplayProps {
  motionValue: MotionValue<number>;
  number: number;
  transition: SpringOptions;
}

function SlidingNumberDisplay({
  motionValue,
  number,
  transition,
}: SlidingNumberDisplayProps) {
  const y = useTransform(motionValue, (latest) => {
    const fontSize = 16;
    const currentNumber = latest % 10;
    const offset = (10 + number - currentNumber) % 10;
    let translateY = offset * fontSize;
    if (offset > 5) translateY -= 10 * fontSize;
    return translateY;
  });

  return (
    <motion.span
      data-slot="sliding-number-display"
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
      transition={{ ...transition, type: "spring" }}
    >
      {number}
    </motion.span>
  );
}

type SlidingNumberProps = React.ComponentProps<"span"> & {
  number: number | string;
  padStart?: boolean;
  decimalSeparator?: string;
  decimalPlaces?: number;
  transition?: SpringOptions;
};

function SlidingNumber({
  number,
  className,
  padStart = false,
  decimalSeparator = ".",
  decimalPlaces = 0,
  transition = {
    stiffness: 200,
    damping: 20,
    mass: 0.4,
  },
  ...props
}: SlidingNumberProps) {
  const prevNumberRef = React.useRef<number>(0);

  const effectiveNumber = React.useMemo(
    () => Math.abs(Number(number)),
    [number],
  );

  const formatNumber = React.useCallback(
    (num: number) =>
      decimalPlaces != null ? num.toFixed(decimalPlaces) : num.toString(),
    [decimalPlaces],
  );

  const numberStr = formatNumber(effectiveNumber);
  const [newIntStrRaw, newDecStrRaw = ""] = numberStr.split(".");
  const newIntStr =
    padStart && newIntStrRaw?.length === 1 ? "0" + newIntStrRaw : newIntStrRaw;

  const prevFormatted = formatNumber(prevNumberRef.current);
  const [prevIntStrRaw = "", prevDecStrRaw = ""] = prevFormatted.split(".");
  const prevIntStr =
    padStart && prevIntStrRaw.length === 1
      ? "0" + prevIntStrRaw
      : prevIntStrRaw;

  const adjustedPrevInt = React.useMemo(() => {
    return prevIntStr.length > (newIntStr?.length ?? 0)
      ? prevIntStr.slice(-(newIntStr?.length ?? 0))
      : prevIntStr.padStart(newIntStr?.length ?? 0, "0");
  }, [prevIntStr, newIntStr]);

  const adjustedPrevDec = React.useMemo(() => {
    if (!newDecStrRaw) return "";
    return prevDecStrRaw.length > newDecStrRaw.length
      ? prevDecStrRaw.slice(0, newDecStrRaw.length)
      : prevDecStrRaw.padEnd(newDecStrRaw.length, "0");
  }, [prevDecStrRaw, newDecStrRaw]);

  React.useEffect(() => {
    prevNumberRef.current = effectiveNumber;
  }, [effectiveNumber]);

  const intDigitCount = newIntStr?.length ?? 0;
  const intPlaces = React.useMemo(
    () =>
      Array.from({ length: intDigitCount }, (_, i) =>
        Math.pow(10, intDigitCount - i - 1),
      ),
    [intDigitCount],
  );
  const decPlaces = React.useMemo(
    () =>
      newDecStrRaw
        ? Array.from({ length: newDecStrRaw.length }, (_, i) =>
            Math.pow(10, newDecStrRaw.length - i - 1),
          )
        : [],
    [newDecStrRaw],
  );

  const newDecValue = newDecStrRaw ? parseInt(newDecStrRaw, 10) : 0;
  const prevDecValue = adjustedPrevDec ? parseInt(adjustedPrevDec, 10) : 0;

  return (
    <span
      data-slot="sliding-number"
      className={cn("flex items-center", className)}
      {...props}
    >
      {Number(number) < 0 && <span className="mr-1">-</span>}

      {intPlaces.map((place) => (
        <SlidingNumberRoller
          key={`int-${place}`}
          prevValue={parseInt(adjustedPrevInt, 10)}
          value={parseInt(newIntStr ?? "0", 10)}
          place={place}
          transition={transition}
        />
      ))}

      {newDecStrRaw && (
        <>
          <span>{decimalSeparator}</span>
          {decPlaces.map((place) => (
            <SlidingNumberRoller
              key={`dec-${place}`}
              prevValue={prevDecValue}
              value={newDecValue}
              place={place}
              transition={transition}
            />
          ))}
        </>
      )}
    </span>
  );
}

export { SlidingNumber, type SlidingNumberProps };
