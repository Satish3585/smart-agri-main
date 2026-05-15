import api from './api'

export const weatherService = {
  getCurrent: (lat = 12.9716, lon = 77.5946) =>
    api.get(`/weather/current?lat=${lat}&lon=${lon}`),
  getForecast: (lat = 12.9716, lon = 77.5946, days = 5) =>
    api.get(`/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`),
  getIrrigationAdvice: (lat, lon, cropType, soilMoisture, lastDays) =>
    api.get(`/weather/irrigation-advice?lat=${lat}&lon=${lon}&crop_type=${cropType}&soil_moisture=${soilMoisture}&last_irrigation_days=${lastDays}`),
  getFarmingAlerts: (lat, lon, cropType) =>
    api.get(`/weather/farming-alerts?lat=${lat}&lon=${lon}&crop_type=${cropType}`),
}
