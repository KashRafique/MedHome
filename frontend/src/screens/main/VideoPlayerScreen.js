// src/screens/main/VideoPlayerScreen.js
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import {COLORS} from '../../constants/colors';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const VideoPlayerScreen = ({route, navigation}) => {
  const {lesson, courseTitle} = route.params;
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const handleLoad = data => {
    setLoading(false);
    setDuration(data.duration);
  };

  const handleProgress = data => {
    setCurrentTime(data.currentTime);
  };

  const handleError = error => {
    setLoading(false);
    setError('Failed to load video');
    console.error('Video error:', error);
    Alert.alert('Error', 'Failed to load video. Please try again later.');
  };

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = seekTime => {
    if (videoRef.current) {
      videoRef.current.seek(seekTime);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Video
          ref={videoRef}
          source={{uri: lesson.url}}
          style={styles.video}
          paused={paused}
          resizeMode="contain"
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={handleError}
          controls={true}
          playInBackground={false}
          playWhenInactive={false}
        />

        {/* Custom Controls Overlay */}
        {!loading && !error && (
          <TouchableOpacity
            style={styles.overlay}
            onPress={togglePlayPause}
            activeOpacity={1}>
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}>
                <Text style={styles.playIcon}>{paused ? '▶' : '⏸'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.black,
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: COLORS.white,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default VideoPlayerScreen;













