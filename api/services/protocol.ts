import type { ConflictInfo } from "../../shared/types.js";

function generatePermutation(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applyPermutation(matrix: number[][], p: number[], q: number[]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[p[i]][q[j]] = matrix[i][j];
    }
  }
  return result;
}

function getRowSignature(
  matrix: number[][],
  row: number,
  selectedCols: Set<number>
): string {
  const vals: number[] = [];
  for (const col of Array.from(selectedCols).sort((a, b) => a - b)) {
    vals.push(matrix[row][col]);
  }
  return vals.join(",");
}

function getColSignature(
  matrix: number[][],
  col: number,
  selectedRows: Set<number>
): string {
  const vals: number[] = [];
  for (const row of Array.from(selectedRows).sort((a, b) => a - b)) {
    vals.push(matrix[row][col]);
  }
  return vals.join(",");
}

function findRowConflicts(
  matrix: number[][],
  selectedCells: { row: number; col: number }[]
): ConflictInfo[] {
  const rows = matrix.length;
  const rowToCols = new Map<number, Set<number>>();
  for (const { row, col } of selectedCells) {
    if (!rowToCols.has(row)) rowToCols.set(row, new Set());
    rowToCols.get(row)!.add(col);
  }

  const sigMap = new Map<string, number[]>();
  for (let i = 0; i < rows; i++) {
    const cols = rowToCols.get(i);
    if (!cols || cols.size === 0) {
      const key = "__empty__";
      if (!sigMap.has(key)) sigMap.set(key, []);
      sigMap.get(key)!.push(i);
      continue;
    }
    const sig = getRowSignature(matrix, i, cols);
    if (!sigMap.has(sig)) sigMap.set(sig, []);
    sigMap.get(sig)!.push(i);
  }

  const conflicts: ConflictInfo[] = [];
  for (const [sig, indices] of sigMap) {
    if (indices.length > 1) {
      const ambiguousPositions: { row: number; col: number }[] = [];
      const suggestionSet = new Set<string>();
      const suggestions: { row: number; col: number }[] = [];

      for (const i of indices) {
        const cols = rowToCols.get(i) || new Set();
        for (const c of cols) {
          ambiguousPositions.push({ row: i, col: c });
        }
      }

      let isIdentical = true;
      for (let c = 0; c < matrix[0].length; c++) {
        const vals = indices.map((i) => matrix[i][c]);
        if (new Set(vals).size > 1) {
          isIdentical = false;
          for (const i of indices) {
            const key = `${i},${c}`;
            if (!suggestionSet.has(key)) {
              suggestionSet.add(key);
              suggestions.push({ row: i, col: c });
            }
          }
        }
      }

      conflicts.push({
        type: "row",
        indices,
        signature: sig,
        isIdentical,
        ambiguousPositions,
        suggestion: suggestions,
      });
    }
  }

  return conflicts;
}

function findColConflicts(
  matrix: number[][],
  selectedCells: { row: number; col: number }[]
): ConflictInfo[] {
  const cols = matrix[0].length;
  const colToRows = new Map<number, Set<number>>();
  for (const { row, col } of selectedCells) {
    if (!colToRows.has(col)) colToRows.set(col, new Set());
    colToRows.get(col)!.add(row);
  }

  const sigMap = new Map<string, number[]>();
  for (let j = 0; j < cols; j++) {
    const rows = colToRows.get(j);
    if (!rows || rows.size === 0) {
      const key = "__empty__";
      if (!sigMap.has(key)) sigMap.set(key, []);
      sigMap.get(key)!.push(j);
      continue;
    }
    const sig = getColSignature(matrix, j, rows);
    if (!sigMap.has(sig)) sigMap.set(sig, []);
    sigMap.get(sig)!.push(j);
  }

  const conflicts: ConflictInfo[] = [];
  for (const [sig, indices] of sigMap) {
    if (indices.length > 1) {
      const ambiguousPositions: { row: number; col: number }[] = [];
      const suggestionSet = new Set<string>();
      const suggestions: { row: number; col: number }[] = [];

      for (const j of indices) {
        const rows = colToRows.get(j) || new Set();
        for (const r of rows) {
          ambiguousPositions.push({ row: r, col: j });
        }
      }

      let isIdentical = true;
      for (let r = 0; r < matrix.length; r++) {
        const vals = indices.map((j) => matrix[r][j]);
        if (new Set(vals).size > 1) {
          isIdentical = false;
          for (const j of indices) {
            const key = `${r},${j}`;
            if (!suggestionSet.has(key)) {
              suggestionSet.add(key);
              suggestions.push({ row: r, col: j });
            }
          }
        }
      }

      conflicts.push({
        type: "col",
        indices,
        signature: sig,
        isIdentical,
        ambiguousPositions,
        suggestion: suggestions,
      });
    }
  }

  return conflicts;
}

export function createRandomMatrix(rows: number, cols: number, density: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < density ? 1 : 0))
  );
}

export function simulate(
  matrix: number[][],
  selectedCells: { row: number; col: number }[]
) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  const p = generatePermutation(rows);
  const q = generatePermutation(cols);
  const permutedMatrix = applyPermutation(matrix, p, q);

  const bobView: (number | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );
  const selectedSet = new Set(selectedCells.map((c) => `${c.row},${c.col}`));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (selectedSet.has(`${i},${j}`)) {
        bobView[p[i]][q[j]] = matrix[i][j];
      }
    }
  }

  const rowConflicts = findRowConflicts(matrix, selectedCells);
  const colConflicts = findColConflicts(matrix, selectedCells);
  const allConflicts = [...rowConflicts, ...colConflicts];
  const success = allConflicts.length === 0;

  let reconstructedMatrix: number[][] | null = null;
  let matchRate = 0;

  if (success) {
    reconstructedMatrix = matrix.map((r) => [...r]);
    matchRate = 1;
  } else {
    const totalCells = rows * cols;
    const selectedCount = selectedCells.length;
    const conflictCellSet = new Set<string>();
    for (const c of allConflicts) {
      for (const pos of c.ambiguousPositions) {
        conflictCellSet.add(`${pos.row},${pos.col}`);
      }
    }
    matchRate = selectedCount > 0 ? (selectedCount - conflictCellSet.size) / totalCells : 0;
  }

  return {
    success,
    permutedMatrix,
    permutationP: p,
    permutationQ: q,
    bobView,
    reconstructedMatrix,
    conflicts: success ? null : allConflicts,
    matchRate,
  };
}

export function suggest(
  matrix: number[][],
  selectedCells: { row: number; col: number }[],
  conflicts: ConflictInfo[]
): { additionalCells: { row: number; col: number }[]; reason: string } {
  const selectedSet = new Set(selectedCells.map((c) => `${c.row},${c.col}`));
  const additionalSet = new Set<string>();
  const additionalCells: { row: number; col: number }[] = [];
  const reasons: string[] = [];

  for (const conflict of conflicts) {
    for (const cell of conflict.suggestion) {
      const key = `${cell.row},${cell.col}`;
      if (!selectedSet.has(key) && !additionalSet.has(key)) {
        additionalSet.add(key);
        additionalCells.push(cell);
      }
    }
    if (conflict.type === "row") {
      reasons.push(
        `行 [${conflict.indices.join(",")}] 签名冲突("${conflict.signature}")`
      );
    } else {
      reasons.push(
        `列 [${conflict.indices.join(",")}] 签名冲突("${conflict.signature}")`
      );
    }
  }

  return {
    additionalCells,
    reason: reasons.join("; "),
  };
}
