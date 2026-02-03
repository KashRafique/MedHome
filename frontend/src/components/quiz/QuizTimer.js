import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const QuizTimer = ({ timeRemaining, onTimeExpired }) => {
  if (timeRemaining === null || timeRemaining === undefined) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const isWarning = timeRemaining < 300; // Less than 5 minutes
  const isCritical = timeRemaining < 60; // Less than 1 minute

  return (
    <View style={[styles.container, isWarning && styles.warning, isCritical && styles.critical]}>
      <Text style={[styles.icon, isWarning && styles.warningText, isCritical && styles.criticalText]}>
        ⏱️
      </Text>
      <Text style={[styles.time, isWarning && styles.warningText, isCritical && styles.criticalText]}>
        {formattedTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  warning: {
    backgroundColor: COLORS.warning + '15',
    borderColor: COLORS.warning,
  },
  critical: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  warningText: {
    color: COLORS.warning,
  },
  criticalText: {
    color: COLORS.error,
  },
});

export default QuizTimer;
