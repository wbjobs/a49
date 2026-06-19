export type StrategyType =
  | "random"
  | "full"
  | "main_diagonal"
  | "anti_diagonal"
  | "cross"
  | "chessboard"
  | "rows"
  | "cols"
  | "sample"
  | "borders"
  | "sparse_block"
  | "two_rows";

export interface StrategyConfig {
  ratio?: number;
  rowStep?: number;
  colStep?: number;
  rowIndices?: number[];
  colIndices?: number[];
  blockSize?: number;
}

export interface StrategyPreset {
  type: StrategyType;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultConfig: StrategyConfig;
  configurable: boolean;
}

export const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    type: "full",
    name: "全选",
    description: "选择所有格子，完整信息传递",
    icon: "▣",
    color: "#00ff88",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "random",
    name: "随机选择",
    description: "按指定概率随机选择格子",
    icon: "※",
    color: "#00d4ff",
    defaultConfig: { ratio: 0.3 },
    configurable: true,
  },
  {
    type: "main_diagonal",
    name: "主对角线",
    description: "只选 i=j 的格子，最少采样",
    icon: "╲",
    color: "#ff88aa",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "anti_diagonal",
    name: "反对角线",
    description: "只选 i+j=n-1 的格子",
    icon: "╱",
    color: "#aa88ff",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "cross",
    name: "十字交叉",
    description: "首行 + 首列，基准测试经典策略",
    icon: "✚",
    color: "#ffaa00",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "chessboard",
    name: "棋盘格",
    description: "(i+j) 奇偶交替选择",
    icon: "▤",
    color: "#00ffa6",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "rows",
    name: "按行选",
    description: "每隔 rowStep 行选整行",
    icon: "━",
    color: "#66bbff",
    defaultConfig: { rowStep: 2 },
    configurable: true,
  },
  {
    type: "cols",
    name: "按列选",
    description: "每隔 colStep 列选整列",
    icon: "┃",
    color: "#ff88cc",
    defaultConfig: { colStep: 2 },
    configurable: true,
  },
  {
    type: "sample",
    name: "网格采样",
    description: "按行列步长均匀采样",
    icon: "⊞",
    color: "#88ddaa",
    defaultConfig: { rowStep: 2, colStep: 2 },
    configurable: true,
  },
  {
    type: "borders",
    name: "边界",
    description: "只选最外圈的格子",
    icon: "▢",
    color: "#ffcc66",
    defaultConfig: {},
    configurable: false,
  },
  {
    type: "sparse_block",
    name: "稀疏分块",
    description: "从分块中心选少量格子",
    icon: "▦",
    color: "#88aaff",
    defaultConfig: { blockSize: 3 },
    configurable: true,
  },
  {
    type: "two_rows",
    name: "两行两列",
    description: "选中指定的两行和两列",
    icon: "╬",
    color: "#aaff88",
    defaultConfig: { rowIndices: [0, 1], colIndices: [0, 1] },
    configurable: true,
  },
];

export function generateStrategyCells(
  rows: number,
  cols: number,
  type: StrategyType,
  config: StrategyConfig = {}
): { row: number; col: number }[] {
  const result: { row: number; col: number }[] = [];

  switch (type) {
    case "full":
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) result.push({ row: i, col: j });
      break;

    case "random": {
      const ratio = config.ratio ?? 0.3;
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
          if (Math.random() < ratio) result.push({ row: i, col: j });
      break;
    }

    case "main_diagonal": {
      const n = Math.min(rows, cols);
      for (let i = 0; i < n; i++) result.push({ row: i, col: i });
      break;
    }

    case "anti_diagonal": {
      const n = Math.min(rows, cols);
      for (let i = 0; i < n; i++) result.push({ row: i, col: cols - 1 - i });
      break;
    }

    case "cross":
      for (let j = 0; j < cols; j++) result.push({ row: 0, col: j });
      for (let i = 1; i < rows; i++) result.push({ row: i, col: 0 });
      break;

    case "chessboard":
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
          if ((i + j) % 2 === 0) result.push({ row: i, col: j });
      break;

    case "rows": {
      const step = Math.max(1, config.rowStep ?? 2);
      for (let i = 0; i < rows; i += step)
        for (let j = 0; j < cols; j++) result.push({ row: i, col: j });
      break;
    }

    case "cols": {
      const step = Math.max(1, config.colStep ?? 2);
      for (let j = 0; j < cols; j += step)
        for (let i = 0; i < rows; i++) result.push({ row: i, col: j });
      break;
    }

    case "sample": {
      const rStep = Math.max(1, config.rowStep ?? 2);
      const cStep = Math.max(1, config.colStep ?? 2);
      for (let i = 0; i < rows; i += rStep)
        for (let j = 0; j < cols; j += cStep)
          result.push({ row: i, col: j });
      break;
    }

    case "borders":
      for (let j = 0; j < cols; j++) {
        result.push({ row: 0, col: j });
        if (rows > 1) result.push({ row: rows - 1, col: j });
      }
      for (let i = 1; i < rows - 1; i++) {
        result.push({ row: i, col: 0 });
        if (cols > 1) result.push({ row: i, col: cols - 1 });
      }
      break;

    case "sparse_block": {
      const bs = Math.max(2, config.blockSize ?? 3);
      for (let bi = 0; bi < rows; bi += bs)
        for (let bj = 0; bj < cols; bj += bs) {
          const ci = Math.min(bi + Math.floor(bs / 2), rows - 1);
          const cj = Math.min(bj + Math.floor(bs / 2), cols - 1);
          result.push({ row: ci, col: cj });
        }
      break;
    }

    case "two_rows": {
      const rIdx = config.rowIndices ?? [0, 1];
      const cIdx = config.colIndices ?? [0, 1];
      for (const r of rIdx)
        if (r >= 0 && r < rows)
          for (let j = 0; j < cols; j++) result.push({ row: r, col: j });
      for (const c of cIdx)
        if (c >= 0 && c < cols)
          for (let i = 0; i < rows; i++) {
            if (!rIdx.includes(i)) result.push({ row: i, col: c });
          }
      break;
    }
  }

  return result;
}
