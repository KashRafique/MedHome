// src/components/course/PaymentModal.js
import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {COLORS} from '../../constants/colors';
import {enrollInCourse} from '../../services/enrollmentService';

const PaymentModal = ({visible, onClose, course, onSuccess}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const finalPrice = course?.price || 0;

  const handleSelectReceipt = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setPaymentReceipt({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `receipt_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleRemoveReceipt = () => {
    setPaymentReceipt(null);
  };

  const handleSubmitPayment = async () => {
    if (!paymentReceipt) {
      Alert.alert('Required', 'Please upload payment receipt');
      return;
    }

    setLoading(true);
    try {
      await enrollInCourse(course._id || course.id, paymentReceipt, voucherCode);

      Alert.alert(
        'Enrollment Submitted!',
        'Your payment is under review. You will be able to access course content once admin approves your payment.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ],
      );
    } catch (error) {
      console.error('Enrollment error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit enrollment',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enrollment Form</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Course Info */}
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.priceLabel}>
              Price: <Text style={styles.priceValue}>${course.price}</Text>
            </Text>

            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>📌 Payment Instructions</Text>
              <Text style={styles.instructionsText}>
                1. Complete payment through bank transfer{'\n'}
                2. Upload your payment receipt below{'\n'}
                3. Wait for admin approval{'\n'}
                4. Access course after approval
              </Text>
            </View>

            {/* Voucher Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Have a Voucher Code? (Optional)</Text>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
              />
            </View>

            {/* Receipt Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Payment Receipt <Text style={styles.required}>*</Text>
              </Text>
              {!paymentReceipt ? (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleSelectReceipt}>
                  <Text style={styles.uploadIcon}>📤</Text>
                  <Text style={styles.uploadText}>Upload Receipt</Text>
                  <Text style={styles.uploadSubtext}>
                    JPG, PNG (Max 5MB)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.receiptPreview}>
                  <Image
                    source={{uri: paymentReceipt.uri}}
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveReceipt}>
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptName} numberOfLines={1}>
                      {paymentReceipt.name}
                    </Text>
                    <TouchableOpacity onPress={handleSelectReceipt}>
                      <Text style={styles.changeText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>${finalPrice}</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (loading || !paymentReceipt) && styles.continueButtonDisabled,
            ]}
            onPress={handleSubmitPayment}
            disabled={loading || !paymentReceipt}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.continueButtonText}>
                Submit for Approval
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  required: {
    color: COLORS.error || '#EF4444',
  },
  instructionsBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  voucherInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  receiptPreview: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
  },
  removeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.error || '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  receiptName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  changeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentModal;



