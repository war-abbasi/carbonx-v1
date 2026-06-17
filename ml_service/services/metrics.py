"""Pure forecasting metrics (no model deps) so they can be unit-tested alone."""

import numpy as np
from typing import Dict, List


def score(actual: List[float], pred: List[float]) -> Dict:
    """Regression metrics for actual vs predicted arrays (out-of-sample safe)."""
    a = np.asarray(actual, dtype=float)
    p = np.asarray(pred, dtype=float)[:len(a)]
    resid = a - p
    rmse = float(np.sqrt(np.mean(resid ** 2)))
    mae = float(np.mean(np.abs(resid)))
    mape = float(np.mean(np.abs(resid / (np.abs(a) + 1e-6))) * 100)
    ss_res = float(np.sum(resid ** 2))
    ss_tot = float(np.sum((a - np.mean(a)) ** 2))
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 1e-9 else 0.0
    r2 = max(0.0, min(1.0, r2))
    return {'rmse': round(rmse, 4), 'mae': round(mae, 4),
            'mape': round(mape, 2), 'r2': round(r2, 4)}
