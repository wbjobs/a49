import { useStore } from "@/store/useStore";
import type { ConflictInfo } from "../../shared/types";

export default function ConflictPanel() {
  const { conflicts, success, conflictRows, conflictCols, suggestedCells, matrix } =
    useStore();

  if (success || !conflicts) return null;

  const rowConflicts = conflicts.filter((c) => c.type === "row");
  const colConflicts = conflicts.filter((c) => c.type === "col");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#ff3355] animate-pulse" />
        <span className="text-[#ff3355] font-mono text-xs tracking-wider uppercase">
          冲突诊断
        </span>
      </div>

      <div className="bg-[#0d0d1a]/80 backdrop-blur border border-[#ff3355]/20 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">
          冲突行:{" "}
          <span className="text-[#ff3355] font-mono">
            [{Array.from(conflictRows).join(", ")}]
          </span>
        </div>
        <div className="text-xs text-gray-400">
          冲突列:{" "}
          <span className="text-[#ff3355] font-mono">
            [{Array.from(conflictCols).join(", ")}]
          </span>
        </div>
      </div>

      {rowConflicts.length > 0 && (
        <ConflictSection title="行冲突详情" items={rowConflicts} matrix={matrix} />
      )}
      {colConflicts.length > 0 && (
        <ConflictSection title="列冲突详情" items={colConflicts} matrix={matrix} />
      )}

      {suggestedCells.size > 0 && (
        <div className="bg-[#0d0d1a]/80 backdrop-blur border border-[#ffaa00]/20 rounded-lg p-3">
          <div className="text-xs text-[#ffaa00] font-mono mb-1">
            建议补充格子
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(suggestedCells).map((key) => {
              const [r, c] = key.split(",").map(Number);
              return (
                <span
                  key={key}
                  className="px-1.5 py-0.5 rounded bg-[#ffaa00]/10 border border-[#ffaa00]/30 text-[#ffaa00] text-[10px] font-mono"
                >
                  R{r}C{c}
                </span>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            补充这些格子的数据可以消除对应冲突
          </div>
        </div>
      )}
    </div>
  );
}

function ConflictSection({
  title,
  items,
  matrix,
}: {
  title: string;
  items: ConflictInfo[];
  matrix: number[][];
}) {
  return (
    <div className="bg-[#0d0d1a]/80 backdrop-blur border border-[#ff3355]/20 rounded-lg p-3">
      <div className="text-xs text-[#ff3355] font-mono mb-2">{title}</div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((conflict, idx) => (
          <ConflictCard key={idx} conflict={conflict} matrix={matrix} />
        ))}
      </div>
    </div>
  );
}

function ConflictCard({
  conflict,
  matrix,
}: {
  conflict: ConflictInfo;
  matrix: number[][];
}) {
  const isRow = conflict.type === "row";

  return (
    <div className="bg-[#1a0a0a]/50 border border-[#ff3355]/10 rounded p-2">
      <div className="text-[10px] text-gray-400 mb-1">
        {isRow ? "行" : "列"} [
        <span className="text-[#ff3355] font-mono">
          {conflict.indices.join(", ")}
        </span>
        ] 无法区分
      </div>
      <div className="text-[10px] text-gray-500 mb-1">
        签名: <span className="text-gray-300 font-mono">[{conflict.signature}]</span>
      </div>
      {conflict.isIdentical && (
        <div className="text-[10px] text-[#ff6666] mb-1">
          ⚠ {isRow ? "这些行" : "这些列"}在原始矩阵中完全相同，无法通过增加数据区分
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {conflict.indices.map((idx) => {
          if (isRow) {
            const rowVals = matrix[idx];
            return (
              <div key={idx} className="text-[9px]">
                <span className="text-gray-500">R{idx}:</span>{" "}
                <span className="text-gray-300 font-mono">
                  [{rowVals.join("")}]
                </span>
              </div>
            );
          } else {
            const colVals = matrix.map((r) => r[idx]);
            return (
              <div key={idx} className="text-[9px]">
                <span className="text-gray-500">C{idx}:</span>{" "}
                <span className="text-gray-300 font-mono">
                  [{colVals.join("")}]
                </span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
