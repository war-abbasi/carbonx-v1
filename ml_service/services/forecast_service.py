"""
Forecast Service - Core forecasting logic
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Emission factors (kg CO₂e per unit)
EMISSION_FACTORS = {
    'electricity': 0.45,      # kg CO₂e per kWh (Pakistan grid)
    'diesel': 2.68,           # kg CO₂e per liter
    'travel': 0.192,          # kg CO₂e per km (average car)
    'waste': 0.5,             # kg CO₂e per kg
}

# Scope classification
SCOPE_CLASSIFICATION = {
    'electricity': 'scope2',  # Indirect - purchased energy
    'diesel': 'scope1',       # Direct - owned equipment
    'travel': 'scope3',       # Value chain - employee commute
    'waste': 'scope3',        # Value chain - waste disposal
}


class ForecastService:
    """Service for forecasting and emissions calculation"""

    def __init__(self):
        self.emission_factors = EMISSION_FACTORS
        self.scope_classification = SCOPE_CLASSIFICATION
        self.logger = logging.getLogger(__name__)

    def calculate_emissions(self, organization_id: str, activities: Dict, month: Optional[str] = None) -> Dict:
        """
        Calculate emissions from activity data

        Args:
            organization_id: Organization identifier
            activities: Dict with keys: electricity_kwh, diesel_liters, travel_km, waste_kg
            month: Optional month in YYYY-MM format (default: current month)

        Returns:
            Dict with scope1, scope2, scope3, total_co2e, breakdown
        """
        try:
            if month is None:
                month = datetime.now().strftime('%Y-%m')

            # Initialize scopes
            scopes = {
                'scope1': 0.0,
                'scope2': 0.0,
                'scope3': 0.0,
            }
            breakdown = {}

            # Calculate emissions for each activity type
            for activity_type, quantity in activities.items():
                if quantity == 0 or quantity is None:
                    continue

                # Map activity to emission factor
                if activity_type == 'electricity_kwh':
                    emissions = quantity * self.emission_factors['electricity']
                    key = 'electricity'
                elif activity_type == 'diesel_liters':
                    emissions = quantity * self.emission_factors['diesel']
                    key = 'diesel'
                elif activity_type == 'travel_km':
                    emissions = quantity * self.emission_factors['travel']
                    key = 'travel'
                elif activity_type == 'waste_kg':
                    emissions = quantity * self.emission_factors['waste']
                    key = 'waste'
                else:
                    continue

                # Classify by scope
                scope = self.scope_classification[key]
                scopes[scope] += emissions
                breakdown[key] = {
                    'quantity': quantity,
                    'emissions_kg': round(emissions, 2),
                    'scope': scope
                }

            # Calculate total
            total_co2e = sum(scopes.values())

            result = {
                'organization_id': organization_id,
                'month': month,
                'scope1': round(scopes['scope1'], 2),
                'scope2': round(scopes['scope2'], 2),
                'scope3': round(scopes['scope3'], 2),
                'total_co2e': round(total_co2e, 2),
                'breakdown': breakdown,
                'timestamp': datetime.utcnow().isoformat()
            }

            self.logger.info(f"Calculated emissions for {organization_id}: {total_co2e:.2f} kg CO₂e")
            return result

        except Exception as e:
            self.logger.error(f"Error calculating emissions: {str(e)}")
            raise

    def engineer_features(self, historical_data: List[float],
                        employee_counts: Optional[List[int]] = None) -> pd.DataFrame:
        """
        Engineer features for ML models

        Args:
            historical_data: List of monthly emissions
            employee_counts: Optional list of monthly employee counts

        Returns:
            DataFrame with engineered features
        """
        df = pd.DataFrame({
            'emissions': historical_data
        })

        # Lag features
        df['lag_1'] = df['emissions'].shift(1)
        df['lag_3'] = df['emissions'].shift(3)
        df['lag_6'] = df['emissions'].shift(6)
        df['lag_12'] = df['emissions'].shift(12)

        # Rolling averages
        df['rolling_mean_3'] = df['emissions'].rolling(window=3, min_periods=1).mean()
        df['rolling_mean_6'] = df['emissions'].rolling(window=6, min_periods=1).mean()
        df['rolling_mean_12'] = df['emissions'].rolling(window=12, min_periods=1).mean()

        # Rolling standard deviation
        df['rolling_std_3'] = df['emissions'].rolling(window=3, min_periods=1).std()
        df['rolling_std_6'] = df['emissions'].rolling(window=6, min_periods=1).std()

        # Seasonal components
        df['month'] = (df.index % 12) + 1
        df['quarter'] = ((df['month'] - 1) // 3) + 1
        df['is_summer'] = df['month'].isin([6, 7, 8]).astype(int)
        df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)

        # Trend
        df['trend'] = np.arange(len(df))

        # Employee count if provided
        if employee_counts and len(employee_counts) == len(df):
            df['employee_count'] = employee_counts
            df['emissions_per_employee'] = df['emissions'] / (df['employee_count'] + 1)

        # Fill NaN from shifting
        df = df.fillna(method='bfill').fillna(method='ffill')

        return df

    def get_latest_forecast(self, organization_id: str, months_ahead: int = 12) -> Optional[Dict]:
        """
        Get latest forecast from database/cache

        Args:
            organization_id: Organization ID
            months_ahead: Number of months to forecast

        Returns:
            Forecast dict or None
        """
        # TODO: Implement database/cache lookup
        self.logger.warning("get_latest_forecast not yet implemented - returning None")
        return None

    def get_dashboard_summary(self, organization_id: str) -> Optional[Dict]:
        """
        Get dashboard summary

        Args:
            organization_id: Organization ID

        Returns:
            Dashboard summary dict
        """
        # TODO: Implement dashboard summary logic
        self.logger.warning("get_dashboard_summary not yet implemented - returning None")
        return None
