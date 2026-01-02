// src/screens/main/VideoPlayerScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BunnyVideoPlayer } from '../../components/course/BunnyVideoPlayer';
import { COLORS } from '../../constants/colors';
import { getUserCourseProgress } from '../../services/courseService';

const VideoPlayerScreen = ({ route, navigation }) => {
  const { lesson, courseId, courseTitle } = route.params;
  const [initialProgress, setInitialProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get video ID from lesson (could be in videoUrl, video, or url field)
  const videoId = lesson.videoUrl || lesson.video || lesson.url;
  const lessonId = lesson.id || lesson._id;

  // Debug: Log lesson data
  console.log('📹 VideoPlayerScreen - Lesson data:', {
    title: lesson.title,
    videoId: videoId,
    lessonId: lessonId,
    courseId: courseId,
    hasVideoUrl: !!lesson.videoUrl,
    hasVideo: !!lesson.video,
    hasUrl: !!lesson.url,
  });

  // Fetch initial progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      if (!courseId || !lessonId) {
        setLoading(false);
        return;
      }

      try {
        const result = await getUserCourseProgress(courseId);
        if (result.success && result.data) {
          // Find progress for this lesson
          const lessonProgress = result.data.lessons?.find(
            (l) => l.lessonId === lessonId || l._id === lessonId
          );
          
          if (lessonProgress?.progress?.currentTime) {
            setInitialProgress(lessonProgress.progress.currentTime);
            console.log('📹 Resuming from:', lessonProgress.progress.currentTime, 'seconds');
          }
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId, lessonId]);

  const handleError = (error) => {
    console.error('❌ VideoPlayerScreen Error:', error);
    Alert.alert('Video Error', 'Failed to load video. Please try again.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No video available</Text>
        <Text style={styles.errorSubtext}>
          Video ID not found for this lesson
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BunnyVideoPlayer
        videoId={videoId}
        courseId={courseId}
        lessonId={lessonId}
        title={lesson.title}
        autoplay={true}
        controls={true}
        onError={handleError}
        onBack={handleBack}
        initialProgress={initialProgress}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black || '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.black || '#000',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white || '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textLight || '#ccc',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default VideoPlayerScreen;















