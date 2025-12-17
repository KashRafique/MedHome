import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {getPasswordStrength} from '../../utils/validation';
import {COLORS} from '../../constants/colors';

const PasswordStrength = ({password}) => {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.bar,
            {
              width: `${strength.strength}%`,
              backgroundColor: strength.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, {color: strength.color}]}>
        {strength.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  barBackground: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
  },
});

export default PasswordStrength;

