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

export default router;
