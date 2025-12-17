// src/components/course/CourseCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../constants/colors';

const CourseCard = ({ course, onPress, onEnroll, showEnrollButton = true }) => {
  return (
    <View style={styles.card}>
      {/* Course Thumbnail */}
      <Image
        source={{ uri: course.thumbnail || course.image }}
        style={styles.thumbnail}
      />

      {/* Course Info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>

        {/* Course Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {course.duration || '8 weeks'}
          </Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>
            {course.credits || '15 CME'}
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>${course.price || '0.00'}</Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={onPress}
            activeOpacity={0.8}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>

          {showEnrollButton && (
            <>
              {course.enrolled || course.isEnrolled ? (
                <View style={styles.enrolledButton}>
                  <Text style={styles.enrolledButtonText}>Enrolled</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={() => onEnroll(course)}
                  activeOpacity={0.8}>
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.borderLight,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaDivider: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enrollButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  enrolledButton: {
    flex: 1,
    backgroundColor: COLORS.success + '20',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  enrolledButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
});

export default CourseCard;

