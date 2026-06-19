import { create } from "zustand";
import type { ConflictInfo } from "../../shared/types";
import type { StrategyType, StrategyConfig } from "../../shared/strategies";
import { generateStrategyCells, STRATEGY_PRESETS } from "../../shared/strategies";

export type ViewMode = "edit" | "simulate" | "conflict" | "compare";
export type SimulatePhase = "idle" | "sending" | "permuting" | "reconstructing" | "done";
export type ComparePhase = "idle" | "running" | "done";

export interface StrategyRunResult {
  success: boolean;
  matchRate: number;
  selectedCount: number;
  dataTransmission: number;
  conflictCount: number;
  rowConflicts: number;
  colConflicts: number;
  iterCount: number;
  totalMs: number;
  refineMs: number;
  permuteMs: number;
  conflicts: ConflictInfo[] | null;
  bobView: (number | null)[][] | null;
  permutationP: number[];
  permutationQ: number[];
}

export interface StrategyState {
  type: StrategyType;
  config: StrategyConfig;
  selectedCells: Set<string>;
  result: StrategyRunResult | null;
}

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

  compareMode: boolean;
  comparePhase: ComparePhase;
  strategyA: StrategyState;
  strategyB: StrategyState;

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

  setCompareMode: (enabled: boolean) => void;
  setComparePhase: (phase: ComparePhase) => void;
  setStrategy: (which: "A" | "B", type: StrategyType, config?: StrategyConfig) => void;
  applyStrategyToSelection: (which: "A" | "B") => void;
  setStrategyResult: (which: "A" | "B", result: StrategyRunResult | null) => void;
  setCompareResults: (a: StrategyRunResult | null, b: StrategyRunResult | null) => void;
  clearCompareResults: () => void;
}

const DEFAULT_ROWS = 5;
const DEFAULT_COLS = 5;
const DEFAULT_DENSITY = 0.5;

function createRandomMatrix(rows: number, cols: number, density: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < density ? 1 : 0))
  );
}

function cellsToSet(cells: { row: number; col: number }[]): Set<string> {
  const s = new Set<string>();
  for (const c of cells) s.add(`${c.row},${c.col}`);
  return s;
}

function createDefaultStrategyState(typeA: StrategyType, typeB: StrategyType): {
  strategyA: StrategyState;
  strategyB: StrategyState;
} {
  const presetA = STRATEGY_PRESETS.find((p) => p.type === typeA)!;
  const presetB = STRATEGY_PRESETS.find((p) => p.type === typeB)!;
  return {
    strategyA: {
      type: typeA,
      config: { ...presetA.defaultConfig },
      selectedCells: new Set<string>(),
      result: null,
    },
    strategyB: {
      type: typeB,
      config: { ...presetB.defaultConfig },
      selectedCells: new Set<string>(),
      result: null,
    },
  };
}

const defaultStrategies = createDefaultStrategyState("cross", "main_diagonal");

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

  compareMode: false,
  comparePhase: "idle",
  ...defaultStrategies,

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
      compareMode: false,
      comparePhase: "idle",
      ...createDefaultStrategyState("cross", "main_diagonal"),
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
      comparePhase: "idle",
      strategyA: { ...state.strategyA, result: null, selectedCells: new Set() },
      strategyB: { ...state.strategyB, result: null, selectedCells: new Set() },
    })),

  setCompareMode: (enabled) =>
    set({
      compareMode: enabled,
      comparePhase: "idle",
      viewMode: enabled ? "compare" : "edit",
      ...(enabled ? createDefaultStrategyState("cross", "main_diagonal") : {}),
    }),

  setComparePhase: (comparePhase) => set({ comparePhase }),

  setStrategy: (which, type, config) => {
    const state = get();
    const key = which === "A" ? "strategyA" : "strategyB";
    const preset = STRATEGY_PRESETS.find((p) => p.type === type);
    if (!preset) return;
    const finalConfig = config ?? state[key].config;
    const cells = generateStrategyCells(state.rows, state.cols, type, finalConfig);
    set({
      [key]: {
        type,
        config: finalConfig,
        selectedCells: cellsToSet(cells),
        result: null,
      },
    } as Partial<AppState>);
  },

  applyStrategyToSelection: (which) => {
    const state = get();
    const key = which === "A" ? "strategyA" : "strategyB";
    const cells = generateStrategyCells(state.rows, state.cols, state[key].type, state[key].config);
    set({
      [key]: {
        ...state[key],
        selectedCells: cellsToSet(cells),
        result: null,
      },
    } as Partial<AppState>);
  },

  setStrategyResult: (which, result) => {
    const key = which === "A" ? "strategyA" : "strategyB";
    set((state) => ({
      [key]: { ...state[key], result },
    } as Partial<AppState>));
  },

  setCompareResults: (a, b) =>
    set((state) => ({
      strategyA: { ...state.strategyA, result: a },
      strategyB: { ...state.strategyB, result: b },
      comparePhase: "done",
    })),

  clearCompareResults: () =>
    set((state) => ({
      strategyA: { ...state.strategyA, result: null },
      strategyB: { ...state.strategyB, result: null },
      comparePhase: "idle",
    })),
}));
