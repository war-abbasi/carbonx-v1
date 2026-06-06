#!/usr/bin/env python3
"""
Test script for CarbonX ML models
Run: python test_models.py
"""

import sys
import logging
from typing import List
import numpy as np
import pandas as pd
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import models
from services.prophet_model import ProphetForecaster
from services.xgboost_model import XGBoostForecaster
from services.holt_winters_model import HoltWintersForecaster
from services.model_comparison import ModelComparison


def generate_synthetic_data(months: int = 36) -> tuple[List[float], List[int]]:
    """
    Generate realistic synthetic emissions data

    Args:
        months: Number of months of data to generate

    Returns:
        (emissions_data, employee_counts)
    """
    np.random.seed(42)
    emissions = []
    employee_counts = []

    for month in range(months):
        # Base: 200 kg/month
        base = 200

        # Trend: +2 kg/month
        trend = month * 2

        # Seasonality: Peak in summer (June-August) due to AC usage
        seasonal_amplitude = 50
        seasonal = seasonal_amplitude * np.sin(month * 2 * np.pi / 12 - np.pi / 2)

        # Noise: ±5%
        noise = np.random.normal(0, base * 0.05)

        total = base + trend + seasonal + noise
        total = max(100, total)  # Ensure positive

        emissions.append(round(total, 2))

        # Employee count: increases over time
        emp_count = 100 + (month * 2)
        employee_counts.append(emp_count)

    return emissions, employee_counts


def print_section(title: str):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


def test_prophet(emissions_data: List[float]):
    """Test Prophet model"""
    print_section("TESTING PROPHET MODEL")

    try:
        prophet = ProphetForecaster(interval_width=0.9)

        logger.info("Training Prophet...")
        result = prophet.train(emissions_data, start_date='2023-01-01')

        print(f"\n✓ Training Status: {result['status']}")
        print(f"✓ Training Time: {result['training_time']:.3f}s")

        print(f"\nMetrics:")
        metrics = result['metrics']
        print(f"  • RMSE:  {metrics['rmse']:.4f}")
        print(f"  • MAE:   {metrics['mae']:.4f}")
        print(f"  • MAPE:  {metrics['mape']:.2f}%")
        print(f"  • R²:    {metrics['r2']:.4f}")

        logger.info("Generating forecast...")
        forecast = prophet.forecast_future(periods=12)

        print(f"\nForecast (next 12 months):")
        for i, f in enumerate(forecast[:3], 1):
            print(f"  Month {i}: {f['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {f['lower_bound']:.1f} - {f['upper_bound']:.1f})")
        print(f"  ... ({len(forecast)} months total)")

        avg_forecast = np.mean([f['predicted_emissions'] for f in forecast])
        print(f"\nAverage forecast: {avg_forecast:.1f} kg/month")

        return True, result['metrics'], result['training_time']

    except Exception as e:
        logger.error(f"Prophet test failed: {str(e)}")
        return False, None, None


def test_xgboost(emissions_data: List[float], employee_counts: List[int]):
    """Test XGBoost model"""
    print_section("TESTING XGBOOST MODEL")

    try:
        xgb = XGBoostForecaster(n_estimators=100, max_depth=5, learning_rate=0.1)

        logger.info("Training XGBoost...")
        result = xgb.train(emissions_data, employee_counts)

        print(f"\n✓ Training Status: {result['status']}")
        print(f"✓ Training Time: {result['training_time']:.3f}s")

        print(f"\nMetrics:")
        metrics = result['metrics']
        print(f"  • RMSE:  {metrics['rmse']:.4f}")
        print(f"  • MAE:   {metrics['mae']:.4f}")
        print(f"  • MAPE:  {metrics['mape']:.2f}%")
        print(f"  • R²:    {metrics['r2']:.4f}")

        # Feature importance
        logger.info("Calculating feature importance...")
        importance = xgb.get_feature_importance()

        print(f"\nTop 5 Features:")
        for i, (feature, imp_score) in enumerate(importance[:5], 1):
            print(f"  {i}. {feature}: {imp_score:.4f}")

        logger.info("Generating forecast...")
        forecast = xgb.forecast_future(emissions_data, periods=12, employee_counts=employee_counts)

        print(f"\nForecast (next 12 months):")
        for i, f in enumerate(forecast[:3], 1):
            print(f"  Month {i}: {f['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {f['lower_bound']:.1f} - {f['upper_bound']:.1f})")
        print(f"  ... ({len(forecast)} months total)")

        avg_forecast = np.mean([f['predicted_emissions'] for f in forecast])
        print(f"\nAverage forecast: {avg_forecast:.1f} kg/month")

        return True, result['metrics'], result['training_time']

    except Exception as e:
        logger.error(f"XGBoost test failed: {str(e)}")
        return False, None, None


def test_holt_winters(emissions_data: List[float]):
    """Test Holt-Winters model"""
    print_section("TESTING HOLT-WINTERS MODEL")

    try:
        hw = HoltWintersForecaster(alpha=0.3, beta=0.1, gamma=0.1)

        logger.info("Training Holt-Winters...")
        result = hw.train(emissions_data, start_date='2023-01-01')

        print(f"\n✓ Training Status: {result['status']}")
        print(f"✓ Training Time: {result['training_time']:.4f}s")

        print(f"\nMetrics:")
        metrics = result['metrics']
        print(f"  • RMSE:  {metrics['rmse']:.4f}")
        print(f"  • MAE:   {metrics['mae']:.4f}")
        print(f"  • MAPE:  {metrics['mape']:.2f}%")
        print(f"  • R²:    {metrics['r2']:.4f}")

        logger.info("Generating forecast...")
        forecast = hw.forecast_future(periods=12)

        print(f"\nForecast (next 12 months):")
        for i, f in enumerate(forecast[:3], 1):
            print(f"  Month {i}: {f['predicted_emissions']:.1f} kg " +
                  f"(90% CI: {f['lower_bound']:.1f} - {f['upper_bound']:.1f})")
        print(f"  ... ({len(forecast)} months total)")

        avg_forecast = np.mean([f['predicted_emissions'] for f in forecast])
        print(f"\nAverage forecast: {avg_forecast:.1f} kg/month")

        return True, result['metrics'], result['training_time']

    except Exception as e:
        logger.error(f"Holt-Winters test failed: {str(e)}")
        return False, None, None


def test_model_comparison(emissions_data: List[float], employee_counts: List[int]):
    """Test model comparison"""
    print_section("TESTING MODEL COMPARISON")

    try:
        mc = ModelComparison()

        logger.info("Comparing all 3 models...")
        features = {
            'employee_counts': employee_counts,
            'start_date': '2023-01-01'
        }

        result = mc.compare_models('test_org', emissions_data, forecast_horizon=12, features=features)

        print(f"\nComparison Results:")
        print(f"\n{'Model':<15} {'RMSE':<10} {'MAE':<10} {'MAPE':<10} {'R²':<10} {'Training':<10}")
        print("-" * 65)

        summary = mc.get_comparison_metrics()
        for row in summary:
            print(f"{row['model']:<15} {row['rmse']:<10.4f} {row['mae']:<10.4f} " +
                  f"{row['mape']:<10.2f} {row['r2']:<10.4f} {row['training_time_seconds']:<10.3f}s")

        print(f"\n✓ BEST MODEL: {result['best_model'].upper()}")
        print(f"  (Selected based on lowest RMSE)")

        return True, result

    except Exception as e:
        logger.error(f"Model comparison failed: {str(e)}")
        return False, None


def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " " * 15 + "CARBONX ML SERVICE TEST SUITE" + " " * 23 + "║")
    print("╚" + "="*68 + "╝")

    print("\nGenerating synthetic test data...")
    emissions_data, employee_counts = generate_synthetic_data(months=36)

    print(f"✓ Generated {len(emissions_data)} months of data")
    print(f"  Range: {min(emissions_data):.1f} - {max(emissions_data):.1f} kg CO2e/month")
    print(f"  Mean:  {np.mean(emissions_data):.1f} kg CO2e/month")
    print(f"  Std:   {np.std(emissions_data):.1f} kg CO2e/month")

    # Track results
    results = {
        'prophet': {'success': False, 'metrics': None, 'time': None},
        'xgboost': {'success': False, 'metrics': None, 'time': None},
        'holt_winters': {'success': False, 'metrics': None, 'time': None},
        'comparison': {'success': False}
    }

    # Test Prophet
    success, metrics, train_time = test_prophet(emissions_data)
    results['prophet']['success'] = success
    results['prophet']['metrics'] = metrics
    results['prophet']['time'] = train_time

    # Test XGBoost
    success, metrics, train_time = test_xgboost(emissions_data, employee_counts)
    results['xgboost']['success'] = success
    results['xgboost']['metrics'] = metrics
    results['xgboost']['time'] = train_time

    # Test Holt-Winters
    success, metrics, train_time = test_holt_winters(emissions_data)
    results['holt_winters']['success'] = success
    results['holt_winters']['metrics'] = metrics
    results['holt_winters']['time'] = train_time

    # Test Comparison
    success, comp_result = test_model_comparison(emissions_data, employee_counts)
    results['comparison']['success'] = success

    # Summary
    print_section("TEST SUMMARY")

    all_passed = all(r['success'] for r in results.values())

    print(f"\n✓ Prophet:       {'PASS' if results['prophet']['success'] else 'FAIL'}")
    print(f"✓ XGBoost:       {'PASS' if results['xgboost']['success'] else 'FAIL'}")
    print(f"✓ Holt-Winters:  {'PASS' if results['holt_winters']['success'] else 'FAIL'}")
    print(f"✓ Comparison:    {'PASS' if results['comparison']['success'] else 'FAIL'}")

    if all_passed:
        print(f"\n{'='*70}")
        print("✓ ALL TESTS PASSED")
        print(f"{'='*70}")
        return 0
    else:
        print(f"\n{'='*70}")
        print("✗ SOME TESTS FAILED - See errors above")
        print(f"{'='*70}")
        return 1


if __name__ == '__main__':
    try:
        exit_code = run_all_tests()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        sys.exit(1)
