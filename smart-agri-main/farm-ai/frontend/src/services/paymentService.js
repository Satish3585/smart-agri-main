import api from './api'

export const paymentService = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getStatus: (orderId) => api.get(`/payment/status/${orderId}`),
}
