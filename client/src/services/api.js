import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Inject auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const updateStock = (id, data) => api.put(`/products/${id}/stock`, data);
export const getStockMovements = (id) => api.get(`/products/${id}/stock-movements`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const trackOrder = (orderNumber) => api.get(`/orders/track/${orderNumber}`);
export const trackByPhone = (phone) => api.get(`/orders/track-phone/${phone}`);
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);

// Payments
export const initiatePayment = (data) => api.post('/payments/initiate', data);
export const simulatePayment = (orderNumber) => api.post(`/payments/simulate/${orderNumber}`);

// Admin
export const adminLogin = (data) => api.post('/admin/login', data);
export const getAdminProfile = () => api.get('/admin/profile');
export const getLowStock = () => api.get('/admin/low-stock');

// Stats
export const getDashboard = () => api.get('/stats/dashboard');
export const getTopProducts = (params) => api.get('/stats/top-products', { params });
export const getSalesByCategory = () => api.get('/stats/sales-by-category');
export const getMonthlyRevenue = () => api.get('/stats/monthly-revenue');
export const getPeakHours = () => api.get('/stats/peak-hours');
export const exportOrders = (params) => api.get('/stats/export', { params, responseType: 'blob' });

export default api;
