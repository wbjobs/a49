import { Router, type Request, type Response } from "express";
import {
  createRandomMatrix,
  simulate,
  suggest,
} from "../services/protocol.js";
import type {
  CreateMatrixRequest,
  SimulateRequest,
  SuggestRequest,
  BatchSimulateRequest,
  BatchSimulateResponse,
  StrategyRunSummary,
} from "../../shared/types.js";

const router = Router();

router.post(
  "/create",
  (req: Request<{}, {}, CreateMatrixRequest>, res: Response) => {
    const { rows, cols, density } = req.body;
    if (!rows || !cols || density === undefined) {
      res.status(400).json({ success: false, error: "Missing parameters" });
      return;
    }
    const matrix = createRandomMatrix(rows, cols, density);
    const id = `matrix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    res.json({ matrix, id });
  }
);

router.post(
  "/simulate",
  (req: Request<{}, {}, SimulateRequest>, res: Response) => {
    const { matrix, selectedCells } = req.body;
    if (!matrix || !selectedCells) {
      res
        .status(400)
        .json({ success: false, error: "Missing matrix or selectedCells" });
      return;
    }
    const result = simulate(matrix, selectedCells);
    res.json(result);
  }
);

router.post(
  "/suggest",
  (req: Request<{}, {}, SuggestRequest>, res: Response) => {
    const { matrix, selectedCells, conflicts } = req.body;
    if (!matrix || !selectedCells || !conflicts) {
      res.status(400).json({ success: false, error: "Missing parameters" });
      return;
    }
    const result = suggest(matrix, selectedCells, conflicts);
    res.json(result);
  }
);

router.post(
  "/batch-simulate",
  (req: Request<{}, {}, BatchSimulateRequest>, res: Response<BatchSimulateResponse | { error: string }>) => {
    const t0 = performance.now();
    const { matrix, strategies } = req.body;
    if (!matrix || !strategies || strategies.length === 0) {
      res.status(400).json({ error: "Missing matrix or strategies" });
      return;
    }

    const results: StrategyRunSummary[] = strategies.map((s) => {
      const result = simulate(matrix, s.selectedCells, true);
      const rowConflicts = (result.conflicts ?? []).filter((c) => c.type === "row");
      const colConflicts = (result.conflicts ?? []).filter((c) => c.type === "col");
      const selectedCount = s.selectedCells.length;
      return {
        label: s.label,
        success: result.success,
        matchRate: result.matchRate,
        selectedCount,
        dataTransmission: selectedCount,
        conflictCount: (result.conflicts ?? []).length,
        rowConflicts: rowConflicts.length,
        colConflicts: colConflicts.length,
        iterCount: result.timing?.iterations ?? 0,
        totalMs: result.timing?.totalMs ?? 0,
        refineMs: result.timing?.refineMs ?? 0,
        permuteMs: result.timing?.permuteMs ?? 0,
        conflicts: result.conflicts,
        bobView: result.bobView,
        permutationP: result.permutationP,
        permutationQ: result.permutationQ,
      };
    });

    const totalMs = performance.now() - t0;
    res.json({ results, totalMs });
  }
);

export default router;
