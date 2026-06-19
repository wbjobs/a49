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
