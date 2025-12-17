import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {COUNTRIES} from '../../constants/countries';
import {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  capitalizeWords,
} from '../../utils/validation';
import {registerUser} from '../../services/authService';
import CountryPicker from '../../components/forms/CountryPicker';
import PasswordStrength from '../../components/forms/PasswordStrength';

const RegistrationScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsappNumber: '',
    password: '',
  });

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateName(formData.fullName);
    if (nameError) newErrors.fullName = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validatePhoneNumber(
      formData.whatsappNumber,
      selectedCountry,
    );
    if (phoneError) newErrors.whatsappNumber = phoneError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Remove + from country code and combine with number
      const fullPhoneNumber =
        selectedCountry.dialCode.replace('+', '') + formData.whatsappNumber;

      const registrationData = {
        fullName: capitalizeWords(formData.fullName),
        email: formData.email.trim().toLowerCase(),
        whatsappNumber: fullPhoneNumber, // Just digits, no +
        password: formData.password,
      };

      console.log('Sending registration data:', registrationData);

      const result = await registerUser(registrationData);

      console.log('Registration result:', result);

      if (result.success) {
        navigation.navigate('EmailVerification', {
          email: registrationData.email,
          fullName: registrationData.fullName,
        });
      } else {
        const errorMessage = result.message || 'Registration failed. Please try again.';
        console.error('Registration failed:', errorMessage);
        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error) {
      console.error('Registration exception:', error);
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MedHome</Text>
          <Text style={styles.tagline}>
            Elevate your medical education with our comprehensive learning
            platform
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create a new account</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                errors.fullName && styles.inputError,
              ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight}
                value={formData.fullName}
                onChangeText={value => handleInputChange('fullName', value)}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName ? (
              <Text style={styles.errorText}>⚠️ {errors.fullName}</Text>
            ) : null}
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[styles.inputContainer, errors.email && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={COLORS.textLight}
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>⚠️ {errors.email}</Text>
            ) : null}
          </View>

          {/* WhatsApp Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp Number</Text>
            <View
              style={[
                styles.inputContainer,
                errors.whatsappNumber && styles.inputError,
              ]}>
              <CountryPicker
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
              />
              <TextInput
                style={styles.phoneInput}
                placeholder={selectedCountry.placeholder}
                placeholderTextColor={COLORS.textLight}
                value={formData.whatsappNumber}
                onChangeText={value => handleInputChange('whatsappNumber', value)}
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxDigits}
              />
            </View>
            {errors.whatsappNumber ? (
              <Text style={styles.errorText}>⚠️ {errors.whatsappNumber}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textLight}
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <PasswordStrength password={formData.password} />

            {errors.password ? (
              <Text style={styles.errorText}>⚠️ {errors.password}</Text>
            ) : null}

            <Text style={styles.passwordHint}>
              Must contain: 8+ characters, uppercase, lowercase, digit & special
              character
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegistrationScreen;

