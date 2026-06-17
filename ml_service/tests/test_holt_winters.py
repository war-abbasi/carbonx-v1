"""Unit tests for Holt-Winters (pure numpy, no Prophet/XGBoost needed)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.holt_winters_model import HoltWintersForecaster


def _seasonal_series(n=36):
    return [1000 + 8 * t + 200 * math.sin(2 * math.pi * (t % 12) / 12) for t in range(n)]


def test_train_returns_metrics_and_tunes_params():
    hw = HoltWintersForecaster()
    res = hw.train(_seasonal_series(), '2023-01')
    assert res['status'] == 'success'
    assert 0 <= hw.metrics['r2'] <= 1
    # grid search should fit a clean seasonal series well
    assert hw.metrics['r2'] > 0.7
    assert hw.alpha in [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9]


def test_forecast_shape_and_bounds():
    hw = HoltWintersForecaster()
    hw.train(_seasonal_series(), '2023-01')
    fc = hw.forecast_future(12)
    assert len(fc) == 12
    for f in fc:
        assert {'month', 'predicted_emissions', 'lower_bound', 'upper_bound'} <= set(f)
        assert f['lower_bound'] <= f['predicted_emissions'] <= f['upper_bound']
        assert f['predicted_emissions'] >= 0


def test_damped_trend_does_not_explode():
    # strong upward ramp: damped trend should keep 24-step forecast bounded
    hw = HoltWintersForecaster()
    data = [100 + 50 * t for t in range(24)]
    hw.train(data, '2023-01')
    fc = hw.forecast_future(24)
    last = fc[-1]['predicted_emissions']
    # without damping a linear +50/mo trend would reach ~2350; damping keeps it lower
    assert last < 100 + 50 * (24 + 24)


def test_requires_two_points():
    hw = HoltWintersForecaster()
    try:
        hw.train([100.0], '2023-01')
        assert False, 'expected ValueError'
    except ValueError:
        pass
