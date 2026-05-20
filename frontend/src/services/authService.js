import api from './api';
import {API_ENDPOINTS} from '../constants/api';

const getNetworkErrorMessage = error => {
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'NETWORK_ERROR' ||
    error.message === 'Network Error'
  ) {
    return 'Cannot connect to server. Please check your internet connection.';
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  return null;
};

export const registerUser = async userData => {
  try {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return {success: true, data: response.data};
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code,
    });
    
    const networkMessage = getNetworkErrorMessage(error);
    if (networkMessage) {
      return {success: false, message: networkMessage};
    }

    // Handle validation errors
    if (error.response?.data?.errors) {
      return {
        success: false,
        message: error.response.data.errors.join(', ') || 'Validation error',
      };
    }
    
    // Handle other errors
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Registration failed',
    };
  }
};

export const verifyEmail = async (email, code) => {
  try {
    const response = await api.post(API_ENDPOINTS.VERIFY_EMAIL, {email, code});
    return {success: true, data: response.data};
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Verification failed',
    };
  }
};

export const resendOTP = async email => {
  try {
    const response = await api.post(API_ENDPOINTS.RESEND_OTP, {email});
    return {success: true, data: response.data};
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to resend code',
    };
  }
};

export const requestPasswordReset = async email => {
  try {
    const response = await api.post(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
      email: email.trim().toLowerCase(),
    });
    return {success: true, data: response.data};
  } catch (error) {
    const networkMessage = getNetworkErrorMessage(error);
    if (networkMessage) {
      return {success: false, message: networkMessage};
    }
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Failed to send reset instructions. Please try again.',
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      email: email.trim().toLowerCase(),
      password: password,
    });
    return {success: true, data: response.data};
  } catch (error) {
    const networkMessage = getNetworkErrorMessage(error);
    if (networkMessage) {
      return {success: false, message: networkMessage};
    }
    if (!error.response) {
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Login failed. Please check your credentials.',
    };
  }
};

export const verifyEmailToken = async token => {
  try {
    const response = await api.get(`${API_ENDPOINTS.VERIFY_EMAIL}?token=${token}`);
    return {success: true, data: response.data};
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Verification failed',
    };
  }
};

