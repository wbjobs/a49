import { create } from "zustand";
import type { ConflictInfo } from "../../shared/types";

export type ViewMode = "edit" | "simulate" | "conflict";
export type SimulatePhase = "idle" | "sending" | "permuting" | "reconstructing" | "done";

interface AppState {
  matrix: number[][];
  rows: number;
  cols: number;
  density: number;
  selectedCells: Set<string>;
  viewMode: ViewMode;
  simulatePhase: SimulatePhase;

  permutedMatrix: number[][] | null;
  permutationP: number[];
  permutationQ: number[];
  bobView: (number | null)[][] | null;
  reconstructedMatrix: number[][] | null;
  conflicts: ConflictInfo[] | null;
  matchRate: number;
  success: boolean;

  hoveredCell: { row: number; col: number } | null;
  conflictRows: Set<number>;
  conflictCols: Set<number>;
  suggestedCells: Set<string>;

  setMatrix: (matrix: number[][]) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setDensity: (density: number) => void;
  toggleCell: (row: number, col: number) => void;
  toggleCellValue: (row: number, col: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSimulatePhase: (phase: SimulatePhase) => void;
  setSimulationResult: (result: {
    success: boolean;
    permutedMatrix: number[][];
    permutationP: number[];
    permutationQ: number[];
    bobView: (number | null)[][];
    reconstructedMatrix: number[][] | null;
    conflicts: ConflictInfo[] | null;
    matchRate: number;
  }) => void;
  setHoveredCell: (cell: { row: number; col: number } | null) => void;
  setSuggestedCells: (cells: { row: number; col: number }[]) => void;
  reset: () => void;
  generateRandom: () => void;
}

const DEFAULT_ROWS = 5;
const DEFAULT_COLS = 5;
const DEFAULT_DENSITY = 0.5;

function createRandomMatrix(rows: number, cols: number, density: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < density ? 1 : 0))
  );
}

export const useStore = create<AppState>((set, get) => ({
  matrix: createRandomMatrix(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_DENSITY),
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  density: DEFAULT_DENSITY,
  selectedCells: new Set<string>(),
  viewMode: "edit",
  simulatePhase: "idle",

  permutedMatrix: null,
  permutationP: [],
  permutationQ: [],
  bobView: null,
  reconstructedMatrix: null,
  conflicts: null,
  matchRate: 0,
  success: false,

  hoveredCell: null,
  conflictRows: new Set<number>(),
  conflictCols: new Set<number>(),
  suggestedCells: new Set<string>(),

  setMatrix: (matrix) => set({ matrix }),
  setRows: (rows) => set({ rows }),
  setCols: (cols) => set({ cols }),
  setDensity: (density) => set({ density }),

  toggleCell: (row, col) =>
    set((state) => {
      const key = `${row},${col}`;
      const next = new Set(state.selectedCells);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { selectedCells: next };
    }),

  toggleCellValue: (row, col) =>
    set((state) => {
      const matrix = state.matrix.map((r) => [...r]);
      matrix[row][col] = matrix[row][col] === 0 ? 1 : 0;
      return { matrix };
    }),

  selectAll: () =>
    set((state) => {
      const cells = new Set<string>();
      for (let i = 0; i < state.rows; i++)
        for (let j = 0; j < state.cols; j++) cells.add(`${i},${j}`);
      return { selectedCells: cells };
    }),

  clearSelection: () => set({ selectedCells: new Set<string>() }),

  setViewMode: (viewMode) => set({ viewMode }),

  setSimulatePhase: (simulatePhase) => set({ simulatePhase }),

  setSimulationResult: (result) => {
    const conflictRows = new Set<number>();
    const conflictCols = new Set<number>();
    if (result.conflicts) {
      for (const c of result.conflicts) {
        if (c.type === "row") {
          for (const idx of c.indices) conflictRows.add(idx);
        } else {
          for (const idx of c.indices) conflictCols.add(idx);
        }
      }
    }
    set({
      ...result,
      conflictRows,
      conflictCols,
      simulatePhase: "done",
    });
  },

  setHoveredCell: (hoveredCell) => set({ hoveredCell }),

  setSuggestedCells: (cells) => {
    const suggestedCells = new Set(cells.map((c) => `${c.row},${c.col}`));
    set({ suggestedCells });
  },

  reset: () =>
    set({
      matrix: createRandomMatrix(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_DENSITY),
      rows: DEFAULT_ROWS,
      cols: DEFAULT_COLS,
      density: DEFAULT_DENSITY,
      selectedCells: new Set<string>(),
      viewMode: "edit",
      simulatePhase: "idle",
      permutedMatrix: null,
      permutationP: [],
      permutationQ: [],
      bobView: null,
      reconstructedMatrix: null,
      conflicts: null,
      matchRate: 0,
      success: false,
      hoveredCell: null,
      conflictRows: new Set<number>(),
      conflictCols: new Set<number>(),
      suggestedCells: new Set<string>(),
    }),

  generateRandom: () =>
    set((state) => ({
      matrix: createRandomMatrix(state.rows, state.cols, state.density),
      selectedCells: new Set<string>(),
      viewMode: "edit",
      simulatePhase: "idle",
      permutedMatrix: null,
      permutationP: [],
      permutationQ: [],
      bobView: null,
      reconstructedMatrix: null,
      conflicts: null,
      matchRate: 0,
      success: false,
      conflictRows: new Set<number>(),
      conflictCols: new Set<number>(),
      suggestedCells: new Set<string>(),
    })),
}));

if (typeof window !== "undefined") {
  (window as unknown as { __store: typeof useStore }).__store = useStore;
}
