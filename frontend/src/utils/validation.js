export const validateName = (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) return 'Full name is required';
  if (trimmedName.length < 3) return 'Name must be at least 3 characters';
  if (!/^[A-Za-z\s]+$/.test(trimmedName)) return 'Name should only contain letters';
  return '';
};

export const validateEmail = (email) => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Please enter a valid email address';
  }
  return '';
};

export const validatePhoneNumber = (phone, country) => {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!cleanPhone) return 'WhatsApp number is required';
  if (!country) return 'Please select a country';
  if (cleanPhone.length < country.minDigits) {
    return `Phone number must be at least ${country.minDigits} digits`;
  }
  if (cleanPhone.length > country.maxDigits) {
    return `Phone number must be at most ${country.maxDigits} digits`;
  }
  if (country.code === 'PK' && !cleanPhone.startsWith('3')) {
    return 'Pakistani numbers must start with 3';
  }
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain at least one digit';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Must contain at least one special character';
  }
  return '';
};

export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: '#E5E7EB' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  if (score <= 2) return { strength: 33, label: 'Weak', color: '#EF4444' };
  if (score <= 4) return { strength: 66, label: 'Medium', color: '#F59E0B' };
  return { strength: 100, label: 'Strong', color: '#10B981' };
};

export const capitalizeWords = (str) => {
  return str.trim().split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const validateOTP = (otp) => {
  if (!otp) return 'Verification code is required';
  if (otp.length !== 6) return 'Code must be 6 digits';
  if (!/^\d+$/.test(otp)) return 'Code must contain only numbers';
  return '';
};

