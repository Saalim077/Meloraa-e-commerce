import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect to login if the error is 401 AND it's NOT the initial session check (/auth/me)
    if (err.response?.status === 401 && !err.config.url.includes('/auth/me')) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/update-profile', d),
  changePassword: (d) => api.put('/auth/change-password', d),
  logout: () => api.post('/auth/logout'),
  addAddress: (d) => api.post('/auth/address', d),
  updateAddress: (id, d) => api.put(`/auth/address/${id}`, d),
  removeAddress: (id) => api.delete(`/auth/address/${id}`),
  toggleWishlist: (pid) => api.put(`/auth/wishlist/${pid}`),
  forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyRegister: (d) => api.post('/auth/verify-register', d),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (slug) => api.get(`/products/${slug}`),
  create: (d) => api.post('/products', d),
  update: (id, d) => api.put(`/products/${id}`, d),
  remove: (id) => api.delete(`/products/${id}`),
  addReview: (id, d) => api.post(`/products/${id}/reviews`, d),
  related: (id) => api.get(`/products/${id}/related`),
};

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (d) => api.post('/categories', d),
  update: (id, d) => api.put(`/categories/${id}`, d),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const orderAPI = {
  create: (d) => api.post('/orders', d),
  myOrders: (params) => api.get('/orders/my-orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, d) => api.put(`/orders/${id}/status`, d),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  refund: (id, d) => api.post(`/orders/${id}/refund`, d),
};

export const couponAPI = {
  getAll: () => api.get('/coupons'),
  validate: (d) => api.post('/coupons/validate', d),
  create: (d) => api.post('/coupons', d),
  update: (id, d) => api.put(`/coupons/${id}`, d),
  remove: (id) => api.delete(`/coupons/${id}`),
};

export const uploadAPI = {
  upload: (formData) => api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (filename) => api.delete('/upload', { data: { filename } }),
};

export const paymentAPI = {
  createIntent: (d) => api.post('/payment/create-intent', d),
  verify: (d) => api.post('/payment/verify', d),
};

export const analyticsAPI = {
  summary: () => api.get('/analytics/summary'),
  salesTrends: (params) => api.get('/analytics/sales-trends', { params }),
  customerInsights: () => api.get('/analytics/customer-insights'),
  productPerformance: () => api.get('/analytics/product-performance'),
  conversionRate: (params) => api.get('/analytics/conversion-rate', { params }),
  reviewsAnalytics: () => api.get('/analytics/reviews-analytics'),
  financialReport: (params) => api.get('/analytics/financial-report', { params }),
  exportReport: () => api.get('/analytics/export/report'),
};

export const reviewAPI = {
  getAllReviews: (params) => api.get('/reviews', { params }),
  getOneReview: (id) => api.get(`/reviews/${id}`),
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (d) => api.post('/reviews', d),
  updateReviewStatus: (id, d) => api.put(`/reviews/${id}/status`, d),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (d) => api.put('/settings', d),
  getEmailTemplates: () => api.get('/settings/email-templates'),
  createEmailTemplate: (d) => api.post('/settings/email-templates', d),
  updateEmailTemplate: (id, d) => api.put(`/settings/email-templates/${id}`, d),
  deleteEmailTemplate: (id) => api.delete(`/settings/email-templates/${id}`),
};

export const adminAPI = {
  getActivityLogs: (params) => api.get('/admin', { params }),
  getInventoryAlerts: (params) => api.get('/admin/inventory/alerts', { params }),
  getAllInventory: (params) => api.get('/admin/inventory/all', { params }),
  resolveInventoryAlert: (id) => api.put(`/admin/inventory/alerts/${id}/resolve`),
};

export const bulkAPI = {
  updatePrices: (d) => api.put('/bulk/products/bulk/price', d),
  updateStatus: (d) => api.put('/bulk/products/bulk/status', d),
  updateStock: (d) => api.put('/bulk/products/bulk/stock', d),
  deleteProducts: (d) => api.delete('/bulk/products/bulk', { data: d }),
  exportProducts: () => api.get('/bulk/products/export/csv'),
  importProducts: (d) => api.post('/bulk/products/import/csv', d),
};

export const userAdminAPI = {
  getAll: (params) => api.get('/users', { params }),
  getDetails: (id) => api.get(`/users/${id}/details`),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  remove: (id) => api.delete(`/users/${id}`),
};

export const returnAPI = {
  create:         (data)     => api.post('/returns', data),
  myReturns:      ()         => api.get('/returns/my-returns'),
  getOne:         (id)       => api.get(`/returns/my-returns/${id}`),
  cancel:         (id)       => api.put(`/returns/my-returns/${id}/cancel`),
  getAll:         (params)   => api.get('/returns', { params }),         // admin
  getDetail:      (id)       => api.get(`/returns/${id}`),               // admin
  updateStatus:   (id, data) => api.put(`/returns/${id}/status`, data),  // admin
  analytics:      ()         => api.get('/returns/analytics'),           // admin
  getEligibility: (id)       => api.get(`/orders/${id}/return-eligibility`),
};

export default api;
