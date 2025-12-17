import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import {COLORS} from '../../constants/colors';

const EmailVerificationScreen = ({route, navigation}) => {
  const {email, fullName} = route.params;

  const handleOpenEmail = () => {
    // Try to open default email app
    Linking.openURL('mailto:').catch(() => {
      // If fails, user can manually open their email app
    });
  };

  const handleBackToLogin = () => {
    // Navigate to login (we'll add this later)
    navigation.navigate('Registration');
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✉️</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Check Your Email</Text>

      {/* Message */}
      <Text style={styles.message}>
        Hi <Text style={styles.bold}>{fullName}</Text>!
      </Text>

      <Text style={styles.message}>
        We've sent a verification link to:
      </Text>

      <Text style={styles.email}>{email}</Text>

      <Text style={styles.message}>
        Please click the link in the email to verify your account and complete
        your registration.
      </Text>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>📝 What's next?</Text>
        <Text style={styles.instruction}>1. Open your email inbox</Text>
        <Text style={styles.instruction}>
          2. Look for an email from MedHome
        </Text>
        <Text style={styles.instruction}>
          3. Click the verification link
        </Text>
        <Text style={styles.instruction}>
          4. Come back and login to your account
        </Text>
      </View>

      {/* Open Email Button */}
      <TouchableOpacity
        style={styles.emailButton}
        onPress={handleOpenEmail}
        activeOpacity={0.8}>
        <Text style={styles.emailButtonText}>Open Email App</Text>
      </TouchableOpacity>

      {/* Note */}
      <Text style={styles.note}>
        💡 Didn't receive the email? Check your spam folder
      </Text>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
        <Text style={styles.backButtonText}>← Back to Registration</Text>
      </TouchableOpacity>
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
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginVertical: 12,
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  emailButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  emailButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: 32,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default EmailVerificationScreen;

