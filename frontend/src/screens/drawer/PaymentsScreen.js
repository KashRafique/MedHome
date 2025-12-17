// src/screens/drawer/PaymentsScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {getPaymentHistory} from '../../services/paymentService';

const PaymentsScreen = ({navigation}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await getPaymentHistory();
      const paymentsData = result.data || result || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'rejected':
      case 'failed':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'rejected':
      case 'failed':
        return '✕';
      default:
        return '•';
    }
  };

  const renderPaymentItem = ({item}) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentDate}>
            {new Date(item.createdAt || item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '20'}]}>
            <Text style={[styles.statusText, {color: statusColor}]}>
              {statusIcon} {item.status || 'pending'}
            </Text>
          </View>
        </View>

        <Text style={styles.courseName} numberOfLines={2}>
          {item.courseName || item.course?.title || 'Course'}
        </Text>

        <View style={styles.paymentFooter}>
          <View>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <Text style={styles.amountValue}>${item.amount}</Text>
          </View>

          <View>
            <Text style={styles.methodLabel}>METHOD</Text>
            <Text style={styles.methodValue}>
              {item.paymentMethod === 'manual' ? 'Manual' : 'Card'}
            </Text>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>👁️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💳</Text>
      <Text style={styles.emptyText}>No payment history</Text>
      <Text style={styles.emptySubtext}>
        Your payment transactions will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.title}>My Payments</Text>
        <View style={{width: 40}} />
      </View>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{payments.length} payment(s)</Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item._id || item.id}
          renderItem={renderPaymentItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchPayments}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: COLORS.textPrimary,
    marginBottom: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  summary: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
    lineHeight: 20,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  methodLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PaymentsScreen;





