// src/screens/main/CourseDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getCourseContent } from '../../services/courseService';

const CourseDetailScreen = ({ route, navigation }) => {
  const { course: initialCourse } = route.params;
  const [course, setCourse] = useState(initialCourse);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  
  // Check enrollment status
  const enrollmentStatus = course.enrollmentStatus || 'none';
  const isApproved = enrollmentStatus === 'approved';
  const isPending = enrollmentStatus === 'pending';

  useEffect(() => {
    // Fetch full course details with modules and lessons from backend
    fetchCourseContent();
  }, []);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const courseId = initialCourse._id || initialCourse.id;
      console.log('📱 Frontend: Fetching course content for ID:', courseId);
      console.log('📱 Frontend: Course object:', initialCourse);
      
      if (courseId) {
        const courseData = await getCourseContent(courseId);
        console.log('📱 Frontend: Received course data:', courseData.title);
        console.log('📱 Frontend: Modules count:', courseData.modules?.length);
        setCourse(courseData);
      } else {
        console.error('📱 Frontend: No course ID found!');
        Alert.alert('Error', 'Invalid course - no ID found');
      }
    } catch (error) {
      console.error('📱 Frontend: Error fetching course content:', error);
      console.error('📱 Frontend: Error response:', error.response?.data);
      console.error('📱 Frontend: Error status:', error.response?.status);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to load course content. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = moduleId => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonPress = lesson => {
    // Check if user is approved to access content
    if (!isApproved) {
      if (isPending) {
        Alert.alert(
          'Pending Approval',
          'Your enrollment is pending admin approval. You will be able to access course content once approved.',
        );
      } else {
        Alert.alert('Enrollment Required', 'Please enroll in this course to access content.');
      }
      return;
    }

    // Determine lesson type from backend structure
    // Backend structure: lesson.video (string) or lesson.pdfUrl (string)
    if (lesson.video) {
      navigation.navigate('VideoPlayer', { 
        lesson: {
          ...lesson,
          videoUrl: lesson.video,
          title: lesson.title,
        }, 
        courseTitle: course.title 
      });
    } else if (lesson.pdfUrl) {
      navigation.navigate('PDFViewer', { 
        lesson: {
          ...lesson,
          pdfUrl: lesson.pdfUrl,
          title: lesson.title,
        }, 
        courseTitle: course.title 
      });
    } else {
      Alert.alert('Info', 'Lesson content not available');
    }
  };

  const handleEnroll = () => {
    navigation.navigate('Payment', { course });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Hero */}
        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

        <View style={styles.content}>
          {/* Course Info */}
          <Text style={styles.title}>{course.title}</Text>
          <View style={styles.courseMetaStart}>
            <Text style={styles.description}>{course.description}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>▶️</Text>
              <Text style={styles.statText}>
                {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lessons
              </Text>
            </View>
            {course.approved && (
              <View style={styles.approvedBadge}>
                <Text style={styles.approvedText}>✓ Approved</Text>
              </View>
            )}
          </View>

          {/* Enroll Button */}
          {!course.enrolled && (
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={handleEnroll}
              activeOpacity={0.8}>
              <Text style={styles.enrollButtonText}>
                Enroll Now - ${course.price}
              </Text>
            </TouchableOpacity>
          )}

          {/* Enrollment Status Banners */}
          {course.enrolled && isApproved && (
            <View style={styles.enrolledBanner}>
              <Text style={styles.enrolledBannerText}>✓ You are enrolled in this course</Text>
            </View>
          )}

          {course.enrolled && isPending && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingBannerText}>⏳ Enrollment Pending Approval</Text>
              <Text style={styles.pendingBannerSubtext}>
                Your payment is under review. You can view course modules but cannot access videos/PDFs until approved.
              </Text>
            </View>
          )}

          {course.enrolled && enrollmentStatus === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <Text style={styles.rejectedBannerText}>✕ Enrollment Rejected</Text>
              <Text style={styles.rejectedBannerSubtext}>
                Please contact admin for more information.
              </Text>
            </View>
          )}

          {/* Course Content */}
          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>Course Content</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading course content...</Text>
              </View>
            ) : course.modules && course.modules.length > 0 ? (
              course.modules
                .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort modules by order
                .map(module => {
                  const moduleId = module._id || module.id;
                  return (
                    <View key={moduleId} style={styles.accordionContainer}>
                      <TouchableOpacity
                        onPress={() => toggleModule(moduleId)}
                        style={styles.accordionHeader}
                        activeOpacity={0.7}>
                        <View style={styles.accordionInfo}>
                          <Text style={styles.moduleTitle}>{module.title}</Text>
                          <Text style={styles.moduleSubtitle}>{module.description || ''}</Text>
                        </View>
                        <Text style={styles.accordionIcon}>
                          {expandedModules[moduleId] ? '▲' : '▼'}
                        </Text>
                      </TouchableOpacity>

                      {expandedModules[moduleId] && module.lessons && (
                        <View style={styles.accordionContent}>
                          {module.lessons
                            .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort lessons by order
                            .map(lesson => {
                              const lessonId = lesson._id || lesson.id;
                              const lessonType = lesson.video ? 'video' : lesson.pdfUrl ? 'pdf' : 'unknown';
                              const isLocked = !isApproved;
                              return (
                                <TouchableOpacity
                                  key={lessonId}
                                  style={styles.lessonItem}
                                  onPress={() => handleLessonPress(lesson)}
                                  activeOpacity={0.7}>
                                  <View style={[
                                    styles.lessonIconContainer,
                                    isLocked && styles.lessonIconLocked
                                  ]}>
                                    <Text style={styles.lessonIcon}>
                                      {isLocked ? '🔒' : (lessonType === 'video' ? '▶️' : '📄')}
                                    </Text>
                                  </View>
                                  <View style={styles.lessonInfo}>
                                    <Text style={[
                                      styles.lessonTitle, 
                                      isLocked && styles.lessonTitleDisabled
                                    ]}>
                                      {lesson.title}
                                    </Text>
                                    <View style={styles.lessonMeta}>
                                      <Text style={styles.lessonTypeBadge}>
                                        {lessonType === 'video' ? 'Video' : 'PDF'}
                                      </Text>
                                      {lesson.duration && (
                                        <Text style={styles.lessonDuration}>
                                          {Math.floor(lesson.duration / 60)} min
                                        </Text>
                                      )}
                                      {isLocked && (
                                        <Text style={styles.lockedLabel}>🔒 Locked</Text>
                                      )}
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                        </View>
                      )}
                    </View>
                  );
                })
            ) : (
              <View style={styles.noContentContainer}>
                <Text style={styles.noContentText}>
                  No content available yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.borderLight,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  courseMetaStart: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  approvedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  enrollButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enrollButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  enrolledBanner: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  enrolledBannerText: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '600',
  },
  pendingBanner: {
    backgroundColor: '#FFA500' + '20',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  pendingBannerText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingBannerSubtext: {
    color: '#FFA500',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  rejectedBanner: {
    backgroundColor: (COLORS.error || '#EF4444') + '20',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error || '#EF4444',
  },
  rejectedBannerText: {
    color: COLORS.error || '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  rejectedBannerSubtext: {
    color: COLORS.error || '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
  modulesSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  accordionContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 0,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F9FAFB', // Light gray background for header
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  accordionInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  accordionIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  accordionContent: {
    paddingLeft: 0,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  lessonIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 12,
  },
  lessonIconLocked: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  lessonIcon: {
    fontSize: 16,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  lessonTitleDisabled: {
    color: COLORS.textLight,
  },
  lessonMeta: {
    flexDirection: 'row',
  },
  lessonTypeBadge: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  noContentContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noContentText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  lessonDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  lockedLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 8,
  },
});

export default CourseDetailScreen;









