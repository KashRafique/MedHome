// src/screens/main/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import CourseCard from '../../components/course/CourseCard';
import PaymentModal from '../../components/course/PaymentModal';
import UserAvatar from '../../components/common/UserAvatar';
import { getActiveCourses } from '../../services/courseService';

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchCourses();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.fullName || userData.name || 'User');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getActiveCourses();
      const coursesData = result.data || result;
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCoursePress = course => {
    navigation.navigate('CourseDetail', { course });
  };

  const handleEnroll = course => {
    setSelectedCourse(course);
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    fetchCourses(); // Refresh courses list
  };

  const renderHeader = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeText}>Welcome back,</Text>
      <Text style={styles.userNameText}>{userName}!</Text>
      <Text style={styles.subtitleText}>
        Explore our courses and continue your medical education journey
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyText}>No courses available</Text>
      <Text style={styles.emptySubtext}>Check back later for new courses</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <Text style={styles.logo}>MedHome</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <UserAvatar name={userName} size={40} />
        </TouchableOpacity>
      </View>

      {/* Courses List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => item._id || item.id}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => handleCoursePress(item)}
              onEnroll={handleEnroll}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchCourses(true)}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        course={selectedCourse}
        onSuccess={handlePaymentSuccess}
      />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: COLORS.textPrimary,
    marginBottom: 4,
    borderRadius: 2,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
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
  },
});

export default HomeScreen;









