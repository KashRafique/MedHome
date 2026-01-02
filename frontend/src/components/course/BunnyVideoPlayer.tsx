import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  AppState,
  BackHandler,
  NativeModules,
  Modal,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome';
import Orientation from 'react-native-orientation-locker';

import { VideoControls } from './VideoControls';

const isOrientationAvailable = () => {
  return NativeModules.Orientation != null;
};

// @ts-ignore
import { getSecureVideoSource } from '../../config/videoCDN';
import { updateVideoProgress, markLessonCompleted } from '../../services/courseService';
// @ts-ignore
import { COLORS } from '../../constants/colors';

interface BunnyVideoPlayerProps {
  videoId: string;
  courseId: string;
  lessonId: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoad?: (data: OnLoadData) => void;
  onProgress?: (data: OnProgressData) => void;
  onEnd?: () => void;
  onBack?: () => void;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  initialProgress?: number;
}

const QUALITY_LEVELS = [
  { label: '720p', height: 720 },
  { label: '480p', height: 480 },
  { label: '360p', height: 360 },
];

export const BunnyVideoPlayer: React.FC<BunnyVideoPlayerProps> = ({
  videoId,
  courseId,
  lessonId,
  title,
  poster,
  autoplay = false,
  muted: initialMuted = false,
  controls = true,
  onError,
  onLoadStart,
  onLoad,
  onProgress,
  onEnd,
  onBack,
  style,
  resizeMode = 'contain',
  initialProgress = 0,
}) => {
  const videoRef = useRef<any>(null);
  const [paused, setPaused] = useState(!autoplay);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  // Volume & Quality
  const [volume, setVolume] = useState(1.0);
  const [muted, setMuted] = useState(initialMuted);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const lastProgressUpdate = useRef(0);
  const appState = useRef(AppState.currentState);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Double tap detection
  const lastTap = useRef({ left: 0, right: 0 });
  const DOUBLE_TAP_DELAY = 300;
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      if (isOrientationAvailable() && Orientation?.lockToLandscape) {
        Orientation.lockToLandscape();
      }
    } catch (err) {
      console.warn('Orientation error:', err);
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        setPaused(true);
        saveProgress();
      }
      appState.current = nextAppState;
    });

    return () => {
      try {
        if (isOrientationAvailable() && Orientation?.lockToPortrait) {
          Orientation.lockToPortrait();
        }
      } catch (err) { }
      backHandler.remove();
      subscription.remove();
      saveProgress();
    };
  }, []);

  useEffect(() => {
    if (!paused && showControls && !loading && !error && !isSeeking) {
      const timer = setTimeout(() => hideControls(), 5000);
      return () => clearTimeout(timer);
    }
  }, [paused, showControls, loading, error, isSeeking]);

  useEffect(() => {
    if (currentTime > 0 && duration > 0 && !loading) {
      const now = Date.now();
      if (now - lastProgressUpdate.current > 5000) {
        saveProgress();
        lastProgressUpdate.current = now;
      }
    }
  }, [currentTime, duration, loading]);

  const showControlsAnimated = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const togglePlayPause = () => {
    setPaused(!paused);
    showControlsAnimated();
  };

  const handleBack = () => {
    saveProgress();
    try {
      if (isOrientationAvailable() && Orientation?.lockToPortrait) {
        Orientation.lockToPortrait();
      }
    } catch (err) { }
    onBack?.();
  };

  const handleLoad = (data: OnLoadData) => {
    setLoading(false);
    setDuration(data.duration);
    if (initialProgress > 0 && videoRef.current) {
      videoRef.current.seek(initialProgress);
      setCurrentTime(initialProgress);
    } else {
      setCurrentTime(data.currentTime);
    }
    onLoad?.(data);
  };

  const handleProgress = (data: OnProgressData) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
    onProgress?.(data);
  };

  const handleError = (errorData: any) => {
    console.error('Video error:', errorData);
    setLoading(false);
    setError(errorData.error?.localizedDescription || 'Failed to load video');
    onError?.(errorData);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    onLoadStart?.();
  };

  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setBuffering(isBuffering);
  };

  const handleTapZone = (side: 'left' | 'right') => {
    const now = Date.now();
    const lastTapTime = lastTap.current[side];

    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
      skip(side === 'left' ? -15 : 15);
      lastTap.current[side] = 0;
    } else {
      lastTap.current[side] = now;
      doubleTapTimeoutRef.current = setTimeout(() => {
        setShowControls((prev) => !prev);
        doubleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current || !duration) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.seek(newTime);
    setCurrentTime(newTime);
    showControlsAnimated();
  };

  const saveProgress = async () => {
    if (!courseId || !lessonId || duration === 0) return;
    const progressPercent = (currentTime / duration) * 100;
    const completed = progressPercent >= 90;

    try {
      await updateVideoProgress(courseId, lessonId, {
        currentTime,
        duration,
        progressPercent,
        completed,
      });
      if (completed && progressPercent >= 90) {
        await markLessonCompleted(courseId, lessonId).catch(() => { });
      }
    } catch (err) {
      console.error('Progress save error:', err);
    }
  };

  const onSeek = (time: number) => {
    setCurrentTime(time);
  };

  const onSlidingStart = () => {
    setIsSeeking(true);
    showControlsAnimated();
  };

  const onSlidingComplete = (time: number) => {
    if (videoRef.current) {
      videoRef.current.seek(time);
    }
    setCurrentTime(time);
    setIsSeeking(false);
  };

  const videoSource = getSecureVideoSource(videoId);

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Video Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          paused={paused}
          muted={muted}
          volume={volume}
          resizeMode={resizeMode}
          poster={poster}
          onLoad={handleLoad}
          onLoadStart={handleLoadStart}
          onProgress={handleProgress}
          onError={handleError}
          onBuffer={handleBuffer}
          onEnd={() => {
            saveProgress();
            markLessonCompleted(courseId, lessonId).catch(() => { });
            onEnd?.();
          }}
          controls={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          progressUpdateInterval={250}
        />

        <View style={styles.tapZonesContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.leftZone}
            activeOpacity={1}
            onPress={() => handleTapZone('left')}
          />
          <TouchableOpacity
            style={styles.centerZone}
            activeOpacity={1}
            onPress={() => setShowControls(!showControls)}
          />
          <TouchableOpacity
            style={styles.rightZone}
            activeOpacity={1}
            onPress={() => handleTapZone('right')}
          />
        </View>

        {(loading || buffering) && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>{loading ? 'Loading...' : 'Buffering...'}</Text>
          </View>
        )}

        {controls && !loading && !error && showControls && (
          <VideoControls
            currentTime={currentTime}
            duration={duration}
            paused={paused}
            onTogglePlay={togglePlayPause}
            onSeek={onSeek}
            onSlidingStart={onSlidingStart}
            onSlidingComplete={onSlidingComplete}
            onBack={handleBack}
            title={title}
            volume={volume}
            muted={muted}
            onVolumeChange={(val) => {
              setVolume(val);
              if (val > 0) setMuted(false);
              if (val === 0) setMuted(true);
            }}
            onToggleMute={() => setMuted(!muted)}
            selectedQuality={selectedQuality}
            onOpenQualityMenu={() => setShowQualityMenu(true)}
            opacity={controlsOpacity}
          />
        )}
      </View>

      <Modal visible={showQualityMenu} transparent animationType="fade" onRequestClose={() => setShowQualityMenu(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowQualityMenu(false)}>
          <View style={styles.qualityModal}>
            <Text style={styles.modalTitle}>Video Quality</Text>
            {QUALITY_LEVELS.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[styles.qualityItem, selectedQuality === q.label && styles.qualityItemActive]}
                onPress={() => {
                  setSelectedQuality(q.label);
                  setShowQualityMenu(false);
                  showControlsAnimated();
                }}
              >
                <Text style={[styles.qualityLabel, selectedQuality === q.label && styles.qualityLabelActive]}>
                  {q.label}
                </Text>
                {selectedQuality === q.label && <Icon name="check" size={18} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: { flex: 1, position: 'relative', width: '100%', height: '100%' },
  video: { width: '100%', height: '100%' },

  tapZonesContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 1 },
  leftZone: { width: '30%', height: '100%' },
  centerZone: { width: '40%', height: '100%' },
  rightZone: { width: '30%', height: '100%' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 14 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#fff', fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  errorMessage: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  qualityModal: { backgroundColor: '#1c1c1e', borderRadius: 12, width: 200, paddingVertical: 12 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  qualityItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  qualityItemActive: { backgroundColor: 'rgba(0,122,255,0.15)' },
  qualityLabel: { color: '#fff', fontSize: 15 },
  qualityLabelActive: { color: '#007AFF', fontWeight: '700' },
});

export default BunnyVideoPlayer;
