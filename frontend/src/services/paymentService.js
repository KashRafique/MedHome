// src/services/paymentService.js
import api from './api';

/**
 * Get payment history for current user
 * Backend endpoint: GET /api/payments/
 */
export const getPaymentHistory = async () => {
  try {
    const response = await api.get('/api/payments/');
    return {success: true, data: response.data};
  } catch (error) {
    console.error('Get payment history error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch payment history',
      data: [],
    };
  }
};











