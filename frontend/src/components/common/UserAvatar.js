// src/components/common/UserAvatar.js
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../../constants/colors';

const UserAvatar = ({name, size = 40}) => {
  const getInitials = fullName => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <View style={[styles.container, {width: size, height: size, borderRadius: size / 2}]}>
      <Text style={[styles.initials, {fontSize: size * 0.4}]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default UserAvatar;





