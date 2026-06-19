import { useStore } from "../store/useStore";
import { STRATEGY_PRESETS } from "../../shared/strategies";
import type { StrategyType, StrategyConfig } from "../../shared/strategies";

interface Props {
  which: "A" | "B";
  accentColor: string;
}

export function StrategySelector({ which, accentColor }: Props) {
  const state = useStore();
  const strategyKey = which === "A" ? "strategyA" : "strategyB";
  const strategy = state[strategyKey];
  const setStrategy = state.setStrategy;

  const selectedPreset = STRATEGY_PRESETS.find((p) => p.type === strategy.type)!;

  const configControls = (() => {
    if (!selectedPreset.configurable) return null;
    const cfg = strategy.config;
    return (
      <div className="mt-3 space-y-2 pl-2 border-l-2" style={{ borderColor: accentColor }}>
        {cfg.ratio !== undefined && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              选择概率: {(cfg.ratio * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={cfg.ratio}
              onChange={(e) =>
                setStrategy(which, strategy.type, { ...cfg, ratio: parseFloat(e.target.value) })
              }
              className="w-full accent"
              style={{ accentColor }}
            />
          </div>
        )}
        {cfg.rowStep !== undefined && (strategy.type === "rows" || strategy.type === "sample") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              行步长: 每 {cfg.rowStep} 行
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={cfg.rowStep}
              onChange={(e) =>
                setStrategy(which, strategy.type, { ...cfg, rowStep: parseInt(e.target.value) })
              }
              className="w-full"
              style={{ accentColor }}
            />
          </div>
        )}
        {cfg.colStep !== undefined && (strategy.type === "cols" || strategy.type === "sample") && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              列步长: 每 {cfg.colStep} 列
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={cfg.colStep}
              onChange={(e) =>
                setStrategy(which, strategy.type, { ...cfg, colStep: parseInt(e.target.value) })
              }
              className="w-full"
              style={{ accentColor }}
            />
          </div>
        )}
        {cfg.blockSize !== undefined && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              分块大小: {cfg.blockSize}×{cfg.blockSize}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={cfg.blockSize}
              onChange={(e) =>
                setStrategy(which, strategy.type, { ...cfg, blockSize: parseInt(e.target.value) })
              }
              className="w-full"
              style={{ accentColor }}
            />
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="bg-gray-900/60 backdrop-blur rounded-lg border p-4" style={{ borderColor: accentColor + "55" }}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
        />
        <h3 className="font-bold text-sm tracking-wider" style={{ color: accentColor }}>
          策略 {which} — {selectedPreset.name}
        </h3>
        <span className="ml-auto text-xs text-gray-500 tabular-nums">
          已选: {strategy.selectedCells.size}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        {selectedPreset.description}
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {STRATEGY_PRESETS.map((p) => (
          <button
            key={p.type}
            onClick={() => setStrategy(which, p.type as StrategyType, p.defaultConfig as StrategyConfig)}
            className={`px-2 py-1.5 rounded border text-xs transition-all ${
              strategy.type === p.type
                ? "bg-white/10"
                : "hover:bg-white/5 border-gray-700/50 hover:border-gray-500"
            }`}
            style={
              strategy.type === p.type
                ? { borderColor: p.color, color: p.color, boxShadow: `0 0 6px ${p.color}33` }
                : { color: "#aaa" }
            }
            title={p.description}
          >
            <span className="block text-base leading-none mb-0.5" style={{ fontFamily: "monospace" }}>
              {p.icon}
            </span>
            <span className="block leading-tight" style={{ fontSize: "10px" }}>
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {configControls}

      <button
        onClick={() => state.applyStrategyToSelection(which)}
        className="mt-3 w-full text-xs py-1.5 rounded border border-gray-600/50 hover:border-gray-400 hover:bg-white/5 text-gray-300 transition-all"
      >
        重新应用策略 → 刷新选择
      </button>
    </div>
  );
}
