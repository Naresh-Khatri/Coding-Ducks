"use client";

import { createContext, useContext, useState } from "react";

interface ProblemActions {
  isRunning: boolean;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  onRun: () => void;
  onSubmit: () => void;
}

const ProblemActionsContext = createContext<ProblemActions>({
  isRunning: false,
  isSubmitting: false,
  isAuthenticated: false,
  onRun: () => {},
  onSubmit: () => {},
});

export function ProblemActionsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ProblemActions;
}) {
  return (
    <ProblemActionsContext.Provider value={value}>
      {children}
    </ProblemActionsContext.Provider>
  );
}

export function useProblemActions() {
  return useContext(ProblemActionsContext);
}
