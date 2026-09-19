import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Products
export const getAllProducts = () => API.get('/products');
export const getMyProducts = (token) => API.get('/products/my', { headers: { authorization: token } });
export const addProduct = (data, token) => API.post('/products', data, { headers: { authorization: token } });
export const deleteProduct = (id, token) => API.delete(`/products/${id}`, { headers: { authorization: token } });
export const updateProduct = (id, data, token) => API.put(`/products/${id}`, data, { headers: { authorization: token } });
export const getPendingProducts = (token) => API.get('/products/pending', { headers: { authorization: token } });
export const updateProductStatus = (id, status, token) => API.put(`/products/${id}/status`, { status }, { headers: { authorization: token } });

// Orders
export const placeOrder = (data, token) => API.post('/orders', data, { headers: { authorization: token } });
export const getMyOrders = (token) => API.get('/orders/my', { headers: { authorization: token } });
export const getFarmerOrders = (token) => API.get('/orders/farmer', { headers: { authorization: token } });
export const getAllOrders = (token) => API.get('/orders/all', { headers: { authorization: token } });
export const updateOrderStatus = (id, status, token) => API.put(`/orders/${id}`, { status }, { headers: { authorization: token } });

// Payment
export const generateHash = (data, token) => API.post('/payment/hash', data, { headers: { authorization: token } });
export const generateOTP = (token) =>
  API.post(
    '/payment/generate-otp',
    {},
    {
      headers: { authorization: token }
    }
  );

export const verifyOTP = (otp, token) =>
  API.post(
    '/payment/verify-otp',
    { otp },
    {
      headers: { authorization: token }
    }
  );
// Auth extras
export const changePassword = (data, token) => API.post('/auth/change-password', data, { headers: { authorization: token } });
export const updateProfile = (data, token) => API.put('/auth/update-profile', data, { headers: { authorization: token } });
export const requestForgotPasswordOTP = (email) => API.post('/auth/forgot-password/request', { email });
export const verifyForgotPasswordOTP = (email, otp) => API.post('/auth/forgot-password/verify', { email, otp });

export const hideProductBatch = (productId, batchId, data, token) => API.put(`/products/${productId}/batches/${batchId}/hide`, data, { headers: { authorization: token } });
export const unhideProductBatch = (productId, batchId, token) => API.put(`/products/${productId}/batches/${batchId}/unhide`, {}, { headers: { authorization: token } });