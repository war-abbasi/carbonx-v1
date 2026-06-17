"""Unit tests for pure metrics — run with: pytest (needs numpy only)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.metrics import score


def test_perfect_prediction():
    m = score([10, 20, 30], [10, 20, 30])
    assert m['rmse'] == 0
    assert m['mae'] == 0
    assert m['r2'] == 1.0
    assert m['mape'] < 0.01


def test_known_error():
    m = score([100, 100, 100], [110, 90, 100])
    # residuals 10, -10, 0 -> rmse = sqrt(200/3) ≈ 8.165
    assert abs(m['rmse'] - 8.165) < 0.01
    assert abs(m['mae'] - 6.6667) < 0.01


def test_r2_clamped_non_negative():
    # predictions worse than the mean baseline -> r2 floored at 0
    m = score([1, 2, 3, 4], [4, 3, 2, 1])
    assert m['r2'] == 0.0


def test_handles_length_mismatch():
    m = score([10, 20], [10, 20, 30, 40])
    assert m['rmse'] == 0  # extra preds ignored
