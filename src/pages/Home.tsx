import Matrix3D from "@/components/Matrix3D";
import ControlPanel from "@/components/ControlPanel";
import ConflictPanel from "@/components/ConflictPanel";
import BobView from "@/components/BobView";
import { CompareMetricsPanel } from "@/components/CompareMetricsPanel";
import { useStore } from "@/store/useStore";

export default function Home() {
  const state = useStore();

  return (
    <div className="h-screen w-screen bg-[#050510] flex overflow-hidden">
      <div className="flex-1 relative">
        <Matrix3D />

        {!state.compareMode && state.viewMode === "edit" && (
          <div className="absolute top-4 left-4 bg-[#0d0d1a]/70 backdrop-blur-sm border border-[#00ff88]/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-[#00ff88]/70 font-mono">
              点击格子选择要发送的数据
            </span>
          </div>
        )}

        {!state.compareMode && state.viewMode === "simulate" && (
          <div className="absolute top-4 left-4 bg-[#0d0d1a]/70 backdrop-blur-sm border border-[#00d4ff]/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-[#00d4ff]/70 font-mono">
              协议模拟进行中...
            </span>
          </div>
        )}

        {state.compareMode && (
          <div className="absolute top-4 left-4 bg-purple-500/10 backdrop-blur-sm border border-purple-400/30 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-purple-300/80 font-mono">
              ◈ 策略对比模式 · 选择两种策略并排分析
            </span>
          </div>
        )}
      </div>

      <div
        className={`h-full bg-[#080812] border-l border-[#1a1a2e] flex flex-col overflow-hidden ${
          state.compareMode ? "w-[420px]" : "w-80"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <ControlPanel />

          {state.compareMode && (
            <div className="mt-4">
              <CompareMetricsPanel />
            </div>
          )}
        </div>

        {!state.compareMode && state.viewMode === "simulate" && !state.success && (
          <div className="border-t border-[#ff3355]/20 p-4 max-h-[45%] overflow-y-auto">
            <ConflictPanel />
          </div>
        )}

        {!state.compareMode && state.viewMode === "simulate" && (
          <div className="border-t border-[#00d4ff]/20 p-4 max-h-[40%] overflow-y-auto">
            <BobView />
          </div>
        )}
      </div>
    </div>
  );
}
