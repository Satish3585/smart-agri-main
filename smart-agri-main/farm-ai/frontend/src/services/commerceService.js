import api from './api'

export const commerceService = {
  getListings: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/commerce/listings${query ? '?' + query : ''}`)
  },
  createListing: (data) => api.post('/commerce/listings', data),
  updateListing: (id, data) => api.put(`/commerce/listings/${id}`, data),
  placeOrder: (data) => api.post('/commerce/orders', data),
  getMyOrders: () => api.get('/commerce/orders/my'),
  getMyListings: () => api.get('/commerce/my-listings'),
}
