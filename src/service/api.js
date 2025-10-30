// // import axios from 'axios';

// // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3393/api';

// // const api = axios.create({
// //   baseURL: API_BASE_URL,
// //   timeout: 30000,
// // });

// // // Request interceptor to add token to headers
// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem('access_token');
// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }
// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // // Response interceptor to handle errors
// // api.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       localStorage.removeItem('access_token');
// //       window.location.href = '/login';
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// // // Product API (Updated to match your exact backend routes)
// // export const productAPI = {
// //   // Product Creation & Management
// //   create: (data) => api.post('/AddProducts/create', data),
// //   getAll: (params = {}) => api.get('/AddProducts', { params }),
// //   getById: (id) => api.get(`/AddProducts/${id}`),
// //   update: (id, data) => api.put(`/AddProducts/${id}`, data),
// //   delete: (id) => api.delete(`/AddProducts/${id}`),
  
// //   // Product Assignment
// //   assign: (productId, data) => api.post(`/AddProducts/${productId}/assign`, data),
  
// //   // Authorization Requests
// //   getAuthorizationRequests: (params = {}) => 
// //     api.get('/AddProducts/authorization-requests', { params }),
// //   handleAuthorization: (requestId, data) => 
// //     api.post(`/AddProducts/authorization/${requestId}/handle`, data),
  
// //   // Cross-Organization Requests
// //   requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
// //   approveProductRequest: (productId, requestId, data) => 
// //     api.post(`/AddProducts/${productId}/requests/${requestId}/approve`, data),
  
// //   // Organization Hierarchy
// //   getOrganizationHierarchy: () => api.get('/AddProducts/hierarchy'),
  
// //   // Auto-suggestions & Field Values
// //   getSuggestions: (field, query) => 
// //     api.get(`/AddProducts/suggestions?field=${field}&query=${query}`),
// //   getFieldValues: (field) => 
// //     api.get(`/AddProducts/field-values/${field}`),
  
// //   // Hierarchy Products
// //   getAllHierarchyProducts: (params = {}) => 
// //     api.get('/AddProducts/hierarchy/all', { params }),
// // };

// // // Stock API (Updated to match your exact backend routes)
// // export const stockAPI = {
// //   add: (data) => api.post('/AddProducts/stock/add', data),
// //   remove: (data) => api.post('/AddProducts/stock/remove', data),
// //   transfer: (data) => api.post('/AddProducts/stock/transfer', data),
// //   transferToOtherOrganization: (data) => api.post('/AddProducts/stock/transfer-to-org', data),
  
// //   // Stock Approvals (using same endpoints as product authorization)
// //   getApprovals: () => api.get('/AddProducts/authorization-requests'),
// //   handleApproval: (requestId, data) => 
// //     api.post(`/AddProducts/authorization/${requestId}/handle`, data),
// // };

// // // Organization API
// // export const organizationAPI = {
// //   getHierarchy: () => api.get('/oraganisation/hierarchy'),
// //   getChildOrgs: () => api.get('/organization/child-orgs'),
// //   getLocations: () => api.get('/Location/getLocations'),
// //   createLocation: (data) => api.post('/organization/locations/create', data),
// // };

// // // Module API
// // export const moduleAPI = {
// //   create: (data) => api.post('/modules/create', data),
// //   getAll: (params = {}) => api.get('/modules', { params }),
// //   getById: (id) => api.get(`/modules/${id}`),
// //   update: (id, data) => api.put(`/modules/${id}`, data),
// //   delete: (id) => api.delete(`/modules/${id}`),
  
// //   // Get available modules for product assignment
// //   getAvailableModules: () => api.get('/modules/available'),
// // };

// // // Product Sharing API (For cross-organization requests)
// // export const productSharingAPI = {
// //   // Using the hierarchy endpoint to get accessible products
// //   getAccessibleProducts: () => api.get('/AddProducts/hierarchy/all'),
  
// //   // Request product from other organizations
// //   requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
  
// //   // Get shared products
// //   getSharedProducts: (params = {}) => api.get('/AddProducts/hierarchy/all', { params }),
// // };

// // // Notification API
// // export const notificationAPI = {
// //   getNotifications: (params = {}) => api.get('/notifications', { params }),
// //   markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
// //   markAllAsRead: () => api.post('/notifications/read-all'),
// //   getUnreadCount: () => api.get('/notifications/unread-count'),
// // };

// // export default api;

// // import axios from 'axios';

// // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3393/api';

// // const api = axios.create({
// //   baseURL: API_BASE_URL,
// //   timeout: 30000,
// // });

// // // Request interceptor to add token to headers
// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem('access_token');
// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }
// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // // Response interceptor to handle errors
// // api.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       localStorage.removeItem('access_token');
// //       window.location.href = '/login';
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// // // Product API
// // export const productAPI = {
// //   // Product Creation & Management
// //   create: (data) => api.post('/AddProducts/create', data),
// //   getAll: (params = {}) => api.get('/AddProducts', { params }),
// //   getById: (id) => api.get(`/AddProducts/${id}`),
// //   update: (id, data) => api.put(`/AddProducts/${id}`, data),
// //   delete: (id) => api.delete(`/AddProducts/${id}`),
  
// //   // Product Assignment
// //   assign: (productId, data) => api.post(`/AddProducts/${productId}/assign`, data),
  
// //   // Authorization Requests
// //   getAuthorizationRequests: (params = {}) => 
// //     api.get('/AddProducts/authorization-requests', { params }),
// //   handleAuthorization: (requestId, data) => 
// //     api.post(`/AddProducts/authorization/${requestId}/handle`, data),
  
// //   // Cross-Organization Requests - FIXED: Send sourceOrg directly
// //   requestProduct: (data) => api.post('/AddProducts/request-from-any', data), // Send data as-is
// //   approveProductRequest: (productId, requestId, data) => 
// //     api.post(`/AddProducts/${productId}/requests/${requestId}/approve`, data),
  
// //   // Organization Hierarchy
// //   getOrganizationHierarchy: () => api.get('/AddProducts/hierarchy'),
  
// //   // Auto-suggestions & Field Values
// //   getSuggestions: (field, query) => 
// //     api.get(`/AddProducts/suggestions?field=${field}&query=${query}`),
// //   getFieldValues: (field) => 
// //     api.get(`/AddProducts/field-values/${field}`),
  
// //   // Hierarchy Products
// //   getAllHierarchyProducts: (params = {}) => 
// //     api.get('/AddProducts/hierarchy/all', { params }),
// // };

// // // Stock API
// // export const stockAPI = {
// //   add: (data) => api.post('/AddProducts/stock/add', data),
// //   remove: (data) => api.post('/AddProducts/stock/remove', data),
// //   transfer: (data) => api.post('/AddProducts/stock/transfer', data),
// //   transferToOtherOrganization: (data) => api.post('/AddProducts/stock/transfer-to-org', data),
  
// //   getApprovals: () => api.get('/AddProducts/authorization-requests'),
// //   handleApproval: (requestId, data) => 
// //     api.post(`/AddProducts/authorization/${requestId}/handle`, data),

// //     getStockByLocation: (locationId) => api.get(`/AddProducts/stock/location/${locationId}`),
// //   getLocationsSummary: () => api.get('/AddProducts/stock/locations/summary'),
// //   getProductStockSummary: (productId) => api.get(`/AddProducts/stock/product/${productId}/summary`),
  
// //   // History and reports
// //   getStockHistory: (params = {}) => api.get('/AddProducts/stock/history', { params }),
// //   getLowStockAlerts: () => api.get('/AddProducts/stock/alerts/low-stock'),
  
// //   // Approvals
// //   getApprovals: () => api.get('/AddProducts/stock/approvals'),
// //   handleApproval: (requestId, data) => api.post(`/stock/approvals/${requestId}/handle`, data),
// // };

// // // Organization API
// // export const organizationAPI = {
// //   getHierarchy: () => api.get('/oraganisation/hierarchy'),
// //   getChildOrgs: () => api.get('/organization/child-orgs'),
// //   getLocations: () => api.get('/Location/getLocations'),
// //   createLocation: (data) => api.post('/organization/locations/create', data),
// // };

// // // Module API
// // export const moduleAPI = {
// //   create: (data) => api.post('/modules/create', data),
// //   getAll: (params = {}) => api.get('/modules', { params }),
// //   getById: (id) => api.get(`/modules/${id}`),
// //   update: (id, data) => api.put(`/modules/${id}`, data),
// //   delete: (id) => api.delete(`/modules/${id}`),
// //   getAvailableModules: () => api.get('/modules/available'),
// // };

// // // Product Sharing API - FIXED: Send data directly without transformation
// // export const productSharingAPI = {
// //   getAccessibleProducts: () => api.get('/AddProducts/hierarchy/all'),
  
// //   // FIXED: Send the exact payload that frontend creates
// //   requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
  
// //   getSharedProducts: (params = {}) => api.get('/AddProducts/hierarchy/all', { params }),
// // };

// // // Notification API
// // export const notificationAPI = {
// //   getNotifications: (params = {}) => api.get('/notifications', { params }),
// //   markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
// //   markAllAsRead: () => api.post('/notifications/read-all'),
// //   getUnreadCount: () => api.get('/notifications/unread-count'),
// //     requestProductFromAnyOrganization: (data) => 
// //     api.post('/AddProducts/request-from-any', data),
// //     getProductRequests: (params = {}) => 
// //     api.get('/AddProducts/requests', { params }),
// //       getParentProductRequests: (params) => api.get('/AddProducts/parent/requests', { params }),
  
// //   respondToRequest: (requestId, data) => 
// //     api.post(`/AddProducts/requests/${requestId}/respond`, data),
  
// //   debugNotifications: () => 
// //     api.get('/AddProducts/debug/notifications'),

// // };

// // export default api;


// import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3393/api';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000,
// });

// // Request interceptor to add token to headers
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('access_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('access_token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// // Product API
// export const productAPI = {
//   // Product Creation & Management
//   create: (data) => api.post('/AddProducts/create', data),
//   getAll: (params = {}) => api.get('/AddProducts', { params }),
//   getById: (id) => api.get(`/AddProducts/${id}`),
//   update: (id, data) => api.put(`/AddProducts/${id}`, data),
//   delete: (id) => api.delete(`/AddProducts/${id}`),
  
//   // Product Assignment
//   assign: (productId, data) => api.post(`/AddProducts/${productId}/assign`, data),
  
//   // Authorization Requests
//   getAuthorizationRequests: (params = {}) => 
//     api.get('/AddProducts/authorization-requests', { params }),
//   handleAuthorization: (requestId, data) => 
//     api.post(`/AddProducts/authorization/${requestId}/handle`, data),
  
//   // Cross-Organization Requests
//   requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
//   approveProductRequest: (productId, requestId, data) => 
//     api.post(`/AddProducts/${productId}/requests/${requestId}/approve`, data),
  
//   // Organization Hierarchy
//   getOrganizationHierarchy: () => api.get('/AddProducts/hierarchy'),
  
//   // Auto-suggestions & Field Values
//   getSuggestions: (field, query) => 
//     api.get(`/AddProducts/suggestions?field=${field}&query=${query}`),
//   getFieldValues: (field) => 
//     api.get(`/AddProducts/field-values/${field}`),
  
//   // Hierarchy Products
//   getAllHierarchyProducts: (params = {}) => 
//     api.get('/AddProducts/hierarchy/all', { params }),

//   // NEW: Location-wise and Organization-wise stock APIs
//   getLocationWiseStock: (params = {}) => 
//     api.get('/AddProducts/stock/location-wise', { params }),
//   getOrganizationWiseStock: (productId, params = {}) => 
//     api.get(`/AddProducts/${productId}/stock/organizations`, { params }),
//   getStockDashboard: (params = {}) => 
//     api.get('/AddProducts/stock/dashboard', { params }),
//   getProductStockByLocation: (productId, params = {}) => 
//     api.get(`/AddProducts/${productId}/stock/locations`, { params }),
// };

// // Stock API
// export const stockAPI = {
//   add: (data) => api.post('/AddProducts/stock/add', data),
//   remove: (data) => api.post('/AddProducts/stock/remove', data),
//   transfer: (data) => api.post('/AddProducts/stock/transfer', data),
//   transferToOtherOrganization: (data) => api.post('/AddProducts/stock/transfer-to-org', data),
//    getPendingApprovals: (params = {}) => 
//     api.get('/AddProducts/stock/pending-approvals', { params }),
  
//   // Handle Approval/Rejection of Transfer Requests
//   handleApproval: (transactionId, data) => 
//     api.post(`/AddProducts/stock/approve-transfer`, { transactionId, ...data }),
  
//   // Alternative endpoint if above doesn't work
//   approveTransfer: (data) => 
//     api.post('/AddProducts/stock/approve-transfer', data),


  
//   getApprovals: () => api.get('/AddProducts/authorization-requests'),
//   handleApproval: (requestId, data) => 
//     api.post(`/AddProducts/authorization/${requestId}/handle`, data),

//   getStockByLocation: (locationId) => api.get(`/AddProducts/stock/location/${locationId}`),
//   getLocationsSummary: () => api.get('/AddProducts/stock/locations/summary'),
//   getProductStockSummary: (productId) => api.get(`/AddProducts/stock/product/${productId}/summary`),
  
//   // History and reports
//   getStockHistory: (params = {}) => api.get('/AddProducts/stock/history', { params }),
//   getLowStockAlerts: () => api.get('/AddProducts/stock/alerts/low-stock'),
  
//   // Approvals
//   getStockApprovals: () => api.get('/AddProducts/stock/approvals'),
//   handleStockApproval: (requestId, data) => api.post(`/stock/approvals/${requestId}/handle`, data),
// };

// // Organization API
// export const organizationAPI = {
//   getHierarchy: () => api.get('/oraganisation/hierarchy'),
//   getChildOrgs: () => api.get('/organization/child-orgs'),
//   getLocations: () => api.get('/Location/getLocations'),
//   createLocation: (data) => api.post('/organization/locations/create', data),
//   getOrg:()=> api.get('/oraganisation/OrgDropDown'),
// };

// // Module API
// export const moduleAPI = {
//   create: (data) => api.post('/modules/create', data),
//   getAll: (params = {}) => api.get('/modules', { params }),
//   getById: (id) => api.get(`/modules/${id}`),
//   update: (id, data) => api.put(`/modules/${id}`, data),
//   delete: (id) => api.delete(`/modules/${id}`),
//   getAvailableModules: () => api.get('/modules/available'),
// };

// // Product Sharing API
// export const productSharingAPI = {
//   getAccessibleProducts: () => api.get('/AddProducts/hierarchy/all'),
//   requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
//   getSharedProducts: (params = {}) => api.get('/AddProducts/hierarchy/all', { params }),
// };

// // Notification API
// export const notificationAPI = {
//   getNotifications: (params = {}) => api.get('/notifications', { params }),
//   markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
//   markAllAsRead: () => api.post('/notifications/read-all'),
//   getUnreadCount: () => api.get('/notifications/unread-count'),
//   requestProductFromAnyOrganization: (data) => 
//     api.post('/AddProducts/request-from-any', data),
//   getProductRequests: (params = {}) => 
//     api.get('/AddProducts/requests', { params }),
//   getParentProductRequests: (params) => api.get('/AddProducts/parent/requests', { params }),
//   respondToRequest: (requestId, data) => 
//     api.post(`/AddProducts/requests/${requestId}/respond`, data),
//   debugNotifications: () => 
//     api.get('/AddProducts/debug/notifications'),
// };

// export default api;




// src/service/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://codeaves.avessecurity.com/api';

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

// Product API
export const productAPI = {
  // Product Creation & Management
  create: (data) => api.post('/AddProducts/create', data),
  getAll: (params = {}) => api.get('/AddProducts', { params }),
  getById: (id) => api.get(`/AddProducts/${id}`),
  update: (id, data) => api.put(`/AddProducts/${id}`, data),
  delete: (id) => api.delete(`/AddProducts/${id}`),
  
  // Product Assignment
  assign: (productId, data) => api.post(`/AddProducts/${productId}/assign`, data),
  
  // Authorization Requests
  getAuthorizationRequests: (params = {}) => 
    api.get('/AddProducts/authorization-requests', { params }),
  handleAuthorization: (requestId, data) => 
    api.post(`/AddProducts/authorization/${requestId}/handle`, data),
  
  // Cross-Organization Requests
  requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
  approveProductRequest: (productId, requestId, data) => 
    api.post(`/AddProducts/${productId}/requests/${requestId}/approve`, data),
  
  // Organization Hierarchy
  getOrganizationHierarchy: () => api.get('/AddProducts/hierarchy'),
  
  // Auto-suggestions & Field Values
  getSuggestions: (field, query) => 
    api.get(`/AddProducts/suggestions?field=${field}&query=${query}`),
  getFieldValues: (field) => 
    api.get(`/AddProducts/field-values/${field}`),
  
  // Hierarchy Products
  getAllHierarchyProducts: (params = {}) => 
    api.get('/AddProducts/hierarchy/all', { params }),

  // Location-wise and Organization-wise stock APIs
  getLocationWiseStock: (params = {}) => 
    api.get('/AddProducts/stock/location-wise', { params }),
  getOrganizationWiseStock: (productId, params = {}) => 
    api.get(`/AddProducts/${productId}/stock/organizations`, { params }),
  getStockDashboard: (params = {}) => 
    api.get('/AddProducts/stock/dashboard', { params }),
  getProductStockByLocation: (productId, params = {}) => 
    api.get(`/AddProducts/${productId}/stock/locations`, { params }),
};

// Stock API - CORRECTED ENDPOINTS
export const stockAPI = {
  // Basic Stock Operations
  add: (data) => api.post('/AddProducts/stock/add', data),
  remove: (data) => api.post('/AddProducts/stock/remove', data),
  transfer: (data) => api.post('/AddProducts/stock/transfer', data),
  
  // Cross-Organization Transfer
  transferToOtherOrganization: (data) => api.post('/AddProducts/stock/transfer-to-org', data),
  
  // Pending Approvals for Cross-Organization Transfers - CORRECT ENDPOINT
  getPendingApprovals: (params = {}) => 
    api.get('/AddProducts/stock/pending-approvals', { params }),
  
  // Handle Approval/Rejection of Transfer Requests
  handleApproval: (data) => 
    api.post('/AddProducts/stock/approve-transfer', data),
  
  // Stock Summary and Reports
  getStockByLocation: (locationId) => api.get(`/AddProducts/stock/location/${locationId}`),
  getLocationsSummary: () => api.get('/AddProducts/stock/locations/summary'),
  getProductStockSummary: (productId) => api.get(`/AddProducts/stock/product/${productId}/summary`),
  
  // History and reports
  getStockHistory: (params = {}) => api.get('/AddProducts/stock/history', { params }),
  getLowStockAlerts: () => api.get('/AddProducts/stock/alerts/low-stock'),
  
  // Legacy endpoints (remove these duplicates)
  // getApprovals: () => api.get('/AddProducts/authorization-requests'),
  // handleStockApproval: (requestId, data) => api.post(`/stock/approvals/${requestId}/handle`, data),
};

// Organization API
export const organizationAPI = {
  getHierarchy: () => api.get('/oraganisation/hierarchy'),
  getChildOrgs: () => api.get('/organization/child-orgs'),
  getLocations: () => api.get('/Location/getLocations'),
  createLocation: (data) => api.post('/organization/locations/create', data),
  getOrg: () => api.get('/oraganisation/OrgDropDown'),
  getOrganizationDetails: (orgId) => api.get(`/oraganisation/${orgId}`),
};

// Module API
export const moduleAPI = {
  create: (data) => api.post('/modules/create', data),
  getAll: (params = {}) => api.get('/modules', { params }),
  getById: (id) => api.get(`/modules/${id}`),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
  getAvailableModules: () => api.get('/modules/available'),
};

// Product Sharing API
export const productSharingAPI = {
  getAccessibleProducts: () => api.get('/AddProducts/hierarchy/all'),
  requestProduct: (data) => api.post('/AddProducts/request-from-any', data),
  getSharedProducts: (params = {}) => api.get('/AddProducts/hierarchy/all', { params }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  requestProductFromAnyOrganization: (data) => 
    api.post('/AddProducts/request-from-any', data),
  getProductRequests: (params = {}) => 
    api.get('/AddProducts/requests', { params }),
  getParentProductRequests: (params) => api.get('/AddProducts/parent/requests', { params }),
  respondToRequest: (requestId, data) => 
    api.post(`/AddProducts/requests/${requestId}/respond`, data),
  debugNotifications: () => 
    api.get('/AddProducts/debug/notifications'),
};

export default api;