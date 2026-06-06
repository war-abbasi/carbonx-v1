"""
Model Comparison Service
Compare Prophet, XGBoost, and Holt-Winters models
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import logging
from datetime import datetime
import json

from .prophet_model import ProphetForecaster
from .xgboost_model import XGBoostForecaster
from .holt_winters_model import HoltWintersForecaster

logger = logging.getLogger(__name__)


class ModelComparison:
    """Compare multiple forecasting models and select the best one"""

    def __init__(self):
        self.prophet = ProphetForecaster()
        self.xgboost = XGBoostForecaster()
        self.holt_winters = HoltWintersForecaster()
        self.comparison_results = {}

    def compare_models(self, organization_id: str, historical_data: List[float],
                      forecast_horizon: int = 12, features: Optional[Dict] = None) -> Dict:
        """
        Train all 3 models and compare performance

        Args:
            organization_id: Organization ID
            historical_data: Historical monthly emissions (36+ months recommended)
            forecast_horizon: Months to forecast ahead
            features: Optional feature dict (employee_counts, start_date, etc.)

        Returns:
            Comparison result dict with all forecasts and metrics
        """
        try:
            logger.info(f"Starting model comparison for org {organization_id} with {len(historical_data)} months of data")

            # Validate minimum data
            if len(historical_data) < 12:
                logger.warning(f"Only {len(historical_data)} months of data. Recommendations <12: limited seasonality detection")

            # Extract features
            employee_counts = features.get('employee_counts') if features else None
            start_date = features.get('start_date', '2023-01-01') if features else '2023-01-01'

            # Train models
            results = {
                'organization_id': organization_id,
                'timestamp': datetime.utcnow().isoformat(),
                'data_points': len(historical_data),
                'forecast_horizon': forecast_horizon,
                'models': {}
            }

            # Prophet
            try:
                logger.info("Training Prophet...")
                prophet_result = self.prophet.train(historical_data, start_date)
                prophet_forecast = self.prophet.forecast_future(forecast_horizon)

                results['models']['prophet'] = {
                    'status': 'success',
                    'metrics': self.prophet.metrics,
                    'training_time_seconds': self.prophet.training_time,
                    'forecast': prophet_forecast
                }
                logger.info(f"Prophet RMSE: {self.prophet.metrics['rmse']:.4f}")
            except Exception as e:
                logger.error(f"Prophet training failed: {str(e)}")
                results['models']['prophet'] = {'status': 'failed', 'error': str(e)}

            # XGBoost
            try:
                logger.info("Training XGBoost...")
                xgb_result = self.xgboost.train(historical_data, employee_counts)
                xgb_forecast = self.xgboost.forecast_future(historical_data, forecast_horizon, employee_counts)

                results['models']['xgboost'] = {
                    'status': 'success',
                    'metrics': self.xgboost.metrics,
                    'training_time_seconds': self.xgboost.training_time,
                    'forecast': xgb_forecast,
                    'feature_importance': self.xgboost.get_feature_importance()
                }
                logger.info(f"XGBoost RMSE: {self.xgboost.metrics['rmse']:.4f}")
            except Exception as e:
                logger.error(f"XGBoost training failed: {str(e)}")
                results['models']['xgboost'] = {'status': 'failed', 'error': str(e)}

            # Holt-Winters
            try:
                logger.info("Training Holt-Winters...")
                hw_result = self.holt_winters.train(historical_data, start_date)
                hw_forecast = self.holt_winters.forecast_future(forecast_horizon)

                results['models']['holt_winters'] = {
                    'status': 'success',
                    'metrics': self.holt_winters.metrics,
                    'training_time_seconds': self.holt_winters.training_time,
                    'forecast': hw_forecast
                }
                logger.info(f"Holt-Winters RMSE: {self.holt_winters.metrics['rmse']:.4f}")
            except Exception as e:
                logger.error(f"Holt-Winters training failed: {str(e)}")
                results['models']['holt_winters'] = {'status': 'failed', 'error': str(e)}

            # Select best model
            best_model, best_score = self._select_best_model(results)
            results['best_model'] = best_model
            results['best_score'] = best_score

            # Add comparison summary
            results['summary'] = self._create_summary_table(results)

            self.comparison_results = results
            return results

        except Exception as e:
            logger.error(f"Model comparison error: {str(e)}")
            raise

    def _select_best_model(self, results: Dict) -> tuple:
        """
        Select best model based on RMSE

        Args:
            results: Comparison results dict

        Returns:
            Tuple of (best_model_name, rmse_value)
        """
        scores = {}

        for model_name, model_result in results['models'].items():
            if model_result.get('status') == 'success' and model_result.get('metrics'):
                rmse = model_result['metrics'].get('rmse', float('inf'))
                scores[model_name] = rmse

        if not scores:
            return 'prophet', None

        best_model = min(scores.items(), key=lambda x: x[1])
        return best_model[0], best_model[1]

    def _create_summary_table(self, results: Dict) -> List[Dict]:
        """
        Create summary table for FYP defense

        Args:
            results: Comparison results

        Returns:
            List of dicts suitable for table display
        """
        summary = []

        for model_name, model_result in results['models'].items():
            if model_result.get('status') == 'success' and model_result.get('metrics'):
                metrics = model_result['metrics']
                summary.append({
                    'model': model_name.replace('_', ' ').title(),
                    'rmse': metrics.get('rmse'),
                    'mae': metrics.get('mae'),
                    'mape': metrics.get('mape'),
                    'r2': metrics.get('r2'),
                    'training_time_seconds': round(model_result.get('training_time_seconds', 0), 2)
                })

        return sorted(summary, key=lambda x: x['rmse'] if x['rmse'] else float('inf'))

    def get_comparison_metrics(self, organization_id: Optional[str] = None) -> Dict:
        """
        Get model comparison metrics table

        Args:
            organization_id: Optional org ID (if provided, gets org-specific metrics)

        Returns:
            Comparison metrics for display
        """
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'models': self._create_summary_table(self.comparison_results),
            'best_model': self.comparison_results.get('best_model'),
            'organization_id': organization_id
        }

    def train_all_models(self, organization_id: str, force_retrain: bool = False) -> Dict:
        """
        Trigger model retraining (async job)

        Args:
            organization_id: Organization ID
            force_retrain: Force retraining even if models exist

        Returns:
            Job info dict
        """
        # TODO: Implement async job queue (Celery, RQ, etc.)
        job_id = f"job_{organization_id}_{int(datetime.utcnow().timestamp())}"

        return {
            'job_id': job_id,
            'status': 'queued',
            'organization_id': organization_id
        }

    def export_comparison_csv(self) -> str:
        """
        Export comparison table as CSV string

        Returns:
            CSV string
        """
        import csv
        from io import StringIO

        output = StringIO()
        summary = self._create_summary_table(self.comparison_results)

        writer = csv.DictWriter(output, fieldnames=['model', 'rmse', 'mae', 'mape', 'r2', 'training_time_seconds'])
        writer.writeheader()
        writer.writerows(summary)

        return output.getvalue()
