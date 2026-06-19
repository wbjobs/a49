export interface ConflictInfo {
  type: "row" | "col";
  indices: number[];
  signature: string;
  isIdentical: boolean;
  ambiguousPositions: { row: number; col: number }[];
  suggestion: { row: number; col: number }[];
}

export interface SimulateRequest {
  matrix: number[][];
  selectedCells: { row: number; col: number }[];
}

export interface SimulateResponse {
  success: boolean;
  permutedMatrix: number[][];
  permutationP: number[];
  permutationQ: number[];
  bobView: (number | null)[][];
  reconstructedMatrix: number[][] | null;
  conflicts: ConflictInfo[] | null;
  matchRate: number;
}

export interface CreateMatrixRequest {
  rows: number;
  cols: number;
  density: number;
}

export interface CreateMatrixResponse {
  matrix: number[][];
  id: string;
}

export interface SuggestRequest {
  matrix: number[][];
  selectedCells: { row: number; col: number }[];
  conflicts: ConflictInfo[];
}

export interface SuggestResponse {
  additionalCells: { row: number; col: number }[];
  reason: string;
}

export interface BatchSimulateRequest {
  matrix: number[][];
  strategies: {
    label: string;
    selectedCells: { row: number; col: number }[];
  }[];
}

export interface StrategyRunSummary {
  label: string;
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

export interface BatchSimulateResponse {
  results: StrategyRunSummary[];
  totalMs: number;
}
