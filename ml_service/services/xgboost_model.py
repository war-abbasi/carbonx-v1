"""
XGBoost Forecasting Model
Gradient boosting machine learning model
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error, r2_score
from typing import Dict, List, Tuple, Optional
import logging
import time

logger = logging.getLogger(__name__)


class XGBoostForecaster:
    """XGBoost-based forecasting model"""

    def __init__(self, n_estimators: int = 300, max_depth: int = 3, learning_rate: float = 0.05):
        """
        Initialize XGBoost forecaster.

        Defaults are tuned for short monthly series (≈12–60 points): shallow
        trees + many low-rate rounds + strong regularisation to avoid the
        gross over-fitting that depth-5 trees produce on tiny datasets.
        """
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model = None
        self.metrics = None
        self.training_time = None
        self.feature_names = None

    def engineer_features(self, historical_data: List[float], employee_counts: Optional[List[int]] = None) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Engineer features for XGBoost

        Args:
            historical_data: List of monthly emissions
            employee_counts: Optional list of employee counts

        Returns:
            Features DataFrame and target Series
        """
        df = pd.DataFrame({'emissions': historical_data})

        # Lag features (1, 3, 6, 12 months)
        df['lag_1'] = df['emissions'].shift(1)
        df['lag_3'] = df['emissions'].shift(3)
        df['lag_6'] = df['emissions'].shift(6)
        df['lag_12'] = df['emissions'].shift(12)

        # Rolling statistics
        df['rolling_mean_3'] = df['emissions'].rolling(window=3, min_periods=1).mean()
        df['rolling_mean_6'] = df['emissions'].rolling(window=6, min_periods=1).mean()
        df['rolling_mean_12'] = df['emissions'].rolling(window=12, min_periods=1).mean()
        df['rolling_std_3'] = df['emissions'].rolling(window=3, min_periods=1).std()
        df['rolling_std_6'] = df['emissions'].rolling(window=6, min_periods=1).std()

        # Seasonal features
        df['month'] = (df.index % 12) + 1
        df['quarter'] = ((df['month'] - 1) // 3) + 1
        df['is_summer'] = df['month'].isin([6, 7, 8]).astype(int)
        df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)

        # Trend
        df['trend'] = np.arange(len(df))

        # Employee count — ALWAYS produce both columns so the feature set is
        # identical between training and forecasting (otherwise XGBoost raises a
        # feature_names mismatch when employee_counts is empty at train time but
        # populated at forecast time).
        if employee_counts and len(employee_counts) == len(df):
            df['employee_count'] = employee_counts
        else:
            df['employee_count'] = 100  # Default
        df['emissions_per_employee'] = df['emissions'] / (df['employee_count'] + 1)

        # Year-over-year change
        df['yoy_change'] = df['emissions'].diff(12)

        # Fill NaN values (backward fill then forward fill)
        df = df.bfill().ffill()

        # Create X and y
        target = df['emissions'].copy()
        features = df.drop('emissions', axis=1)

        self.feature_names = features.columns.tolist()

        return features, target

    def train(self, historical_data: List[float], employee_counts: Optional[List[int]] = None) -> Dict:
        """
        Train XGBoost model

        Args:
            historical_data: List of monthly emissions
            employee_counts: Optional employee counts

        Returns:
            Training metrics dict
        """
        try:
            start_time = time.time()

            # Engineer features
            X, y = self.engineer_features(historical_data, employee_counts)

            # Train XGBoost with regularisation suited to small series
            self.model = xgb.XGBRegressor(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                learning_rate=self.learning_rate,
                subsample=0.85,
                colsample_bytree=0.85,
                min_child_weight=2,
                reg_lambda=1.5,
                reg_alpha=0.1,
                random_state=42,
                verbose=0
            )

            self.model.fit(X, y, verbose=False)

            self.training_time = time.time() - start_time

            # Calculate metrics
            y_pred = self.model.predict(X)
            self.metrics = self._calculate_metrics(y, y_pred)

            logger.info(f"XGBoost model trained in {self.training_time:.2f}s. RMSE: {self.metrics['rmse']:.2f}")

            return {
                'status': 'success',
                'training_time': self.training_time,
                'metrics': self.metrics
            }

        except Exception as e:
            logger.error(f"XGBoost training error: {str(e)}")
            raise

    def forecast_future(self, historical_data: List[float], periods: int = 12,
                       employee_counts: Optional[List[int]] = None) -> Dict:
        """
        Generate forecast for future periods

        Args:
            historical_data: Historical emissions data (for feature engineering)
            periods: Number of months to forecast
            employee_counts: Optional employee counts

        Returns:
            Forecast dict with predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        try:
            # Start with historical features
            X_hist, _ = self.engineer_features(historical_data, employee_counts)

            # Get last row as template
            last_features = X_hist.iloc[-1].copy()

            forecasts = []
            current_data = list(historical_data)

            # Extend employee counts for future periods (use last value)
            current_employees = list(employee_counts) if employee_counts else [100] * len(historical_data)
            last_employee_count = current_employees[-1] if current_employees else 100

            for i in range(periods):
                # Create feature vector for next period
                X_future = pd.DataFrame([last_features])

                # Predict
                pred = self.model.predict(X_future)[0]
                pred = max(0, pred)  # Ensure non-negative

                forecasts.append(pred)
                current_data.append(pred)
                current_employees.append(last_employee_count)  # Use last employee count for future

                # Update features for next iteration
                temp_X, _ = self.engineer_features(current_data, current_employees)
                last_features = temp_X.iloc[-1].copy()

            # Format results
            now = pd.Timestamp.now()
            results = []
            for i, pred in enumerate(forecasts):
                future_date = now + pd.DateOffset(months=i+1)

                # Estimate confidence interval (±15% as proxy)
                uncertainty = pred * 0.15
                results.append({
                    'month': future_date.strftime('%Y-%m'),
                    'predicted_emissions': round(pred, 2),
                    'lower_bound': round(max(0, pred - uncertainty), 2),
                    'upper_bound': round(pred + uncertainty, 2),
                })

            return results

        except Exception as e:
            logger.error(f"XGBoost forecast error: {str(e)}")
            raise

    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        """
        Calculate model metrics

        Args:
            y_true: Actual values
            y_pred: Predicted values

        Returns:
            Metrics dict
        """
        try:
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            mae = mean_absolute_error(y_true, y_pred)
            mape = mean_absolute_percentage_error(y_true, y_pred) * 100
            r2 = r2_score(y_true, y_pred)

            return {
                'rmse': round(rmse, 4),
                'mae': round(mae, 4),
                'mape': round(mape, 2),
                'r2': round(max(0, min(1, r2)), 4)
            }

        except Exception as e:
            logger.error(f"Metrics calculation error: {str(e)}")
            return {'rmse': None, 'mae': None, 'mape': None, 'r2': None}

    def get_feature_importance(self) -> Dict:
        """Get feature importance from model"""
        if self.model is None:
            return {}

        importance = self.model.feature_importances_
        feature_importance_dict = {
            name: float(imp) for name, imp in zip(self.feature_names, importance)
        }

        return dict(sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True))

    def get_summary(self) -> Dict:
        """Get model summary"""
        return {
            'model_name': 'XGBoost',
            'training_time_seconds': self.training_time,
            'metrics': self.metrics,
            'feature_importance': self.get_feature_importance()[:5]  # Top 5 features
        }
