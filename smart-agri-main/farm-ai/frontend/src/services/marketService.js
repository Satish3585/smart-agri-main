import api from './api'

export const marketService = {
  getSaturationDashboard: (region = 'Karnataka', season = 'kharif') =>
    api.get(`/market/saturation-dashboard?region=${region}&season=${season}`),
  getTrends: (cropId) => api.get(`/market/trends/${cropId}`),
  getPricePrediction: (cropId, months = 6) =>
    api.get(`/market/price-prediction/${cropId}?months=${months}`),
  getAlerts: (region = 'Karnataka', season = 'kharif') =>
    api.get(`/market/alerts?region=${region}&season=${season}`),
  getOverview: (region = 'Karnataka', season = 'kharif') =>
    api.get(`/market/overview?region=${region}&season=${season}`),
}
