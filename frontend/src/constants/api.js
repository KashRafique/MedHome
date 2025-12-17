import {BASE_URL} from '../config/env';

// API endpoints configuration
// BASE_URL is set based on build environment (dev/prod)
export {BASE_URL};

export const API_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_OTP: '/api/auth/resend-otp',
  LOGIN: '/api/auth/login',
};

