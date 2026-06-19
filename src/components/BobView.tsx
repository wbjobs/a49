import { useStore } from "@/store/useStore";

export default function BobView() {
  const { bobView, permutationP, permutationQ, simulatePhase, success, rows, cols } =
    useStore();

  if (simulatePhase !== "done" || !bobView) return null;

  return (
    <div className="bg-[#0d0d1a]/80 backdrop-blur border border-[#00d4ff]/20 rounded-lg p-3">
      <div className="text-xs text-[#00d4ff] font-mono mb-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
        Bob 视角（打乱后）
      </div>

      <div className="mb-2 text-[10px] text-gray-500">
        行排列 p: <span className="text-[#00ff88] font-mono">[{permutationP.join(", ")}]</span>
      </div>
      <div className="mb-3 text-[10px] text-gray-500">
        列排列 q: <span className="text-[#00ff88] font-mono">[{permutationQ.join(", ")}]</span>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[10px] font-mono">
          <thead>
            <tr>
              <th className="p-1 text-gray-600" />
              {Array.from({ length: cols }, (_, j) => (
                <th key={j} className="p-1 text-[#00d4ff]/60">
                  q{j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bobView.map((rowData, i) => (
              <tr key={i}>
                <td className="p-1 text-[#00d4ff]/60 pr-2">p{i}</td>
                {rowData.map((val, j) => (
                  <td key={j} className="p-0.5">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] ${
                        val === null
                          ? "bg-[#1a1a2e]/50 border border-[#1a1a2e]"
                          : val === 1
                          ? "bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88]"
                          : "bg-[#1a1a2e] border border-[#333] text-gray-500"
                      }`}
                    >
                      {val === null ? "?" : val}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {success && (
        <div className="mt-2 text-[10px] text-[#00ff88]">
          ✓ Bob 成功重构原始矩阵
        </div>
      )}
    </div>
  );
}
