// src/navigation/CustomDrawerContent.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {COLORS} from '../constants/colors';
import UserAvatar from '../components/common/UserAvatar';

const CustomDrawerContent = ({navigation}) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.fullName || userData.name || 'User');
        setUserEmail(userData.email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            navigation.reset({
              index: 0,
              routes: [{name: 'Login'}],
            });
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      label: 'Home',
      icon: '🏠',
      screen: 'Home',
    },
    {
      label: 'My Courses',
      icon: '🎓',
      screen: 'MyCourses',
    },
    {
      label: 'Payments',
      icon: '💳',
      screen: 'Payments',
    },
  ];

  return (
    <View style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <UserAvatar name={userName} size={64} />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userRole}>(student)</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  profileSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 4,
  },
  menuSection: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  menuLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginBottom: 20,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default CustomDrawerContent;











