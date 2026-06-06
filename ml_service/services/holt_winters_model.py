"""
Holt-Winters Exponential Smoothing Model
Pure Python implementation of Holt-Winters time-series forecasting
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging
import time

logger = logging.getLogger(__name__)


class HoltWintersForecaster:
    """Holt-Winters Exponential Smoothing forecaster"""

    def __init__(self, alpha: float = 0.3, beta: float = 0.1, gamma: float = 0.1):
        """
        Initialize Holt-Winters forecaster

        Args:
            alpha: Level smoothing parameter (0-1)
            beta: Trend smoothing parameter (0-1)
            gamma: Seasonal smoothing parameter (0-1)
        """
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.level = None
        self.trend = None
        self.seasonal = None
        self.metrics = None
        self.training_time = None
        self.frequency = 12  # Monthly seasonality

    def train(self, historical_data: List[float], start_date: str = '2023-01-01') -> Dict:
        """
        Train Holt-Winters model

        Args:
            historical_data: List of monthly emissions
            start_date: Starting date

        Returns:
            Training result dict
        """
        try:
            start_time = time.time()

            data = np.array(historical_data, dtype=float)
            n = len(data)

            if n < 2:
                raise ValueError("Need at least 2 data points")

            # Initialize level and trend
            self.level = data[0]
            self.trend = (data[1] - data[0]) * 0.5

            # Initialize seasonality (only if enough data)
            self.seasonal = np.zeros(self.frequency)
            has_seasonality = n >= self.frequency

            if has_seasonality:
                # Calculate average level
                avg_level = np.mean(data[:self.frequency])

                # Initialize seasonal components
                for i in range(self.frequency):
                    if i < len(data):
                        self.seasonal[i] = data[i] - avg_level

            # Fit the model
            fitted = []
            for t in range(n):
                # Predict
                pred = self.level + self.trend
                if has_seasonality:
                    pred += self.seasonal[t % self.frequency]

                fitted.append(pred)

                # Update level
                obs = data[t]
                if has_seasonality and t >= self.frequency:
                    obs = obs - self.seasonal[t % self.frequency]

                old_level = self.level
                self.level = self.alpha * obs + (1 - self.alpha) * (old_level + self.trend)

                # Update trend
                self.trend = self.beta * (self.level - old_level) + (1 - self.beta) * self.trend

                # Update seasonal
                if has_seasonality and t >= self.frequency:
                    self.seasonal[t % self.frequency] = (
                        self.gamma * (data[t] - self.level) +
                        (1 - self.gamma) * self.seasonal[t % self.frequency]
                    )

            self.training_time = time.time() - start_time

            # Calculate metrics
            fitted_array = np.array(fitted)
            self.metrics = self._calculate_metrics(data, fitted_array)

            logger.info(f"Holt-Winters model trained in {self.training_time:.2f}s. RMSE: {self.metrics['rmse']:.2f}")

            return {
                'status': 'success',
                'training_time': self.training_time,
                'metrics': self.metrics
            }

        except Exception as e:
            logger.error(f"Holt-Winters training error: {str(e)}")
            raise

    def forecast_future(self, periods: int = 12) -> List[Dict]:
        """
        Generate forecast for future periods

        Args:
            periods: Number of months to forecast

        Returns:
            List of forecast dicts
        """
        if self.level is None or self.trend is None:
            raise ValueError("Model not trained. Call train() first.")

        try:
            forecasts = []
            now = pd.Timestamp.now()

            for i in range(1, periods + 1):
                # Forecast
                pred = self.level + (i * self.trend)

                if self.seasonal is not None and len(self.seasonal) > 0:
                    seasonal_idx = (i - 1) % len(self.seasonal)
                    pred += self.seasonal[seasonal_idx]

                pred = max(0, pred)  # Ensure non-negative

                # Confidence interval (estimate based on RMSE)
                rmse = self.metrics.get('rmse', 10) if self.metrics else 10
                uncertainty = 1.645 * rmse  # 90% confidence

                future_date = now + pd.DateOffset(months=i)

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
        """
        Calculate model metrics

        Args:
            actual: Actual values
            predicted: Predicted values

        Returns:
            Metrics dict
        """
        try:
            residuals = actual - predicted

            # RMSE
            rmse = np.sqrt(np.mean(residuals ** 2))

            # MAE
            mae = np.mean(np.abs(residuals))

            # MAPE
            mape = np.mean(np.abs((actual - predicted) / (np.abs(actual) + 1e-6))) * 100

            # R²
            ss_res = np.sum(residuals ** 2)
            ss_tot = np.sum((actual - np.mean(actual)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            r2 = max(0, min(1, r2))

            return {
                'rmse': round(rmse, 4),
                'mae': round(mae, 4),
                'mape': round(mape, 2),
                'r2': round(r2, 4)
            }

        except Exception as e:
            logger.error(f"Metrics calculation error: {str(e)}")
            return {'rmse': None, 'mae': None, 'mape': None, 'r2': None}

    def get_summary(self) -> Dict:
        """Get model summary"""
        return {
            'model_name': 'Holt-Winters',
            'alpha': self.alpha,
            'beta': self.beta,
            'gamma': self.gamma,
            'training_time_seconds': self.training_time,
            'metrics': self.metrics
        }
