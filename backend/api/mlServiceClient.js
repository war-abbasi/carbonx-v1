const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000');

class MLServiceClient {
  /**
   * Generate forecast using all 3 ML models
   */
  async generateForecast(organizationId, historicalData, options = {}) {
    try {
      logger.info(`[ML Service] Generating forecast for ${organizationId}`);

      const payload = {
        organization_id: organizationId,
        historical_data: historicalData,
        months_ahead: options.months || 12,
        features: {
          employee_counts: options.employeeCounts || [],
          start_date: options.startDate || '2023-01-01'
        }
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/forecast/generate`,
        payload,
        {
          timeout: ML_SERVICE_TIMEOUT
        }
      );

      logger.info(`[ML Service] Forecast generated successfully for ${organizationId}`);
      return response.data;

    } catch (error) {
      logger.error(`[ML Service] Forecast error: ${error.message}`);
      throw new Error(`Forecast generation failed: ${error.message}`);
    }
  }

  /**
   * Compare all 3 models
   */
  async compareModels(organizationId, historicalData, options = {}) {
    try {
      const payload = {
        organization_id: organizationId,
        historical_data: historicalData,
        forecast_horizon: options.horizon || 12,
        features: {
          employee_counts: options.employeeCounts || [],
          start_date: options.startDate || '2023-01-01'
        }
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/forecast/generate`,
        payload,
        {
          timeout: ML_SERVICE_TIMEOUT
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`[ML Service] Model comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model comparison metrics table
   */
  async getModelComparison() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/api/v1/models/comparison`,
        { timeout: ML_SERVICE_TIMEOUT }
      );

      return response.data;

    } catch (error) {
      logger.error(`[ML Service] Get model comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/health`,
        { timeout: 5000 }
      );

      return response.data;

    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }
}

module.exports = new MLServiceClient();
