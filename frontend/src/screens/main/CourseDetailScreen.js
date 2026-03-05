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
import { getQuizzesByCourse, checkQuizEligibility, getUserQuizAttempts } from '../../services/quizService';
import { getImageUrl } from '../../utils/imageUtils';
import PaymentModal from '../../components/course/PaymentModal';

const CourseDetailScreen = ({ route, navigation }) => {
  const { course: initialCourse } = route.params;
  const [course, setCourse] = useState(initialCourse);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  
  // Get enrollment status from course state (will be updated after fetch)
  // Use initial enrollment status as fallback
  const enrollmentStatus = course.enrollmentStatus || initialCourse.enrollmentStatus || 'none';
  const isApproved = enrollmentStatus === 'approved';
  const isPending = enrollmentStatus === 'pending';
  const isEnrolled = course.enrolled !== undefined ? course.enrolled : (initialCourse.enrolled || false);

  useEffect(() => {
    // Fetch full course details with modules and lessons from backend
    fetchCourseContent();
  }, []);

  useEffect(() => {
    // Fetch quizzes when course is loaded
    if (course._id || course.id) {
      fetchQuizzes();
    }
  }, [course._id, course.id]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const courseId = initialCourse._id || initialCourse.id;
      console.log('📱 Frontend: Fetching course content for ID:', courseId);
      console.log('📱 Frontend: Initial enrollment status:', initialCourse.enrollmentStatus);
      console.log('📱 Frontend: Initial enrolled flag:', initialCourse.enrolled);
      
      if (courseId) {
        const courseData = await getCourseContent(courseId);
        console.log('📱 Frontend: Received course data:', courseData.title);
        console.log('📱 Frontend: Enrollment status from API:', courseData.enrollmentStatus);
        console.log('📱 Frontend: Enrolled flag from API:', courseData.enrolled);
        console.log('📱 Frontend: Modules count:', courseData.modules?.length);
        
        // Preserve enrollment status from API response
        // The backend now returns enrollmentStatus and enrolled flag
        setCourse({
          ...courseData,
          // Ensure enrollment status is preserved (use API response, fallback to initial)
          enrollmentStatus: courseData.enrollmentStatus || initialCourse.enrollmentStatus || null,
          enrolled: courseData.enrolled !== undefined ? courseData.enrolled : (initialCourse.enrolled || false)
        });
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
    // Check if lesson is accessible (uses backend isAccessible flag or falls back to isApproved)
    const lessonAccessible = lesson.isAccessible !== undefined ? lesson.isAccessible : isApproved;
    
    if (!lessonAccessible) {
      if (isPending) {
        Alert.alert(
          'Pending Approval',
          'Your enrollment is pending admin approval. You will be able to access course content once approved.',
        );
      } else if (isEnrolled) {
        Alert.alert(
          'Access Denied',
          'Your enrollment status does not allow access to this content. Please contact admin if you believe this is an error.'
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
          video: lesson.video, // Keep original video field
          videoSource: lesson.videoSource, // Include videoSource for URL construction
          title: lesson.title,
        }, 
        courseId: course.id || course._id, // Fix: Pass courseId
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
    setPaymentModalVisible(true);
  };

  const handleEnrollmentSuccess = () => {
    // Refresh course data to get updated enrollment status
    fetchCourseContent();
    setPaymentModalVisible(false);
  };

  const fetchQuizzes = async () => {
    try {
      setQuizzesLoading(true);
      const courseId = course._id || course.id;
      if (courseId) {
        const response = await getQuizzesByCourse(courseId);
        const quizzesData = response.data?.quizzes || response.quizzes || [];
        setQuizzes(quizzesData);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      // Don't show error alert, just log it
    } finally {
      setQuizzesLoading(false);
    }
  };

  const handleQuizPress = async (quiz) => {
    // Check if user can take the quiz
    try {
      const eligibility = await checkQuizEligibility(quiz._id);
      const eligibilityData = eligibility.data || eligibility;
      
      if (!eligibilityData.canTake) {
        // Check if there are previous attempts
        let previousAttempts = [];
        try {
          const attemptsResponse = await getUserQuizAttempts(quiz._id);
          previousAttempts = attemptsResponse.data || (Array.isArray(attemptsResponse) ? attemptsResponse : []);
        } catch (error) {
          console.error('Error fetching previous attempts:', error);
        }

        const attemptsRemaining = eligibilityData.attemptsRemaining ?? eligibilityData.data?.attemptsRemaining ?? 0;
        const maxAttempts = eligibilityData.maxAttempts ?? eligibilityData.data?.maxAttempts ?? 0;
        const attemptsUsed = maxAttempts - attemptsRemaining;

        // Build message
        let message = eligibilityData.reason || 'You are not eligible to take this quiz.';
        
        if (attemptsUsed > 0 && maxAttempts > 0) {
          message += `\n\nYou have used ${attemptsUsed} out of ${maxAttempts} attempts.`;
        }

        // Build alert buttons
        const alertButtons = [];
        
        // Add "Review Previous Attempts" button if attempts exist
        if (previousAttempts.length > 0) {
          alertButtons.push({
            text: `📋 Review Previous Attempts (${previousAttempts.length})`,
            onPress: () => {
              // Navigate to the most recent attempt
              const latestAttempt = previousAttempts[0];
              navigation.navigate('QuizResults', {
                attemptId: latestAttempt._id,
                quizId: quiz._id,
                courseId: course._id || course.id,
                courseTitle: course.title,
              });
            },
          });
        }
        
        // Add OK button
        alertButtons.push({
          text: 'OK',
          style: 'cancel',
        });

        Alert.alert(
          'Cannot Take Quiz',
          message,
          alertButtons
        );
        return;
      }

      // Navigate to quiz screen
      navigation.navigate('Quiz', {
        quizId: quiz._id,
        courseId: course._id || course.id,
        courseTitle: course.title,
      });
    } catch (error) {
      console.error('Error checking quiz eligibility:', error);
      Alert.alert(
        'Error',
        'Failed to check quiz eligibility. Please try again.'
      );
    }
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
        <Image source={{ uri: getImageUrl(course.thumbnail) }} style={styles.thumbnail} />

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
          {!isEnrolled && (
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
          {isEnrolled && isApproved && (
            <View style={styles.enrolledBanner}>
              <Text style={styles.enrolledBannerText}>✓ You are enrolled in this course</Text>
            </View>
          )}

          {isEnrolled && isPending && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingBannerText}>⏳ Enrollment Pending Approval</Text>
              <Text style={styles.pendingBannerSubtext}>
                Your payment is under review. You can view course modules but cannot access videos/PDFs until approved.
              </Text>
            </View>
          )}

          {isEnrolled && enrollmentStatus === 'rejected' && (
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
                              // Use isAccessible from backend (handles preview lessons and approved enrollment)
                              // Fallback to isApproved check if isAccessible is not provided
                              const isAccessible = lesson.isAccessible !== undefined ? lesson.isAccessible : isApproved;
                              const isLocked = !isAccessible;
                              
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
                          
                          {/* Display quizzes for this module (quizzes whose lessons belong to this module) */}
                          {(() => {
                            // Get all lesson IDs in this module
                            const moduleLessonIds = module.lessons.map(l => (l._id || l.id).toString());
                            
                            // Find quizzes that belong to lessons in this module
                            const moduleQuizzes = quizzes.filter(quiz => {
                              const quizLessonId = quiz.lesson?._id || quiz.lesson || quiz.lessonId;
                              return quizLessonId && moduleLessonIds.includes(quizLessonId.toString());
                            });
                            
                            if (moduleQuizzes.length > 0) {
                              return (
                                <View style={styles.moduleQuizzesContainer}>
                                  <Text style={styles.moduleQuizzesTitle}>📝 Quizzes</Text>
                                  {moduleQuizzes.map(quiz => {
                                    const quizId = quiz._id || quiz.id;
                                    return (
                                      <TouchableOpacity
                                        key={quizId}
                                        style={styles.moduleQuizItem}
                                        onPress={() => handleQuizPress(quiz)}
                                        activeOpacity={0.7}>
                                        <View style={styles.moduleQuizIconContainer}>
                                          <Text style={styles.moduleQuizIcon}>📝</Text>
                                        </View>
                                        <View style={styles.moduleQuizInfo}>
                                          <Text style={styles.moduleQuizTitle}>{quiz.title}</Text>
                                          <View style={styles.moduleQuizMeta}>
                                            <Text style={styles.moduleQuizMetaText}>
                                              {quiz.questions?.length || 0} questions
                                            </Text>
                                            {quiz.timeLimit && (
                                              <Text style={styles.moduleQuizMetaText}>
                                                • {quiz.timeLimit} min
                                              </Text>
                                            )}
                                            {quiz.passingScore && (
                                              <Text style={styles.moduleQuizMetaText}>
                                                • Pass: {quiz.passingScore}%
                                              </Text>
                                            )}
                                          </View>
                                        </View>
                                        <Text style={styles.moduleQuizArrow}>→</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              );
                            }
                            return null;
                          })()}
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

          {/* Course-level Quizzes Section (quizzes without lessons) */}
          {(() => {
            // Find quizzes that don't have a lesson assigned (course-level quizzes)
            const courseLevelQuizzes = quizzes.filter(quiz => {
              const quizLessonId = quiz.lesson?._id || quiz.lesson || quiz.lessonId;
              return !quizLessonId; // Quiz has no lesson = course-level
            });
            
            if (courseLevelQuizzes.length > 0) {
              return (
                <View style={styles.quizzesSection}>
                  <Text style={styles.sectionTitle}>📝 Course Quizzes</Text>
                  {courseLevelQuizzes.map(quiz => {
                    const quizId = quiz._id || quiz.id;
                    return (
                      <TouchableOpacity
                        key={quizId}
                        style={styles.quizCard}
                        onPress={() => handleQuizPress(quiz)}
                        activeOpacity={0.7}>
                        <View style={styles.quizCardContent}>
                          <View style={styles.quizIconContainer}>
                            <Text style={styles.quizIcon}>📝</Text>
                          </View>
                          <View style={styles.quizInfo}>
                            <Text style={styles.quizCardTitle}>{quiz.title}</Text>
                            <View style={styles.quizMeta}>
                              <Text style={styles.quizMetaText}>
                                {quiz.questions?.length || 0} questions
                              </Text>
                              {quiz.timeLimit && (
                                <Text style={styles.quizMetaText}>
                                  • {quiz.timeLimit} min
                                </Text>
                              )}
                              {quiz.passingScore && (
                                <Text style={styles.quizMetaText}>
                                  • Pass: {quiz.passingScore}%
                                </Text>
                              )}
                            </View>
                            {quiz.description && (
                              <Text style={styles.quizDescription} numberOfLines={2}>
                                {quiz.description}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.quizArrow}>→</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }
            return null;
          })()}

        </View>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        course={course}
        onSuccess={handleEnrollmentSuccess}
      />
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
  quizzesSection: {
    marginTop: 20,
  },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
  },
  quizCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quizIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quizIcon: {
    fontSize: 24,
  },
  quizInfo: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quizMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  quizMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  quizDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quizArrow: {
    fontSize: 20,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  lessonQuizzesContainer: {
    paddingLeft: 48, // Align with lesson content (icon width + margin)
    paddingRight: 16,
    paddingBottom: 8,
  },
  lessonQuizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.primary + '08',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  lessonQuizIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  lessonQuizIcon: {
    fontSize: 18,
  },
  lessonQuizInfo: {
    flex: 1,
  },
  lessonQuizTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  lessonQuizMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lessonQuizMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  lessonQuizArrow: {
    fontSize: 16,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  moduleQuizzesContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  moduleQuizzesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  moduleQuizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.primary + '08',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginHorizontal: 0,
  },
  moduleQuizIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleQuizIcon: {
    fontSize: 18,
  },
  moduleQuizInfo: {
    flex: 1,
  },
  moduleQuizTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  moduleQuizMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moduleQuizMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  moduleQuizArrow: {
    fontSize: 18,
    color: COLORS.textLight,
    marginLeft: 8,
  },
});

export default CourseDetailScreen;









