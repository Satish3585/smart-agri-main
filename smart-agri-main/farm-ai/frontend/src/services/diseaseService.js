import api from './api'
import axios from 'axios'

export const diseaseService = {
  detect: (formData) => {
    const token = localStorage.getItem('farm_ai_token')
    return axios.post('/api/disease/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    }).then(r => r.data)
  },
  getHistory:   () => api.get('/disease/history'),
  getStats:     () => api.get('/disease/stats'),
  getTreatment: (diseaseId) => api.get(`/disease/treatment/${diseaseId}`),
}
