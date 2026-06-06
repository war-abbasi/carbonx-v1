#!/usr/bin/env python3
"""
CarbonX ML Service - Test with Real Data
Tests all 3 models against real carbonx-dataset
"""

import sys
import os
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.prophet_model import ProphetForecaster
from services.xgboost_model import XGBoostForecaster
from services.holt_winters_model import HoltWintersForecaster
from services.model_comparison import ModelComparison

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RealDataTester:
    """Test ML models against real carbon emissions data"""

    def __init__(self, dataset_path: str = '../carbonx-dataset'):
        """
        Initialize with path to dataset

        Args:
            dataset_path: Path to carbonx-dataset folder
        """
        self.dataset_path = dataset_path
        self.emissions_df = None
        self.activity_df = None
        self.organizations_df = None
        self.results = {}

    def load_data(self) -> bool:
        """Load CSV files from dataset"""
        try:
            logger.info(f"Loading data from {self.dataset_path}")

            self.emissions_df = pd.read_csv(
                os.path.join(self.dataset_path, 'computed_emissions.csv')
            )
            self.activity_df = pd.read_csv(
                os.path.join(self.dataset_path, 'monthly_activity.csv')
            )
            self.organizations_df = pd.read_csv(
                os.path.join(self.dataset_path, 'organizations.csv')
            )

            logger.info(f"✓ Loaded emissions: {len(self.emissions_df)} rows")
            logger.info(f"✓ Loaded activities: {len(self.activity_df)} rows")
            logger.info(f"✓ Loaded organizations: {len(self.organizations_df)} rows")

            # Validate data
            unique_orgs = self.emissions_df['org_id'].unique()
            logger.info(f"✓ Found {len(unique_orgs)} organizations")
            logger.info(f"✓ Date range: {self.emissions_df['month'].min()} to {self.emissions_df['month'].max()}")

            return True

        except FileNotFoundError as e:
            logger.error(f"Data file not found: {e}")
            return False
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return False

    def get_org_data(self, org_id: str) -> Tuple[List[float], List[int], Dict]:
        """
        Extract emissions and employee data for organization

        Args:
            org_id: Organization ID

        Returns:
            (emissions_list, employee_counts, org_info)
        """
        # Get org info
        org_info = self.organizations_df[
            self.organizations_df['org_id'] == org_id
        ].iloc[0].to_dict()

        # Get emissions data
        org_emissions = self.emissions_df[
            self.emissions_df['org_id'] == org_id
        ].sort_values('month')

        emissions_list = org_emissions['total_co2e'].tolist()

        # Get employee counts
        org_activities = self.activity_df[
            self.activity_df['org_id'] == org_id
        ].sort_values('month')

        employee_counts = org_activities['employees'].tolist()

        return emissions_list, employee_counts, org_info

    def test_organization(self, org_id: str) -> Dict:
        """
        Test all 3 models on single organization

        Args:
            org_id: Organization ID

        Returns:
            Results dictionary
        """
        try:
            logger.info(f"\n{'='*70}")
            logger.info(f"Testing Organization: {org_id}")
            logger.info(f"{'='*70}")

            # Get data
            emissions, employees, org_info = self.get_org_data(org_id)

            print(f"\n📊 {org_info['org_name']} ({org_id})")
            print(f"   Sector: {org_info['sector']}")
            print(f"   Employees: {org_info['base_employees']}")
            print(f"   Data points: {len(emissions)} months")
            print(f"   Emissions: {min(emissions):.1f} - {max(emissions):.1f} kg CO2e")
            print(f"   Mean: {np.mean(emissions):.1f} kg CO2e/month")

            # Test Prophet
            print(f"\n   🔵 PROPHET")
            prophet = ProphetForecaster(interval_width=0.9)
            prophet_result = prophet.train(emissions, start_date='2023-01-01')
            prophet_metrics = prophet_result['metrics']
            prophet_forecast = prophet.forecast_future(periods=12)
            print(f"      RMSE: {prophet_metrics['rmse']:.4f}")
            print(f"      MAE:  {prophet_metrics['mae']:.4f}")
            print(f"      MAPE: {prophet_metrics['mape']:.2f}%")
            print(f"      R²:   {prophet_metrics['r2']:.4f}")

            # Test XGBoost
            print(f"\n   🟢 XGBOOST")
            xgb = XGBoostForecaster(n_estimators=100, max_depth=5, learning_rate=0.1)
            xgb_result = xgb.train(emissions, employees)
            xgb_metrics = xgb_result['metrics']
            xgb_forecast = xgb.forecast_future(emissions, periods=12, employee_counts=employees)
            print(f"      RMSE: {xgb_metrics['rmse']:.4f}")
            print(f"      MAE:  {xgb_metrics['mae']:.4f}")
            print(f"      MAPE: {xgb_metrics['mape']:.2f}%")
            print(f"      R²:   {xgb_metrics['r2']:.4f}")

            # Test Holt-Winters
            print(f"\n   🔴 HOLT-WINTERS")
            hw = HoltWintersForecaster(alpha=0.3, beta=0.1, gamma=0.1)
            hw_result = hw.train(emissions, start_date='2023-01-01')
            hw_metrics = hw_result['metrics']
            hw_forecast = hw.forecast_future(periods=12)
            print(f"      RMSE: {hw_metrics['rmse']:.4f}")
            print(f"      MAE:  {hw_metrics['mae']:.4f}")
            print(f"      MAPE: {hw_metrics['mape']:.2f}%")
            print(f"      R²:   {hw_metrics['r2']:.4f}")

            # Determine winner
            rmses = {
                'Prophet': prophet_metrics['rmse'],
                'XGBoost': xgb_metrics['rmse'],
                'Holt-Winters': hw_metrics['rmse']
            }
            winner = min(rmses, key=rmses.get)

            print(f"\n   ✨ WINNER: {winner} (RMSE={rmses[winner]:.4f})")

            return {
                'org_id': org_id,
                'org_name': org_info['org_name'],
                'sector': org_info['sector'],
                'data_points': len(emissions),
                'prophet': {
                    'metrics': prophet_metrics,
                    'forecast': prophet_forecast
                },
                'xgboost': {
                    'metrics': xgb_metrics,
                    'forecast': xgb_forecast
                },
                'holt_winters': {
                    'metrics': hw_metrics,
                    'forecast': hw_forecast
                },
                'winner': winner,
                'winner_rmse': rmses[winner]
            }

        except Exception as e:
            logger.error(f"Error testing {org_id}: {str(e)}")
            return None

    def test_all_organizations(self) -> Dict:
        """Test all organizations in dataset"""
        print(f"\n{'#'*70}")
        print(f"#  CarbonX ML Service - Testing with Real Data")
        print(f"#  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'#'*70}")

        unique_orgs = self.emissions_df['org_id'].unique()

        for org_id in unique_orgs:
            result = self.test_organization(org_id)
            if result:
                self.results[org_id] = result

        return self.results

    def print_summary(self):
        """Print summary of all organization tests"""
        if not self.results:
            logger.warning("No results to summarize")
            return

        print(f"\n{'#'*70}")
        print(f"#  SUMMARY ACROSS ALL ORGANIZATIONS")
        print(f"{'#'*70}\n")

        # Count winners
        winners = {}
        for org_result in self.results.values():
            winner = org_result['winner']
            winners[winner] = winners.get(winner, 0) + 1

        print("Model Performance Across All Orgs:")
        print(f"{'Model':<20} {'Wins':<10} {'Avg RMSE':<15}")
        print("-" * 45)

        for model_name in ['Prophet', 'XGBoost', 'Holt-Winters']:
            wins = winners.get(model_name, 0)
            rmses = [
                r[model_name.lower() if model_name != 'Holt-Winters' else 'holt_winters']['metrics']['rmse']
                for r in self.results.values()
            ]
            avg_rmse = np.mean(rmses)
            print(f"{model_name:<20} {wins:<10} {avg_rmse:<15.4f}")

        print(f"\n{'Organization':<30} {'Sector':<20} {'Best Model':<20} {'RMSE':<10}")
        print("-" * 80)

        for org_id, result in self.results.items():
            print(f"{result['org_name']:<30} {result['sector']:<20} {result['winner']:<20} {result['winner_rmse']:<10.4f}")

    def export_results(self, filename: str = 'real_data_test_results.json'):
        """Export results to JSON file"""
        try:
            # Prepare data for JSON serialization
            export_data = {}
            for org_id, result in self.results.items():
                export_data[org_id] = {
                    'org_name': result['org_name'],
                    'sector': result['sector'],
                    'winner': result['winner'],
                    'winner_rmse': float(result['winner_rmse']),
                    'prophet_rmse': float(result['prophet']['metrics']['rmse']),
                    'xgboost_rmse': float(result['xgboost']['metrics']['rmse']),
                    'holt_winters_rmse': float(result['holt_winters']['metrics']['rmse'])
                }

            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2)

            logger.info(f"✓ Results exported to {filename}")

        except Exception as e:
            logger.error(f"Error exporting results: {e}")

    def create_detailed_report(self):
        """Create detailed report for first organization"""
        if not self.results:
            logger.warning("No results available for report")
            return

        # Get first organization
        first_org = list(self.results.values())[0]
        org_name = first_org['org_name']

        print(f"\n{'='*70}")
        print(f"DETAILED REPORT: {org_name}")
        print(f"{'='*70}\n")

        print("PROPHET FORECAST (12 months):")
        for i, forecast in enumerate(first_org['prophet']['forecast'][:3], 1):
            print(f"  Month {i}: {forecast['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {forecast['lower_bound']:.1f} - {forecast['upper_bound']:.1f})")
        print(f"  ... ({len(first_org['prophet']['forecast'])} months total)")

        print(f"\nXGBOOST FORECAST (12 months):")
        for i, forecast in enumerate(first_org['xgboost']['forecast'][:3], 1):
            print(f"  Month {i}: {forecast['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {forecast['lower_bound']:.1f} - {forecast['upper_bound']:.1f})")
        print(f"  ... ({len(first_org['xgboost']['forecast'])} months total)")

        print(f"\nHOLT-WINTERS FORECAST (12 months):")
        for i, forecast in enumerate(first_org['holt_winters']['forecast'][:3], 1):
            print(f"  Month {i}: {forecast['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {forecast['lower_bound']:.1f} - {forecast['upper_bound']:.1f})")
        print(f"  ... ({len(first_org['holt_winters']['forecast'])} months total)")


def main():
    """Main test function"""
    try:
        # Create tester
        tester = RealDataTester()

        # Load data
        if not tester.load_data():
            logger.error("Failed to load data")
            return 1

        # Test all organizations
        tester.test_all_organizations()

        # Print summary
        tester.print_summary()

        # Create detailed report
        tester.create_detailed_report()

        # Export results
        tester.export_results()

        print(f"\n{'#'*70}")
        print(f"✓ TESTING COMPLETE")
        print(f"{'#'*70}\n")

        return 0

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
