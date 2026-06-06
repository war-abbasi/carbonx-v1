"""
CarbonX ML Microservice
Forecasting engine with Prophet, XGBoost, and Holt-Winters comparison
"""

from flask import Flask, jsonify, request
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime
import logging
import numpy as np

from services.forecast_service import ForecastService
from services.data_service import DataService
from services.model_comparison import ModelComparison

# Load environment variables
load_dotenv()


class NumpyJSONProvider(DefaultJSONProvider):
    """JSON provider that knows how to serialize numpy scalar/array types.

    XGBoost and Prophet return numpy float32/float64 values; the stock JSON
    encoder raises 'Object of type float32 is not JSON serializable'.
    """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


# Initialize Flask app
app = Flask(__name__)
app.json = NumpyJSONProvider(app)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
forecast_service = ForecastService()
data_service = DataService()
model_comparison = ModelComparison()

# ==================== API ENDPOINTS ====================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'CarbonX ML Microservice'
    }), 200


@app.route('/api/v1/forecast/generate', methods=['POST'])
def generate_forecast():
    """
    Generate forecast for organization

    Request body:
    {
        "organization_id": "org_123",
        "historical_data": [120, 130, 140, 150, ...],  # 36+ months
        "months_ahead": 12,
        "features": {...}  # Optional feature dict
    }

    Returns:
    {
        "forecast_prophet": [...],
        "forecast_xgboost": [...],
        "forecast_holt_winters": [...],
        "best_model": "prophet",
        "metrics": {...},
        "confidence_intervals": {...}
    }
    """
    try:
        data = request.get_json()

        # Validate input
        if 'historical_data' not in data or 'organization_id' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        org_id = data['organization_id']
        historical = data['historical_data']
        months_ahead = data.get('months_ahead', 12)

        logger.info(f"Generating forecast for org {org_id} with {len(historical)} months of data")

        # Generate forecasts with all 3 models
        result = model_comparison.compare_models(
            organization_id=org_id,
            historical_data=historical,
            forecast_horizon=months_ahead,
            features=data.get('features')
        )

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Forecast generation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/forecast/<organization_id>', methods=['GET'])
def get_forecast(organization_id):
    """
    Get latest forecast for organization

    Query params:
    - months_ahead: 3, 6, 9, 12 (default: 12)
    """
    try:
        months_ahead = request.args.get('months_ahead', 12, type=int)

        # Fetch from database or cache
        forecast = forecast_service.get_latest_forecast(
            organization_id=organization_id,
            months_ahead=months_ahead
        )

        if not forecast:
            return jsonify({'error': 'No forecast found'}), 404

        return jsonify(forecast), 200

    except Exception as e:
        logger.error(f"Get forecast error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/emissions/calculate', methods=['POST'])
def calculate_emissions():
    """
    Calculate emissions from activity data

    Request body:
    {
        "organization_id": "org_123",
        "month": "2026-01",
        "activities": {
            "electricity_kwh": 50000,
            "diesel_liters": 1000,
            "travel_km": 5000,
            "waste_kg": 500
        }
    }

    Returns:
    {
        "scope1": 2680,
        "scope2": 22500,
        "scope3": 1000,
        "total_co2e": 26180,
        "breakdown": {...}
    }
    """
    try:
        data = request.get_json()

        if 'organization_id' not in data or 'activities' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        result = forecast_service.calculate_emissions(
            organization_id=data['organization_id'],
            activities=data['activities'],
            month=data.get('month')
        )

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Emissions calculation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/dashboard/<organization_id>', methods=['GET'])
def get_dashboard_summary(organization_id):
    """
    Get dashboard summary with current and forecast data

    Returns:
    {
        "current_emissions": 240.5,
        "forecast_next_month": 245.8,
        "annual_projection": 2950,
        "trend": "increasing",
        "budget_status": "on_track" | "warning" | "exceeded",
        "model_performance": {...},
        "breakdown": {...}
    }
    """
    try:
        summary = forecast_service.get_dashboard_summary(organization_id)

        if not summary:
            return jsonify({'error': 'Organization not found'}), 404

        return jsonify(summary), 200

    except Exception as e:
        logger.error(f"Dashboard summary error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/models/comparison', methods=['GET'])
def get_model_comparison():
    """
    Get model performance comparison table for FYP

    Query params:
    - organization_id: optional (if not provided, returns aggregate stats)

    Returns:
    {
        "models": [
            {
                "name": "Prophet",
                "rmse": 8.5,
                "mae": 6.2,
                "mape": 3.1,
                "r2": 0.92,
                "training_time_seconds": 2.3
            },
            {...}
        ],
        "best_model": "prophet",
        "timestamp": "2026-01-15T10:30:00Z"
    }
    """
    try:
        org_id = request.args.get('organization_id')

        comparison = model_comparison.get_comparison_metrics(org_id)

        return jsonify(comparison), 200

    except Exception as e:
        logger.error(f"Model comparison error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/activity/upload', methods=['POST'])
def upload_activity():
    """
    Upload activity data for organization

    Request body:
    {
        "organization_id": "org_123",
        "data": [
            {
                "month": "2026-01",
                "electricity_kwh": 50000,
                "diesel_liters": 1000,
                "travel_km": 5000,
                "waste_kg": 500,
                "employee_count": 150
            },
            {...}
        ]
    }
    """
    try:
        data = request.get_json()

        if 'organization_id' not in data or 'data' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        result = data_service.upload_activity_records(
            organization_id=data['organization_id'],
            records=data['data']
        )

        return jsonify({
            'message': 'Activity data uploaded successfully',
            'records_processed': result['count'],
            'timestamp': datetime.utcnow().isoformat()
        }), 201

    except Exception as e:
        logger.error(f"Activity upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/models/train', methods=['POST'])
def train_models():
    """
    Trigger model retraining for organization

    Request body:
    {
        "organization_id": "org_123",
        "force_retrain": false
    }
    """
    try:
        data = request.get_json()
        org_id = data.get('organization_id')
        force = data.get('force_retrain', False)

        logger.info(f"Training models for org {org_id}")

        result = model_comparison.train_all_models(
            organization_id=org_id,
            force_retrain=force
        )

        return jsonify({
            'message': 'Model training initiated',
            'organization_id': org_id,
            'status': 'training',
            'job_id': result.get('job_id'),
            'timestamp': datetime.utcnow().isoformat()
        }), 202  # Accepted

    except Exception as e:
        logger.error(f"Model training error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5001))
    debug = os.getenv('DEBUG', 'False') == 'True'

    logger.info(f"Starting CarbonX ML Microservice on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
