"""
Prophet Forecasting Model
Facebook's time-series forecasting library
"""

import numpy as np
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging
import time
import os
import sys
from io import StringIO

logger = logging.getLogger(__name__)


class ProphetForecaster:
    """Prophet-based forecasting model"""

    def __init__(self, interval_width: float = 0.9):
        """
        Initialize Prophet forecaster

        Args:
            interval_width: Confidence interval width (0.9 = 90%, 0.95 = 95%)
        """
        self.interval_width = interval_width
        self.model = None
        self.forecast = None
        self.metrics = None
        self.training_time = None

    def prepare_data(self, historical_data: List[float], start_date: str = '2023-01-01') -> pd.DataFrame:
        """
        Prepare data in Prophet format

        Args:
            historical_data: List of monthly emissions
            start_date: Starting date (YYYY-MM-DD format)

        Returns:
            DataFrame with 'ds' (date) and 'y' (emissions) columns
        """
        start = pd.to_datetime(start_date)
        dates = pd.date_range(start=start, periods=len(historical_data), freq='MS')

        df = pd.DataFrame({
            'ds': dates,
            'y': historical_data
        })

        return df

    def train(self, historical_data: List[float], start_date: str = '2023-01-01') -> Dict:
        """
        Train Prophet model

        Args:
            historical_data: List of monthly emissions
            start_date: Starting date

        Returns:
            Training metrics dict
        """
        try:
            start_time = time.time()

            # Prepare data
            df = self.prepare_data(historical_data, start_date)

            # Initialize and train Prophet
            self.model = Prophet(
                interval_width=self.interval_width,
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                seasonality_mode='additive'
            )

            # Fit model (suppress verbose output)
            with open(os.devnull, 'w') as devnull:
                old_stdout = sys.stdout
                sys.stdout = devnull
                self.model.fit(df)
                sys.stdout = old_stdout

            self.training_time = time.time() - start_time

            # Calculate metrics on historical data
            self.metrics = self._calculate_metrics(df, self.model)

            logger.info(f"Prophet model trained in {self.training_time:.2f}s. RMSE: {self.metrics['rmse']:.2f}")

            return {
                'status': 'success',
                'training_time': self.training_time,
                'metrics': self.metrics
            }

        except Exception as e:
            logger.error(f"Prophet training error: {str(e)}")
            raise

    def forecast_future(self, periods: int = 12) -> Dict:
        """
        Generate forecast for future periods

        Args:
            periods: Number of months to forecast

        Returns:
            Forecast dict with predictions and confidence intervals
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        try:
            # Create future dataframe
            future = self.model.make_future_dataframe(periods=periods, freq='MS')

            # Generate forecast
            forecast_df = self.model.predict(future)

            # Extract future forecasts only
            future_forecast = forecast_df.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            future_forecast.columns = ['month', 'predicted', 'lower_bound', 'upper_bound']

            # Format results
            results = []
            for idx, row in future_forecast.iterrows():
                results.append({
                    'month': row['month'].strftime('%Y-%m'),
                    'predicted_emissions': round(max(0, row['predicted']), 2),
                    'lower_bound': round(max(0, row['lower_bound']), 2),
                    'upper_bound': round(max(0, row['upper_bound']), 2),
                })

            self.forecast = results
            return results

        except Exception as e:
            logger.error(f"Prophet forecast error: {str(e)}")
            raise

    def _calculate_metrics(self, train_df: pd.DataFrame, model: Prophet) -> Dict:
        """
        Calculate model performance metrics

        Args:
            train_df: Training data
            model: Trained Prophet model

        Returns:
            Metrics dict with RMSE, MAE, MAPE, R²
        """
        try:
            # Make predictions on training data
            future = model.make_future_dataframe(periods=0, freq='MS')
            forecast = model.predict(future)

            # Calculate residuals
            actual = train_df['y'].values
            predicted = forecast['yhat'].values[:len(actual)]

            residuals = actual - predicted

            # RMSE
            rmse = np.sqrt(np.mean(residuals ** 2))

            # MAE
            mae = np.mean(np.abs(residuals))

            # MAPE (Mean Absolute Percentage Error)
            mape = np.mean(np.abs((actual - predicted) / (actual + 1e-6))) * 100

            # R²
            ss_res = np.sum(residuals ** 2)
            ss_tot = np.sum((actual - np.mean(actual)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

            return {
                'rmse': round(rmse, 4),
                'mae': round(mae, 4),
                'mape': round(mape, 2),
                'r2': round(max(0, min(1, r2)), 4)  # Clamp between 0 and 1
            }

        except Exception as e:
            logger.error(f"Metrics calculation error: {str(e)}")
            return {'rmse': None, 'mae': None, 'mape': None, 'r2': None}

    def get_summary(self) -> Dict:
        """Get model summary"""
        return {
            'model_name': 'Prophet',
            'training_time_seconds': self.training_time,
            'metrics': self.metrics,
            'forecast_points': len(self.forecast) if self.forecast else 0
        }
