import { useCallback, useRef, useState } from "react";
import type { ThemeStudioProDocument } from "@/lib/platform-visual/studio-pro/types";

type HistoryState = {
  past: ThemeStudioProDocument[];
  present: ThemeStudioProDocument;
  future: ThemeStudioProDocument[];
};

const MAX_HISTORY = 50;

export function useStudioHistory(initial: ThemeStudioProDocument) {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });
  const presentRef = useRef(initial);
  presentRef.current = state.present;

  const commit = useCallback((next: ThemeStudioProDocument, recordHistory = true) => {
    setState((current) => {
      if (!recordHistory) {
        return { ...current, present: next };
      }
      return {
        past: [...current.past, current.present].slice(-MAX_HISTORY),
        present: next,
        future: [],
      };
    });
  }, []);

  const replace = useCallback((next: ThemeStudioProDocument) => {
    setState({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    setState((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, MAX_HISTORY),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      return {
        past: [...current.past, current.present].slice(-MAX_HISTORY),
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    document: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit,
    replace,
    undo,
    redo,
    getPresent: () => presentRef.current,
  };
}
