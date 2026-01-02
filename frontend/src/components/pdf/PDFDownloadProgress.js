// src/components/pdf/PDFDownloadProgress.js
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {COLORS} from '../../constants/colors';

const PDFDownloadProgress = ({
  progress = 0,
  downloadedBytes = 0,
  totalBytes = 0,
  speed = 0,
  timeLeft = 0,
  fileName = 'document.pdf',
  onCancel,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Listen to dimension changes (orientation changes)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
      console.log('📱 Download Progress Dimensions updated:', window.width, 'x', window.height);
    });

    return () => subscription?.remove();
  }, []);

  // Check if landscape
  const isLandscape = dimensions.width > dimensions.height;

  useEffect(() => {
    // Animated pulse for download icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isLandscape && styles.containerLandscape,
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}>
      {/* Download Icon with Pulse Animation */}
      <Animated.View
        style={[
          styles.iconContainer,
          isLandscape && styles.iconContainerLandscape,
          {
            transform: [{scale: pulseAnim}],
          },
        ]}>
        <Text style={[styles.downloadIcon, isLandscape && styles.downloadIconLandscape]}>⬇️</Text>
      </Animated.View>

      {/* Title */}
      <Text style={[styles.title, isLandscape && styles.titleLandscape]}>Downloading PDF</Text>

      {/* File Name */}
      <Text
        style={[
          styles.fileName,
          isLandscape && styles.fileNameLandscape,
          {maxWidth: dimensions.width - 48},
        ]}
        numberOfLines={2}>
        {fileName}
      </Text>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, isLandscape && styles.progressBarContainerLandscape]}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(progress, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, isLandscape && styles.progressTextLandscape]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Stats Container */}
      <View style={[styles.statsContainer, isLandscape && styles.statsContainerLandscape]}>
        {/* Size */}
        <View style={[styles.statBox, isLandscape && styles.statBoxLandscape]}>
          <Text style={styles.statLabel}>SIZE</Text>
          <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>
            {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
          </Text>
        </View>

        {/* Speed */}
        <View style={[styles.statBox, isLandscape && styles.statBoxLandscape]}>
          <Text style={styles.statLabel}>SPEED</Text>
          <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>
            {formatSpeed(speed)}
          </Text>
        </View>

        {/* Time Left */}
        <View style={[styles.statBox, isLandscape && styles.statBoxLandscape]}>
          <Text style={styles.statLabel}>TIME LEFT</Text>
          <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      {onCancel && (
        <TouchableOpacity
          style={[styles.cancelContainer, isLandscape && styles.cancelContainerLandscape]}
          onPress={onCancel}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    minHeight: '100%',
  },
  containerLandscape: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconContainerLandscape: {
    marginBottom: 12,
  },
  downloadIcon: {
    fontSize: 64,
  },
  downloadIconLandscape: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  titleLandscape: {
    fontSize: 20,
    marginBottom: 6,
  },
  fileName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  fileNameLandscape: {
    fontSize: 14,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  progressBarContainerLandscape: {
    marginBottom: 20,
    maxWidth: 600,
    alignSelf: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  progressTextLandscape: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statsContainerLandscape: {
    marginBottom: 16,
    maxWidth: 600,
    alignSelf: 'center',
    gap: 12,
  },
  statBox: {
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statBoxLandscape: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 90,
    flex: 0,
    marginHorizontal: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  statValueLandscape: {
    fontSize: 12,
  },
  cancelContainer: {
    marginTop: 16,
  },
  cancelContainerLandscape: {
    marginTop: 12,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default PDFDownloadProgress;



