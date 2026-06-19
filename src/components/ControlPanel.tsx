import { useStore, type StrategyRunResult } from "@/store/useStore";
import { StrategySelector } from "./StrategySelector";
import { STRATEGY_PRESETS } from "../../shared/strategies";

const COLOR_A = "#00d4ff";
const COLOR_B = "#ff88aa";

export default function ControlPanel() {
  const state = useStore();

  const selectedCount = state.selectedCells.size;
  const totalCells = state.rows * state.cols;

  const handleSimulate = async () => {
    if (selectedCount === 0) return;

    state.setViewMode("simulate");
    state.setSimulatePhase("sending");

    const cells = Array.from(state.selectedCells).map((key) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col };
    });

    await delay(800);
    state.setSimulatePhase("permuting");

    try {
      const res = await fetch("/api/matrix/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix: state.matrix, selectedCells: cells }),
      });
      const data = await res.json();

      await delay(1000);
      state.setSimulatePhase("reconstructing");

      await delay(800);
      state.setSimulationResult(data);

      if (!data.success && data.conflicts) {
        const sugRes = await fetch("/api/matrix/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matrix: state.matrix,
            selectedCells: cells,
            conflicts: data.conflicts,
          }),
        });
        const sugData = await sugRes.json();
        state.setSuggestedCells(sugData.additionalCells);
      }
    } catch {
      state.setSimulatePhase("idle");
      state.setViewMode("edit");
    }
  };

  const handleCompare = async () => {
    if (state.strategyA.selectedCells.size === 0 || state.strategyB.selectedCells.size === 0) {
      return;
    }
    state.setComparePhase("running");

    const cellsToArray = (s: Set<string>) =>
      Array.from(s).map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      });

    const presetA = STRATEGY_PRESETS.find((p) => p.type === state.strategyA.type)!;
    const presetB = STRATEGY_PRESETS.find((p) => p.type === state.strategyB.type)!;

    await delay(600);
    try {
      const res = await fetch("/api/matrix/batch-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrix: state.matrix,
          strategies: [
            { label: presetA.name, selectedCells: cellsToArray(state.strategyA.selectedCells) },
            { label: presetB.name, selectedCells: cellsToArray(state.strategyB.selectedCells) },
          ],
        }),
      });
      const data = await res.json();
      const [a, b] = data.results as StrategyRunResult[];
      state.setCompareResults(a, b);
    } catch {
      state.setComparePhase("idle");
    }
  };

  const handleBackToEdit = () => {
    state.setViewMode("edit");
    state.setSimulatePhase("idle");
  };

  const handleNewMatrix = () => {
    state.generateRandom();
    setTimeout(() => {
      if (state.compareMode) {
        state.applyStrategyToSelection("A");
        state.applyStrategyToSelection("B");
      }
    }, 50);
  };

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] font-mono text-xs tracking-wider uppercase">
            通信协议沙盘
          </span>
        </div>
        <button
          onClick={() => {
            state.setCompareMode(!state.compareMode);
            if (!state.compareMode) {
              setTimeout(() => {
                state.setStrategy("A", state.strategyA.type);
                state.setStrategy("B", state.strategyB.type);
              }, 50);
            }
          }}
          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border transition-all ${
            state.compareMode
              ? "bg-purple-500/15 border-purple-400/50 text-purple-300"
              : "bg-gray-800 border-gray-600/50 text-gray-400 hover:border-purple-400/30 hover:text-purple-300"
          }`}
        >
          {state.compareMode ? "◈ 策略对比中" : "◈ 策略对比模式"}
        </button>
      </div>

      {!state.compareMode && state.viewMode === "edit" && (
        <>
          <Section title="矩阵参数">
            <FieldRow label="行数">
              <SliderInput value={state.rows} min={2} max={30} onChange={(v) => {
                state.setRows(v);
                state.clearSelection();
              }} />
            </FieldRow>
            <FieldRow label="列数">
              <SliderInput value={state.cols} min={2} max={30} onChange={(v) => {
                state.setCols(v);
                state.clearSelection();
              }} />
            </FieldRow>
            <FieldRow label="1的概率">
              <SliderInput
                value={state.density}
                min={0.1}
                max={0.9}
                step={0.05}
                onChange={state.setDensity}
              />
            </FieldRow>
            <button
              onClick={handleNewMatrix}
              className="w-full mt-1 px-3 py-1.5 rounded bg-[#1a1a2e] border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/60 transition-all text-xs"
            >
              生成随机矩阵
            </button>
          </Section>

          <Section title="选择格子">
            <div className="flex gap-2">
              <button
                onClick={state.selectAll}
                className="flex-1 px-2 py-1.5 rounded bg-[#1a1a2e] border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10 transition-all text-xs"
              >
                全选
              </button>
              <button
                onClick={state.clearSelection}
                className="flex-1 px-2 py-1.5 rounded bg-[#1a1a2e] border border-[#ff3355]/30 text-[#ff3355] hover:bg-[#ff3355]/10 transition-all text-xs"
              >
                清除
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              已选 <span className="text-[#00d4ff] font-mono">{selectedCount}</span>{" "}
              / {totalCells} 格
            </div>
            <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff] transition-all duration-300"
                style={{ width: `${(selectedCount / totalCells) * 100}%` }}
              />
            </div>
            <RowColStats />
          </Section>

          <button
            onClick={handleSimulate}
            disabled={selectedCount === 0}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] font-bold text-sm hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            发送至 Bob →
          </button>
        </>
      )}

      {state.compareMode && (
        <>
          <Section title="矩阵参数 (对比共享)">
            <FieldRow label="行数">
              <SliderInput value={state.rows} min={2} max={30} onChange={(v) => {
                state.setRows(v);
                setTimeout(() => {
                  state.applyStrategyToSelection("A");
                  state.applyStrategyToSelection("B");
                }, 30);
              }} />
            </FieldRow>
            <FieldRow label="列数">
              <SliderInput value={state.cols} min={2} max={30} onChange={(v) => {
                state.setCols(v);
                setTimeout(() => {
                  state.applyStrategyToSelection("A");
                  state.applyStrategyToSelection("B");
                }, 30);
              }} />
            </FieldRow>
            <FieldRow label="1的概率">
              <SliderInput
                value={state.density}
                min={0.1}
                max={0.9}
                step={0.05}
                onChange={state.setDensity}
              />
            </FieldRow>
            <button
              onClick={handleNewMatrix}
              className="w-full mt-1 px-3 py-1.5 rounded bg-[#1a1a2e] border border-purple-400/30 text-purple-300 hover:bg-purple-400/10 hover:border-purple-400/60 transition-all text-xs"
            >
              ↻ 生成新矩阵 & 刷新策略
            </button>
          </Section>

          <StrategySelector which="A" accentColor={COLOR_A} />
          <StrategySelector which="B" accentColor={COLOR_B} />

          <button
            onClick={handleCompare}
            disabled={
              state.comparePhase === "running" ||
              state.strategyA.selectedCells.size === 0 ||
              state.strategyB.selectedCells.size === 0
            }
            className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              state.comparePhase === "running"
                ? "bg-gray-700 text-gray-400 cursor-wait"
                : "bg-gradient-to-r from-[#00d4ff] via-[#aa88ff] to-[#ff88aa] text-[#0a0a0f] hover:shadow-[0_0_25px_rgba(170,136,255,0.45)]"
            } disabled:opacity-40`}
          >
            {state.comparePhase === "running" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                后端并行计算中…
              </span>
            ) : state.comparePhase === "done" ? (
              "↻ 重新运行对比"
            ) : (
              "⚡ 开始对比两种策略"
            )}
          </button>

          {state.comparePhase === "done" && (
            <button
              onClick={state.clearCompareResults}
              className="w-full px-3 py-1.5 rounded bg-[#1a1a2e] border border-gray-600/40 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all text-xs"
            >
              清除对比结果
            </button>
          )}
        </>
      )}

      {!state.compareMode && state.viewMode === "simulate" && (
        <>
          <Section title="协议模拟">
            <PhaseIndicator
              label="Alice 发送数据"
              active={state.simulatePhase === "sending"}
              done={state.simulatePhase !== "sending" && state.simulatePhase !== "idle"}
            />
            <PhaseIndicator
              label="交互库施加排列"
              active={state.simulatePhase === "permuting"}
              done={
                state.simulatePhase === "reconstructing" || state.simulatePhase === "done"
              }
            />
            <PhaseIndicator
              label="Bob 重构矩阵"
              active={state.simulatePhase === "reconstructing"}
              done={state.simulatePhase === "done"}
            />
          </Section>

          {state.simulatePhase === "done" && (
            <Section title="重构结果">
              <ResultBadge success={useStore.getState().success} />
              <div className="text-xs text-gray-400 mt-1">
                匹配率:{" "}
                <span className="text-[#00d4ff] font-mono">
                  {(useStore.getState().matchRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400">
                选中格子:{" "}
                <span className="text-[#00ff88] font-mono">{selectedCount}</span>
              </div>
            </Section>
          )}

          {state.simulatePhase === "done" && (
            <div className="flex gap-2">
              <button
                onClick={handleBackToEdit}
                className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all text-xs"
              >
                ← 返回编辑
              </button>
              <button
                onClick={state.reset}
                className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#ff3355]/30 text-[#ff3355] hover:bg-[#ff3355]/10 transition-all text-xs"
              >
                重置
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d1a]/80 backdrop-blur border border-[#1a1a2e] rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function SliderInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 h-1 accent-[#00d4ff] bg-[#1a1a2e]"
      />
      <span className="text-[#00d4ff] font-mono text-xs w-8 text-right">
        {step < 1 ? value.toFixed(2) : value}
      </span>
    </div>
  );
}

function PhaseIndicator({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div
        className={`w-3 h-3 rounded-full border transition-all ${
          done
            ? "bg-[#00ff88] border-[#00ff88]"
            : active
            ? "bg-[#00d4ff] border-[#00d4ff] animate-pulse"
            : "border-gray-600"
        }`}
      />
      <span
        className={`text-xs transition-all ${
          done
            ? "text-[#00ff88]"
            : active
            ? "text-[#00d4ff]"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ResultBadge({ success }: { success: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        success
          ? "bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88]"
          : "bg-[#ff3355]/10 border border-[#ff3355]/40 text-[#ff3355]"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          success ? "bg-[#00ff88]" : "bg-[#ff3355] animate-pulse"
        }`}
      />
      {success ? "重构成功" : "重构失败"}
    </div>
  );
}

function RowColStats() {
  const { rows, cols, selectedCells } = useStore();

  const rowCounts = Array.from({ length: rows }, (_, i) => {
    let count = 0;
    for (let j = 0; j < cols; j++) {
      if (selectedCells.has(`${i},${j}`)) count++;
    }
    return count;
  });

  const colCounts = Array.from({ length: cols }, (_, j) => {
    let count = 0;
    for (let i = 0; i < rows; i++) {
      if (selectedCells.has(`${i},${j}`)) count++;
    }
    return count;
  });

  const maxCount = Math.max(...rowCounts, ...colCounts, 1);

  return (
    <div className="mt-2 space-y-2">
      <div>
        <div className="text-[10px] text-gray-500 mb-0.5">行选择分布</div>
        <div className="flex gap-0.5 items-end h-6">
          {rowCounts.map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-[#00ff88]/40 rounded-sm transition-all"
                style={{ height: `${(c / maxCount) * 16}px` }}
              />
              <span className="text-[8px] text-gray-600">{i}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-500 mb-0.5">列选择分布</div>
        <div className="flex gap-0.5 items-end h-6">
          {colCounts.map((c, j) => (
            <div key={j} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-[#00d4ff]/40 rounded-sm transition-all"
                style={{ height: `${(c / maxCount) * 16}px` }}
              />
              <span className="text-[8px] text-gray-600">{j}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
