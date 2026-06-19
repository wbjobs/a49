import type { ConflictInfo } from "../../shared/types.js";

// ============================================================
// 工具函数
// ============================================================

function generatePermutation(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================
// O(k) 级别排列施加 + Bob视图构建
// ============================================================

function applyPermutationFast(
  matrix: number[][],
  p: number[],
  q: number[],
  selectedCells: { row: number; col: number }[]
): { permutedMatrix: number[][]; bobView: (number | null)[][] } {
  const n = matrix.length;
  const m = matrix[0].length;

  const permutedMatrix: number[][] = Array.from({ length: n }, () =>
    Array(m).fill(0)
  );
  const bobView: (number | null)[][] = Array.from({ length: n }, () =>
    Array(m).fill(null)
  );

  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const pRow = permutedMatrix[p[i]];
    for (let j = 0; j < m; j++) {
      if (row[j] !== 0) pRow[q[j]] = row[j];
    }
  }

  // O(k) 构建 Bob 视图：只遍历已选中的格子
  for (let k = 0; k < selectedCells.length; k++) {
    const { row: i, col: j } = selectedCells[k];
    bobView[p[i]][q[j]] = matrix[i][j];
  }

  return { permutedMatrix, bobView };
}

// ============================================================
// 双向等价类迭代细化算法 (Weisfeiler-Leman 1维 WL 细化)
//
// 时间复杂度：O(k * L)，其中 L 是迭代次数（通常 ≤ 10，最坏 O(log(n+m))）
// k 为选中格子数，因此对稀疏选择（远少于 nm）有巨大优势
//
// 核心思想：
//   - 初始签名：每行/列基于其 (邻接索引, 值) 对做哈希
//   - 迭代细化：行签名 ←  (列签名类别, 值) 多重集
//               列签名 ←  (行签名类别, 值) 多重集
//   - 收敛后：类别大小>1的就是等价类（不可区分的行/列）
// ============================================================

interface RefineResult {
  rowClasses: number[][];
  colClasses: number[][];
  rowClassOf: Int32Array;
  colClassOf: Int32Array;
  rowEntries: { col: number; val: number }[][];
  colEntries: { row: number; val: number }[][];
  iterations: number;
}

function refineEquivalenceClasses(
  n: number,
  m: number,
  selectedCells: { row: number; col: number }[],
  matrix: number[][]
): RefineResult {
  const rowEntries: { col: number; val: number }[][] = Array.from(
    { length: n },
    () => []
  );
  const colEntries: { row: number; val: number }[][] = Array.from(
    { length: m },
    () => []
  );

  for (let k = 0; k < selectedCells.length; k++) {
    const { row: i, col: j } = selectedCells[k];
    const v = matrix[i][j];
    rowEntries[i].push({ col: j, val: v });
    colEntries[j].push({ row: i, val: v });
  }

  for (let i = 0; i < n; i++) {
    rowEntries[i].sort((a, b) => a.col - b.col);
  }
  for (let j = 0; j < m; j++) {
    colEntries[j].sort((a, b) => a.row - b.row);
  }

  let rowClassOf = new Int32Array(n);
  let colClassOf = new Int32Array(m);

  const assignClassesBySignature = (
    items: string[],
    classOf: Int32Array
  ): number => {
    const N = items.length;
    const order = Array.from({ length: N }, (_, i) => i);
    order.sort((a, b) =>
      items[a] < items[b] ? -1 : items[a] > items[b] ? 1 : 0
    );
    let cid = 0;
    classOf[order[0]] = 0;
    for (let k = 1; k < N; k++) {
      if (items[order[k]] !== items[order[k - 1]]) cid++;
      classOf[order[k]] = cid;
    }
    return cid + 1;
  };

  // 初始签名
  const initRowSigs: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const parts: string[] = [];
    const entries = rowEntries[i];
    for (let k = 0; k < entries.length; k++) {
      parts.push(entries[k].col + ":" + entries[k].val);
    }
    initRowSigs[i] = parts.join(",");
  }
  let numRowClasses = assignClassesBySignature(initRowSigs, rowClassOf);

  const initColSigs: string[] = new Array(m);
  for (let j = 0; j < m; j++) {
    const parts: string[] = [];
    const entries = colEntries[j];
    for (let k = 0; k < entries.length; k++) {
      parts.push(entries[k].row + ":" + entries[k].val);
    }
    initColSigs[j] = parts.join(",");
  }
  let numColClasses = assignClassesBySignature(initColSigs, colClassOf);

  // 迭代细化
  const MAX_ITER = 50;
  let iter = 0;
  for (; iter < MAX_ITER; iter++) {
    const newRowSigs: string[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const entries = rowEntries[i];
      const parts: string[] = new Array(entries.length);
      for (let k = 0; k < entries.length; k++) {
        parts[k] = colClassOf[entries[k].col] + ":" + entries[k].val;
      }
      newRowSigs[i] = parts.join(",") + "|c" + rowClassOf[i];
    }
    const newNumRow = assignClassesBySignature(newRowSigs, rowClassOf);

    const newColSigs: string[] = new Array(m);
    for (let j = 0; j < m; j++) {
      const entries = colEntries[j];
      const parts: string[] = new Array(entries.length);
      for (let k = 0; k < entries.length; k++) {
        parts[k] = rowClassOf[entries[k].row] + ":" + entries[k].val;
      }
      newColSigs[j] = parts.join(",") + "|r" + colClassOf[j];
    }
    const newNumCol = assignClassesBySignature(newColSigs, colClassOf);

    if (newNumRow === numRowClasses && newNumCol === numColClasses) {
      iter++;
      break;
    }
    numRowClasses = newNumRow;
    numColClasses = newNumCol;
  }

  // 从 classOf 数组构建等价类分组
  const rowClasses: number[][] = Array.from({ length: numRowClasses }, () => []);
  for (let i = 0; i < n; i++) {
    rowClasses[rowClassOf[i]].push(i);
  }
  const colClasses: number[][] = Array.from({ length: numColClasses }, () => []);
  for (let j = 0; j < m; j++) {
    colClasses[colClassOf[j]].push(j);
  }

  return {
    rowClasses,
    colClasses,
    rowClassOf,
    colClassOf,
    rowEntries,
    colEntries,
    iterations: iter,
  };
}

// ============================================================
// 从细化结果提取 ConflictInfo
// ============================================================

function extractConflicts(
  result: RefineResult,
  matrix: number[][],
  rowEntries: { col: number; val: number }[][],
  colEntries: { row: number; val: number }[][],
  selectedSet: Set<string>
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const n = matrix.length;
  const m = matrix[0].length;

  // 行冲突
  for (let c = 0; c < result.rowClasses.length; c++) {
    const indices = result.rowClasses[c];
    if (indices.length <= 1) continue;

    const ambiguousPositions: { row: number; col: number }[] = [];
    const suggestions: { row: number; col: number }[] = [];

    for (let r = 0; r < indices.length; r++) {
      const i = indices[r];
      const entries = rowEntries[i];
      for (let k = 0; k < entries.length; k++) {
        ambiguousPositions.push({ row: i, col: entries[k].col });
      }
    }

    // O(|group|^2 * m) → 但等价类大小通常很小
    // 找能区分 group 中至少两行的列
    let isIdentical = true;
    const sugSet = new Set<number>();
    const l = indices.length;

    for (let j = 0; j < m; j++) {
      const valSet = new Set<number>();
      for (let r = 0; r < l; r++) valSet.add(matrix[indices[r]][j]);
      if (valSet.size > 1) {
        isIdentical = false;
        if (!selectedSet.has(`${indices[0]},${j}`)) {
          sugSet.add(j);
        }
      }
    }

    for (const j of sugSet) {
      for (let r = 0; r < l; r++) {
        suggestions.push({ row: indices[r], col: j });
      }
    }

    // 构造可读的 signature：代表行的模式
    const rep = indices[0];
    const repEntries = rowEntries[rep];
    const sigParts: string[] = [];
    for (let k = 0; k < repEntries.length; k++) {
      sigParts.push(String(repEntries[k].val));
    }
    const signature = sigParts.length === 0 ? "∅" : sigParts.join(",");

    conflicts.push({
      type: "row",
      indices,
      signature,
      isIdentical,
      ambiguousPositions,
      suggestion: suggestions,
    });
  }

  // 列冲突
  for (let c = 0; c < result.colClasses.length; c++) {
    const indices = result.colClasses[c];
    if (indices.length <= 1) continue;

    const ambiguousPositions: { row: number; col: number }[] = [];
    const suggestions: { row: number; col: number }[] = [];

    for (let s = 0; s < indices.length; s++) {
      const j = indices[s];
      const entries = colEntries[j];
      for (let k = 0; k < entries.length; k++) {
        ambiguousPositions.push({ row: entries[k].row, col: j });
      }
    }

    let isIdentical = true;
    const sugSet = new Set<number>();
    const l = indices.length;

    for (let i = 0; i < n; i++) {
      const valSet = new Set<number>();
      for (let s = 0; s < l; s++) valSet.add(matrix[i][indices[s]]);
      if (valSet.size > 1) {
        isIdentical = false;
        if (!selectedSet.has(`${i},${indices[0]}`)) {
          sugSet.add(i);
        }
      }
    }

    for (const i of sugSet) {
      for (let s = 0; s < l; s++) {
        suggestions.push({ row: i, col: indices[s] });
      }
    }

    const rep = indices[0];
    const repEntries = colEntries[rep];
    const sigParts: string[] = [];
    for (let k = 0; k < repEntries.length; k++) {
      sigParts.push(String(repEntries[k].val));
    }
    const signature = sigParts.length === 0 ? "∅" : sigParts.join(",");

    conflicts.push({
      type: "col",
      indices,
      signature,
      isIdentical,
      ambiguousPositions,
      suggestion: suggestions,
    });
  }

  return conflicts;
}

// ============================================================
// 公共 API
// ============================================================

export function createRandomMatrix(
  rows: number,
  cols: number,
  density: number
): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < density ? 1 : 0))
  );
}

export interface SimulateTiming {
  refineMs: number;
  conflictMs: number;
  permuteMs: number;
  totalMs: number;
  iterations: number;
}

export function simulate(
  matrix: number[][],
  selectedCells: { row: number; col: number }[],
  withTiming: boolean = false
): {
  success: boolean;
  permutedMatrix: number[][];
  permutationP: number[];
  permutationQ: number[];
  bobView: (number | null)[][];
  reconstructedMatrix: number[][] | null;
  conflicts: ConflictInfo[] | null;
  matchRate: number;
  timing?: SimulateTiming;
} {
  const t0 = performance.now();
  const n = matrix.length;
  const m = matrix[0].length;
  const k = selectedCells.length;

  const p = generatePermutation(n);
  const q = generatePermutation(m);

  const t1 = performance.now();
  const { permutedMatrix, bobView } = applyPermutationFast(
    matrix,
    p,
    q,
    selectedCells
  );
  const t2 = performance.now();

  const selectedSet = new Set<string>();
  for (let i = 0; i < k; i++) {
    selectedSet.add(selectedCells[i].row + "," + selectedCells[i].col);
  }

  // 核心：等价类迭代细化  O(k * L)
  const refineResult = refineEquivalenceClasses(
    n,
    m,
    selectedCells,
    matrix
  );
  const t3 = performance.now();

  const conflicts = extractConflicts(
    refineResult,
    matrix,
    refineResult.rowEntries,
    refineResult.colEntries,
    selectedSet
  );
  const t4 = performance.now();

  const success = conflicts.length === 0;

  let reconstructedMatrix: number[][] | null = null;
  let matchRate: number;

  if (success) {
    reconstructedMatrix = matrix.map((r) => r.slice());
    matchRate = 1;
  } else {
    const total = n * m;
    const conflictCellSet = new Set<string>();
    for (let i = 0; i < conflicts.length; i++) {
      const pos = conflicts[i].ambiguousPositions;
      for (let j = 0; j < pos.length; j++) {
        conflictCellSet.add(pos[j].row + "," + pos[j].col);
      }
    }
    matchRate = k > 0 ? Math.max(0, (k - conflictCellSet.size)) / total : 0;
  }

  const timing: SimulateTiming | undefined = withTiming
    ? {
        refineMs: t3 - t2,
        conflictMs: t4 - t3,
        permuteMs: t2 - t1,
        totalMs: t4 - t0,
        iterations: refineResult.iterations,
      }
    : undefined;

  return {
    success,
    permutedMatrix,
    permutationP: p,
    permutationQ: q,
    bobView,
    reconstructedMatrix,
    conflicts: success ? null : conflicts,
    matchRate,
    timing,
  };
}

export function suggest(
  _matrix: number[][],
  selectedCells: { row: number; col: number }[],
  conflicts: ConflictInfo[]
): { additionalCells: { row: number; col: number }[]; reason: string } {
  const selectedSet = new Set<string>();
  for (let i = 0; i < selectedCells.length; i++) {
    selectedSet.add(selectedCells[i].row + "," + selectedCells[i].col);
  }

  const additionalSet = new Set<string>();
  const additionalCells: { row: number; col: number }[] = [];
  const reasons: string[] = [];

  for (let c = 0; c < conflicts.length; c++) {
    const conflict = conflicts[c];
    const suggestion = conflict.suggestion;
    for (let s = 0; s < suggestion.length; s++) {
      const cell = suggestion[s];
      const key = cell.row + "," + cell.col;
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
