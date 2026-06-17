"""
Holt-Winters Exponential Smoothing Model
Pure-Python triple exponential smoothing with damped trend and
automatic hyper-parameter optimisation (grid search on RMSE).
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import logging
import time

logger = logging.getLogger(__name__)


class HoltWintersForecaster:
    """Holt-Winters (additive) forecaster with damped trend + auto-tuning."""

    def __init__(self, alpha: float = 0.3, beta: float = 0.1, gamma: float = 0.1,
                 phi: float = 0.98, frequency: int = 12):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.phi = phi              # trend damping factor (<1 prevents runaway forecasts)
        self.frequency = frequency  # monthly seasonality
        self.level = None
        self.trend = None
        self.seasonal = None
        self.has_seasonality = False
        self.n_train = 0
        self.metrics = None
        self.training_time = None

    # ────────────────────────────────────────────────────────────
    #  Core smoothing pass (used for both fitting and tuning)
    # ────────────────────────────────────────────────────────────
    def _fit_params(self, data: np.ndarray, alpha: float, beta: float,
                    gamma: float, phi: float):
        """Run one smoothing pass; return (level, trend, seasonal, fitted)."""
        n = len(data)
        freq = self.frequency
        has_seasonality = n >= 2 * freq   # need ≥2 full cycles for stable seasonality

        # ── Initialise level & trend ──
        if has_seasonality:
            level = np.mean(data[:freq])
            # average trend across the first two cycles
            trend = (np.mean(data[freq:2 * freq]) - np.mean(data[:freq])) / freq
        else:
            level = data[0]
            trend = (data[1] - data[0]) if n > 1 else 0.0

        # ── Initialise seasonal indices (average detrended value per period) ──
        seasonal = np.zeros(freq)
        if has_seasonality:
            n_cycles = n // freq
            for s in range(freq):
                vals = [data[c * freq + s] - level for c in range(n_cycles)
                        if c * freq + s < n]
                seasonal[s] = np.mean(vals) if vals else 0.0

        # ── Smoothing recursion ──
        fitted = np.empty(n)
        for t in range(n):
            season = seasonal[t % freq] if has_seasonality else 0.0
            fitted[t] = level + phi * trend + season

            obs = data[t]
            prev_level = level
            deseason = (obs - season) if has_seasonality else obs
            level = alpha * deseason + (1 - alpha) * (level + phi * trend)
            trend = beta * (level - prev_level) + (1 - beta) * phi * trend
            if has_seasonality:
                seasonal[t % freq] = gamma * (obs - level) + (1 - gamma) * seasonal[t % freq]

        return level, trend, seasonal, fitted, has_seasonality

    def train(self, historical_data: List[float], start_date: str = '2023-01-01') -> Dict:
        try:
            start_time = time.time()
            data = np.asarray(historical_data, dtype=float)
            n = len(data)
            if n < 2:
                raise ValueError("Need at least 2 data points")

            self.n_train = n

            # ── Grid search for best (alpha, beta, gamma); damping fixed ──
            grid = [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9]
            best = None
            for a in grid:
                for b in grid:
                    for g in grid:
                        _, _, _, fitted, _ = self._fit_params(data, a, b, g, self.phi)
                        # score on the portion after warm-up (one full cycle) when possible
                        warm = self.frequency if n >= 2 * self.frequency else 1
                        rmse = np.sqrt(np.mean((data[warm:] - fitted[warm:]) ** 2))
                        if best is None or rmse < best[0]:
                            best = (rmse, a, b, g)

            _, self.alpha, self.beta, self.gamma = best

            # ── Final fit with best params ──
            (self.level, self.trend, self.seasonal,
             fitted, self.has_seasonality) = self._fit_params(
                data, self.alpha, self.beta, self.gamma, self.phi)

            self.training_time = time.time() - start_time
            self.metrics = self._calculate_metrics(data, fitted)
            logger.info(f"Holt-Winters trained in {self.training_time:.3f}s "
                        f"(α={self.alpha}, β={self.beta}, γ={self.gamma}). "
                        f"RMSE: {self.metrics['rmse']:.2f}")
            return {'status': 'success', 'training_time': self.training_time,
                    'metrics': self.metrics}
        except Exception as e:
            logger.error(f"Holt-Winters training error: {str(e)}")
            raise

    def forecast_future(self, periods: int = 12) -> List[Dict]:
        if self.level is None:
            raise ValueError("Model not trained. Call train() first.")
        try:
            forecasts = []
            now = pd.Timestamp.now()
            rmse = (self.metrics or {}).get('rmse') or 10.0
            freq = self.frequency

            # damped-trend sum:  level + (phi + phi^2 + ... + phi^h) * trend
            damp_sum = 0.0
            for h in range(1, periods + 1):
                damp_sum += self.phi ** h
                pred = self.level + damp_sum * self.trend
                if self.has_seasonality:
                    pred += self.seasonal[(self.n_train + h - 1) % freq]
                pred = max(0, pred)

                # CI widens with horizon (random-walk style)
                uncertainty = 1.645 * rmse * np.sqrt(h)
                future_date = now + pd.DateOffset(months=h)
                forecasts.append({
                    'month': future_date.strftime('%Y-%m'),
                    'predicted_emissions': round(pred, 2),
                    'lower_bound': round(max(0, pred - uncertainty), 2),
                    'upper_bound': round(pred + uncertainty, 2),
                })
            return forecasts
        except Exception as e:
            logger.error(f"Holt-Winters forecast error: {str(e)}")
            raise

    def _calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> Dict:
        try:
            # exclude warm-up (first cycle) from scoring when we have enough data
            warm = self.frequency if len(actual) >= 2 * self.frequency else 1
            a = actual[warm:]
            p = predicted[warm:]
            residuals = a - p
            rmse = np.sqrt(np.mean(residuals ** 2))
            mae = np.mean(np.abs(residuals))
            mape = np.mean(np.abs(residuals / (np.abs(a) + 1e-6))) * 100
            ss_res = np.sum(residuals ** 2)
            ss_tot = np.sum((a - np.mean(a)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            r2 = max(0, min(1, r2))
            return {'rmse': round(float(rmse), 4), 'mae': round(float(mae), 4),
                    'mape': round(float(mape), 2), 'r2': round(float(r2), 4)}
        except Exception as e:
            logger.error(f"Metrics calculation error: {str(e)}")
            return {'rmse': None, 'mae': None, 'mape': None, 'r2': None}

    def get_summary(self) -> Dict:
        return {'model_name': 'Holt-Winters', 'alpha': self.alpha, 'beta': self.beta,
                'gamma': self.gamma, 'phi': self.phi,
                'training_time_seconds': self.training_time, 'metrics': self.metrics}
