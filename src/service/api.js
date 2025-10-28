import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3393/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Notification API
export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Product API
export const productAPI = {
  create: (data) => api.post('/AddProducts/create', data),
  getAll: (params = {}) => api.get('/AddProducts', { params }),
  getById: (id) => api.get(`/AddProducts/${id}`),
  update: (id, data) => api.put(`/AddProducts/${id}`, data),
  assign: (id, data) => api.post(`/AddProducts/${id}/assign`, data),
  getSuggestions: (field, search) => 
    api.get(`/AddProducts/suggestions?field=${field}&search=${search}`),
  delete: (id) => api.delete(`/AddProducts/${id}`),
  getAuthorizationRequests: (params = {}) => 
    api.get('/AddProducts/authorization-requests', { params }),
  handleAuthorization: (requestId, data) => 
    api.post(`/AddProducts/authorization-requests/${requestId}/handle`, data),
  getOrganizationInfo: () => api.get('/AddProducts/organization-info'),
};

// Product Sharing API
export const productSharingAPI = {
  shareProduct: (productId, data) => api.post(`/product-sharing/share/${productId}`, data),
  getAccessibleProducts: (params = {}) => api.get('/product-sharing/accessible-products', { params }),
  requestProduct: (data) => api.post('/product-sharing/request', data),
  approveRequest: (productId, requestId, data) => 
    api.post(`/product-sharing/approve-request/${productId}/${requestId}`, data),
  getPendingRequests: (params = {}) => api.get('/product-sharing/pending-requests', { params }),
};

// Module API
export const moduleAPI = {
  create: (data) => api.post('/modules/create', data),
  getAll: (params = {}) => api.get('/modules', { params }),
  getById: (id) => api.get(`/modules/${id}`),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`)
};

// Stock API
export const stockAPI = {
  add: (data) => api.post('/stock/add', data),
  remove: (data) => api.post('/stock/remove', data),
  transfer: (data) => api.post('/stock/transfer', data),
  getApprovals: (params) => api.get('/stock/approvals', { params }),
  handleApproval: (transactionId, data) => api.post(`/stock/approvals/${transactionId}`, data),
  getStockByLocation: (locationId) => api.get(`/stock/location/${locationId}`),
  getStockHistory: (productId, params) => api.get(`/stock/history/${productId}`, { params }),
};

// Organization API
export const organizationAPI = {
  getHierarchy: () => api.get('/organization/hierarchy'),
  getChildOrgs: () => api.get('/organization/child-orgs'),
  getLocations: () => api.get('/Location/getLocations'),
  createLocation: (data) => api.post('/organization/locations/create', data),
  getAllOrganizations: (params = {}) => api.get('/organization/list', { params }),
  getOrganizationDetails: (orgId) => api.get(`/organization/${orgId}`),
  toggleStatus: (orgId, data) => api.patch(`/organization/${orgId}/status`, data),
};

export default api;