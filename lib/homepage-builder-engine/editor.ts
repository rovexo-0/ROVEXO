import type { HomepageEditorState, HomepageSection } from "@/lib/homepage-builder-engine/types";

export function createEditorState(sections: HomepageSection[]): HomepageEditorState {
  return { sections: [...sections], undoStack: [], redoStack: [] };
}

function pushUndo(state: HomepageEditorState, previous: HomepageSection[]): HomepageEditorState {
  return {
    ...state,
    undoStack: [...state.undoStack, previous].slice(-50),
    redoStack: [],
  };
}

export function reorderSections(sections: HomepageSection[], fromIndex: number, toIndex: number): HomepageSection[] {
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return sections;
  next.splice(toIndex, 0, moved);
  return next.map((s, i) => ({ ...s, order: i }));
}

export function duplicateSection(section: HomepageSection): HomepageSection {
  return {
    ...section,
    id: `${section.id}-copy-${Date.now()}`,
    label: `${section.label} (Copy)`,
    published: false,
    locked: false,
    pinned: false,
  };
}

export function moveSection(state: HomepageEditorState, sectionId: string, toIndex: number): HomepageEditorState {
  const fromIndex = state.sections.findIndex((s) => s.id === sectionId);
  if (fromIndex < 0) return state;
  const previous = state.sections;
  const sections = reorderSections(state.sections, fromIndex, toIndex);
  return pushUndo({ ...state, sections, selectedSectionId: sectionId }, previous);
}

export function hideSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const previous = state.sections;
  const sections = state.sections.map((s) => (s.id === sectionId ? { ...s, hidden: true } : s));
  return pushUndo({ ...state, sections }, previous);
}

export function showSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const previous = state.sections;
  const sections = state.sections.map((s) => (s.id === sectionId ? { ...s, hidden: false } : s));
  return pushUndo({ ...state, sections }, previous);
}

export function lockSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const sections = state.sections.map((s) => (s.id === sectionId ? { ...s, locked: true } : s));
  return { ...state, sections };
}

export function unlockSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const sections = state.sections.map((s) => (s.id === sectionId ? { ...s, locked: false } : s));
  return { ...state, sections };
}

export function pinSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const sections = state.sections.map((s) => (s.id === sectionId ? { ...s, pinned: true } : s));
  return { ...state, sections };
}

export function deleteSection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const target = state.sections.find((s) => s.id === sectionId);
  if (target?.locked) return state;
  const previous = state.sections;
  const sections = state.sections.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }));
  return pushUndo({ ...state, sections, selectedSectionId: undefined }, previous);
}

export function copySection(state: HomepageEditorState, sectionId: string): HomepageEditorState {
  const section = state.sections.find((s) => s.id === sectionId);
  if (!section) return state;
  return { ...state, clipboard: { ...section } };
}

export function pasteSection(state: HomepageEditorState): HomepageEditorState {
  if (!state.clipboard) return state;
  const previous = state.sections;
  const pasted = duplicateSection(state.clipboard);
  pasted.order = state.sections.length;
  return pushUndo({ ...state, sections: [...state.sections, pasted] }, previous);
}

export function undoEditor(state: HomepageEditorState): HomepageEditorState {
  const previous = state.undoStack[state.undoStack.length - 1];
  if (!previous) return state;
  return {
    sections: previous,
    clipboard: state.clipboard,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, state.sections],
    selectedSectionId: state.selectedSectionId,
  };
}

export function redoEditor(state: HomepageEditorState): HomepageEditorState {
  const next = state.redoStack[state.redoStack.length - 1];
  if (!next) return state;
  return {
    sections: next,
    clipboard: state.clipboard,
    undoStack: [...state.undoStack, state.sections],
    redoStack: state.redoStack.slice(0, -1),
    selectedSectionId: state.selectedSectionId,
  };
}

export function autosaveSections(sections: HomepageSection[]): { savedAt: string; sectionCount: number } {
  return { savedAt: new Date().toISOString(), sectionCount: sections.length };
}
