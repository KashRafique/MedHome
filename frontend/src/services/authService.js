import api from './api';
import {API_ENDPOINTS} from '../constants/api';

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
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        message: 'Cannot connect to server. Please check your internet connection.',
      };
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        success: false,
        message: 'Request timed out. Please try again.',
      };
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

export const loginUser = async (email, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      email: email.trim().toLowerCase(),
      password: password,
    });
    return {success: true, data: response.data};
  } catch (error) {
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

export const requestPasswordReset = async email => {
  try {
    const response = await api.post(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
      email: email.trim().toLowerCase(),
    });
    return {success: true, data: response.data};
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Failed to request password reset. Please try again.',
    };
  }
};export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.RESET_PASSWORD}/${token}`,
      {
        password: newPassword,
      },
    );
    return {success: true, data: response.data};
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Failed to reset password. The link may be invalid or expired.',
    };
  }
};