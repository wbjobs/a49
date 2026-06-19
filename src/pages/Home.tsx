import Matrix3D from "@/components/Matrix3D";
import ControlPanel from "@/components/ControlPanel";
import ConflictPanel from "@/components/ConflictPanel";
import BobView from "@/components/BobView";
import { useStore } from "@/store/useStore";

export default function Home() {
  const { viewMode, success } = useStore();

  return (
    <div className="h-screen w-screen bg-[#050510] flex overflow-hidden">
      <div className="flex-1 relative">
        <Matrix3D />

        {viewMode === "edit" && (
          <div className="absolute top-4 left-4 bg-[#0d0d1a]/70 backdrop-blur-sm border border-[#00ff88]/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-[#00ff88]/70 font-mono">
              点击格子选择要发送的数据
            </span>
          </div>
        )}

        {viewMode === "simulate" && (
          <div className="absolute top-4 left-4 bg-[#0d0d1a]/70 backdrop-blur-sm border border-[#00d4ff]/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-[#00d4ff]/70 font-mono">
              协议模拟进行中...
            </span>
          </div>
        )}
      </div>

      <div className="w-80 h-full bg-[#080812] border-l border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <ControlPanel />
        </div>

        {viewMode === "simulate" && !success && (
          <div className="border-t border-[#ff3355]/20 p-4 max-h-[45%] overflow-y-auto">
            <ConflictPanel />
          </div>
        )}

        {viewMode === "simulate" && (
          <div className="border-t border-[#00d4ff]/20 p-4 max-h-[40%] overflow-y-auto">
            <BobView />
          </div>
        )}
      </div>
    </div>
  );
}
