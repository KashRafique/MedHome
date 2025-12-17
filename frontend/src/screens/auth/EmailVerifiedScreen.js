// src/screens/auth/EmailVerifiedScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {verifyEmailToken} from '../../services/authService';

const EmailVerifiedScreen = ({route, navigation}) => {
  const {token} = route.params;
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    console.log('🔐 Verifying email token:', token);

    const result = await verifyEmailToken(token);

    setLoading(false);

    if (result.success) {
      console.log('✅ Email verified successfully');
      setSuccess(true);
      setMessage('Your email has been verified successfully!');
    } else {
      console.log('❌ Verification failed:', result.message);
      setSuccess(false);
      setMessage(result.message || 'Verification failed. Please try again.');
    }
  };

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Verifying...</Text>
        <Text style={styles.message}>
          Please wait while we verify your email address
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Success/Error Icon */}
      <View
        style={[
          styles.iconContainer,
          success
            ? styles.iconContainerSuccess
            : styles.iconContainerError,
        ]}>
        <Text style={styles.icon}>{success ? '✓' : '✕'}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {success ? 'Email Verified!' : 'Verification Failed'}
      </Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Success content */}
      {success && (
        <View style={styles.successContent}>
          <Text style={styles.successText}>
            🎉 Your account is now active!
          </Text>
          <Text style={styles.successSubtext}>
            You can now login and start learning
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.button,
          success ? styles.buttonSuccess : styles.buttonError,
        ]}
        onPress={handleGoToLogin}
        activeOpacity={0.8}>
        <Text style={styles.buttonText}>
          {success ? 'Go to Login' : 'Back to Login'}
        </Text>
      </TouchableOpacity>

      {/* Retry option for failures */}
      {!success && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={verifyToken}
          activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainerSuccess: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 3,
    borderColor: COLORS.success,
  },
  iconContainerError: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 3,
    borderColor: COLORS.error,
  },
  icon: {
    fontSize: 50,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  successContent: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSuccess: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  buttonError: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmailVerifiedScreen;










