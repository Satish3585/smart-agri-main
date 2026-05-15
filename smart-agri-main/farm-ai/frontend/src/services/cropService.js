import api from './api'

export const cropService = {
  recommend: (data) => api.post('/crops/recommend', data),
  getCatalog: () => api.get('/crops/catalog'),
  registerCultivation: (data) => api.post('/crops/register-cultivation', data),
  getSaturation: (region, season = 'kharif') =>
    api.get(`/crops/saturation/${region}?season=${season}`),
  getHistory: () => api.get('/crops/history'),
}
