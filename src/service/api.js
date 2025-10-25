// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://codeaves.avessecurity.com/api';

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

// Response interceptor to handle errors (optional but recommended)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      // Redirect to login page or refresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const notificationAPI = {
  getNotifications: (params = {}) => 
    api.get('/notifications', { params }),
  
  markAsRead: (notificationId) => 
    api.post(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    api.post('/notifications/read-all'),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count')
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
  getByLocation: (locationId, params = {}) => 
    api.get(`/stock/location/${locationId}`, { params })
};

// Organization API
export const organizationAPI = {
  getHierarchy: () => api.get('/organization/hierarchy'),
  getChildOrgs: () => api.get('/organization/child-orgs'),
  getLocations: () => api.get('/organization/locations'),
  createLocation: (data) => api.post('/organization/locations/create', data)
};

export default api;