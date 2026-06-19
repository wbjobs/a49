import { useStore, type StrategyRunResult } from "../store/useStore";
import { STRATEGY_PRESETS } from "../../shared/strategies";

const COLOR_A = "#00d4ff";
const COLOR_B = "#ff88aa";

function BarChart({
  label,
  values,
  colors,
  max,
  unit = "",
  formatter,
}: {
  label: string;
  values: [number, number];
  colors: [string, string];
  max?: number;
  unit?: string;
  formatter?: (v: number) => string;
}) {
  const maxVal = max ?? Math.max(...values, 1);
  const fmt = formatter ?? ((v) => (unit ? `${v}${unit}` : `${v}`));
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
            <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
              <div
                className="h-full rounded transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, (values[i] / maxVal) * 100)}%`,
                  backgroundColor: colors[i],
                  boxShadow: `0 0 10px ${colors[i]}66`,
                }}
              />
              <span
                className="absolute inset-0 flex items-center px-2 text-xs tabular-nums font-mono"
                style={{
                  color: values[i] / maxVal > 0.5 ? "#000" : "#fff",
                  textShadow: values[i] / maxVal > 0.5 ? "none" : "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {fmt(values[i])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonBadge({
  label,
  a,
  b,
  lowerIsBetter,
}: {
  label: string;
  a: number;
  b: number;
  lowerIsBetter?: boolean;
}) {
  let better: "A" | "B" | "TIE" = "TIE";
  let delta = 0;
  if (a !== b) {
    const aBetter = lowerIsBetter ? a < b : a > b;
    better = aBetter ? "A" : "B";
    if (a + b > 0) {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      delta = max === 0 ? 0 : Math.round(((max - min) / max) * 100);
    }
  }
  const betterColor = better === "A" ? COLOR_A : better === "B" ? COLOR_B : "#888";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-700/50">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300 tabular-nums">{a.toFixed(a % 1 === 0 ? 0 : 1)}</span>
        <span className="text-xs text-gray-600">vs</span>
        <span className="text-xs text-gray-300 tabular-nums">{b.toFixed(b % 1 === 0 ? 0 : 1)}</span>
        {better !== "TIE" && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={{
              backgroundColor: betterColor + "22",
              color: betterColor,
              border: `1px solid ${betterColor}55`,
            }}
          >
            {better}优 +{delta}%
          </span>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  which,
  label,
  result,
  color,
  strategyType,
}: {
  which: "A" | "B";
  label: string;
  result: StrategyRunResult | null;
  color: string;
  strategyType: string;
}) {
  const preset = STRATEGY_PRESETS.find((p) => p.type === strategyType)!;
  if (!result) {
    return (
      <div className="bg-gray-900/40 rounded-lg border-2 border-dashed border-gray-700/50 p-4 text-center">
        <div
          className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl"
          style={{ color, border: `2px dashed ${color}44` }}
        >
          {preset.icon}
        </div>
        <p className="text-xs text-gray-500">策略{which}等待运行…</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: color + "44", background: color + "08" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl" style={{ color }}>{preset.icon}</div>
        <div>
          <div className="text-sm font-bold" style={{ color }}>
            策略 {which} · {label}
          </div>
          <div className="text-[10px] text-gray-500">{preset.description}</div>
        </div>
      </div>

      <div className="mb-3">
        {result.success ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400">✓ 重构成功</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs font-bold text-red-400">✗ 重构失败</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-black/30 rounded p-2">
          <div className="text-gray-500 text-[10px]">匹配率</div>
          <div className="text-sm font-mono tabular-nums text-gray-100">
            {(result.matchRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-black/30 rounded p-2">
          <div className="text-gray-500 text-[10px]">传递数据</div>
          <div className="text-sm font-mono tabular-nums text-gray-100">{result.selectedCount} 格</div>
        </div>
        <div className="bg-black/30 rounded p-2">
          <div className="text-gray-500 text-[10px]">冲突组</div>
          <div className="text-sm font-mono tabular-nums text-gray-100">{result.conflictCount}</div>
        </div>
        <div className="bg-black/30 rounded p-2">
          <div className="text-gray-500 text-[10px]">耗时</div>
          <div className="text-sm font-mono tabular-nums text-gray-100">
            {result.totalMs.toFixed(1)}ms
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompareMetricsPanel() {
  const state = useStore();
  const a = state.strategyA.result;
  const b = state.strategyB.result;
  const ready = a && b;

  return (
    <div className="bg-gray-900/60 backdrop-blur rounded-lg border border-gray-700/50 p-4">
      <h2 className="font-bold text-sm tracking-wider text-gray-200 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400" />
        策略对比 · 指标分析
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <ResultCard
          which="A"
          label={STRATEGY_PRESETS.find((p) => p.type === state.strategyA.type)?.name ?? ""}
          result={a}
          color={COLOR_A}
          strategyType={state.strategyA.type}
        />
        <ResultCard
          which="B"
          label={STRATEGY_PRESETS.find((p) => p.type === state.strategyB.type)?.name ?? ""}
          result={b}
          color={COLOR_B}
          strategyType={state.strategyB.type}
        />
      </div>

      {ready ? (
        <>
          <div className="space-y-2 mb-5 text-xs">
            <ComparisonBadge
              label="重构成功率"
              a={a!.matchRate * 100}
              b={b!.matchRate * 100}
            />
            <ComparisonBadge
              label="数据传输量 (格)"
              a={a!.selectedCount}
              b={b!.selectedCount}
              lowerIsBetter
            />
            <ComparisonBadge
              label="行冲突组数"
              a={a!.rowConflicts}
              b={b!.rowConflicts}
              lowerIsBetter
            />
            <ComparisonBadge
              label="列冲突组数"
              a={a!.colConflicts}
              b={b!.colConflicts}
              lowerIsBetter
            />
            <ComparisonBadge label="细化迭代次数" a={a!.iterCount} b={b!.iterCount} lowerIsBetter />
            <ComparisonBadge
              label="算法耗时 (ms)"
              a={a!.totalMs}
              b={b!.totalMs}
              lowerIsBetter
            />
          </div>

          <div className="pt-3 border-t border-gray-700/50">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              📊 双柱状图对比
            </h3>
            <BarChart
              label="匹配率 (%)"
              values={[a!.matchRate * 100, b!.matchRate * 100]}
              colors={[COLOR_A, COLOR_B]}
              max={100}
              unit="%"
            />
            <BarChart
              label="传递数据量"
              values={[a!.selectedCount, b!.selectedCount]}
              colors={[COLOR_A, COLOR_B]}
              unit="格"
            />
            <BarChart
              label="冲突组数"
              values={[a!.conflictCount, b!.conflictCount]}
              colors={[COLOR_A, COLOR_B]}
            />
            <BarChart
              label="算法耗时"
              values={[a!.totalMs, b!.totalMs]}
              colors={[COLOR_A, COLOR_B]}
              unit="ms"
              formatter={(v) => v.toFixed(1) + "ms"}
            />
          </div>

          <div className="mt-4 p-3 rounded border border-purple-500/30 bg-purple-500/5">
            <div className="text-xs text-purple-300 font-bold mb-1.5">💡 策略分析</div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {a!.success && b!.success
                ? `两种策略均成功！策略${a!.selectedCount < b!.selectedCount ? "A" : "B"}更高效，
                   仅需 ${Math.min(a!.selectedCount, b!.selectedCount)} 格数据即可还原。`
                : a!.success && !b!.success
                ? `仅策略 A 成功，使用 ${a!.selectedCount} 格数据。
                   策略 B 缺 ${b!.rowConflicts + b!.colConflicts} 组约束。`
                : !a!.success && b!.success
                ? `仅策略 B 成功，使用 ${b!.selectedCount} 格数据。
                   策略 A 缺 ${a!.rowConflicts + a!.colConflicts} 组约束。`
                : `两种策略均失败。策略${a!.conflictCount <= b!.conflictCount ? "A" : "B"}略好。
                   建议增加十字交叉或按行列采样的选择模式。`}
            </p>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-gray-500 text-xs">
          点击下方「开始对比」按钮运行双策略模拟…
        </div>
      )}
    </div>
  );
}
