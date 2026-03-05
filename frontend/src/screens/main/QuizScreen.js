import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import {
  getQuiz,
  checkQuizEligibility,
  startQuizAttempt,
  submitQuizAttempt,
  getUserQuizAttempts,
} from '../../services/quizService';
import QuestionNavigator from '../../components/quiz/QuestionNavigator';
import QuizTimer from '../../components/quiz/QuizTimer';

const QuizScreen = ({ route, navigation }) => {
  const { quizId, courseId, courseTitle } = route.params || {};

  // State
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  // Fetch quiz data and eligibility
  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const [quizResponse, eligibilityResponse] = await Promise.all([
        getQuiz(quizId),
        checkQuizEligibility(quizId),
      ]);

      setQuizData(quizResponse.data || quizResponse);
      // Backend returns: { success: true, data: { canTake, attemptsRemaining, maxAttempts } }
      // checkQuizEligibility returns response.data, so we get { success: true, data: { ... } }
      // We need to extract the inner data object
      const eligibilityData = eligibilityResponse.data || eligibilityResponse;
      console.log('📊 Eligibility data structure:', {
        fullResponse: eligibilityResponse,
        extractedData: eligibilityData,
        attemptsRemaining: eligibilityData?.attemptsRemaining ?? eligibilityData?.data?.attemptsRemaining,
        maxAttempts: eligibilityData?.maxAttempts ?? eligibilityData?.data?.maxAttempts,
      });
      setEligibility(eligibilityData);
      
      // Fetch previous attempts
      try {
        const attemptsResponse = await getUserQuizAttempts(quizId);
        const attempts = attemptsResponse.data || (Array.isArray(attemptsResponse) ? attemptsResponse : []);
        setPreviousAttempts(Array.isArray(attempts) ? attempts : []);
      } catch (error) {
        console.error('Error fetching previous attempts:', error);
        setPreviousAttempts([]);
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load quiz. Please try again.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || !quizStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, quizStarted]);

  // Handle view previous attempts
  const handleViewPreviousAttempts = () => {
    if (previousAttempts.length === 0) {
      Alert.alert('No Attempts', 'You have not completed any attempts yet.');
      return;
    }
    
    // Navigate to the most recent attempt
    const latestAttempt = previousAttempts[0]; // Assuming sorted by most recent first
    navigation.navigate('QuizResults', {
      attemptId: latestAttempt._id,
      quizId,
      courseId,
      courseTitle,
    });
  };

  // Start quiz attempt
  const handleStartQuiz = async () => {
    try {
      const response = await startQuizAttempt(quizId);
      const attempt = response.attempt || response.data?.attempt;
      
      if (!attempt || !attempt._id) {
        throw new Error('Failed to start quiz attempt');
      }

      setAttemptId(attempt._id);
      setQuizStarted(true);

      // Set timer if quiz has time limit
      if (quizData?.timeLimit) {
        setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to start quiz. Please try again.'
      );
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Toggle flag
  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  // Navigate to question
  const handleQuestionSelect = (index) => {
    if (index >= 0 && index < (quizData?.questions?.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  // Previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Next question
  const handleNext = () => {
    if (currentQuestionIndex < (quizData?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!attemptId) {
      Alert.alert('Error', 'No active quiz attempt found');
      return;
    }

    Alert.alert(
      'Submit Quiz',
      'Are you sure you want to submit your quiz? You cannot change your answers after submission.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await submitQuizAttempt(attemptId, answers);
              
              // Navigate to results screen
              navigation.replace('QuizResults', {
                attemptId: attemptId,
                quizId: quizId,
                courseId: courseId,
                courseTitle: courseTitle,
                result: response.attempt || response,
              });
            } catch (error) {
              console.error('Error submitting quiz:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to submit quiz. Please try again.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  // Check eligibility
  if (eligibility && !eligibility.canTake) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Cannot Take Quiz</Text>
          <Text style={styles.errorMessage}>{eligibility.reason || 'You are not eligible to take this quiz.'}</Text>
          {(eligibility.attemptsRemaining ?? eligibility.data?.attemptsRemaining) !== undefined && (
            <Text style={styles.errorSubtext}>
              {(() => {
                const maxAttempts = eligibility.maxAttempts ?? eligibility.data?.maxAttempts ?? 0;
                const attemptsRemaining = eligibility.attemptsRemaining ?? eligibility.data?.attemptsRemaining ?? 0;
                const attemptsUsed = maxAttempts - attemptsRemaining;
                return `Attempts: ${attemptsUsed} / ${maxAttempts}`;
              })()}
            </Text>
          )}
          
          {/* View Previous Attempts Button */}
          {previousAttempts.length > 0 && (
            <TouchableOpacity
              style={styles.viewAttemptsButton}
              onPress={handleViewPreviousAttempts}
              activeOpacity={0.8}>
              <Text style={styles.viewAttemptsButtonText}>
                📋 Review Previous Attempts ({previousAttempts.length})
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Check if quiz has questions
  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📝</Text>
          <Text style={styles.errorTitle}>Quiz Not Ready</Text>
          <Text style={styles.errorMessage}>
            This quiz doesn't have any questions yet. Please check back later.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pre-quiz start screen
  if (!quizStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quizData.title || 'Quiz'}
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle}>{quizData.title}</Text>
            {quizData.description && (
              <Text style={styles.quizDescription}>{quizData.description}</Text>
            )}

            <View style={styles.quizDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Questions:</Text>
                <Text style={styles.detailValue}>{quizData.questions.length}</Text>
              </View>
              {quizData.timeLimit && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time Limit:</Text>
                  <Text style={styles.detailValue}>{quizData.timeLimit} minutes</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Passing Score:</Text>
                <Text style={styles.detailValue}>{quizData.passingScore}%</Text>
              </View>
              {eligibility && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Attempts:</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const maxAttempts = eligibility.maxAttempts ?? eligibility.data?.maxAttempts ?? 0;
                      const attemptsRemaining = eligibility.attemptsRemaining ?? eligibility.data?.attemptsRemaining ?? 0;
                      const attemptsUsed = maxAttempts - attemptsRemaining;
                      return `${attemptsUsed} / ${maxAttempts}`;
                    })()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartQuiz}
              activeOpacity={0.8}
              disabled={eligibility && !eligibility.canTake}>
              <Text style={styles.startButtonText}>
                {eligibility && !eligibility.canTake ? 'Cannot Start Quiz' : 'Start Quiz'}
              </Text>
            </TouchableOpacity>

            {/* View Previous Attempts Button - Show if there are previous attempts */}
            {previousAttempts.length > 0 && (
              <TouchableOpacity
                style={styles.viewAttemptsButton}
                onPress={handleViewPreviousAttempts}
                activeOpacity={0.8}>
                <Text style={styles.viewAttemptsButtonText}>
                  📋 Review Previous Attempts ({previousAttempts.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Quiz taking screen
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const answeredQuestions = new Set(
    Object.keys(answers).map((qId) =>
      quizData.questions.findIndex((q) => q._id === qId)
    )
  );

  const isFlagged = flaggedQuestions.has(currentQuestionIndex);
  const currentAnswer = answers[currentQuestion._id];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quizData.title || 'Quiz'}
        </Text>
        {timeRemaining !== null && (
          <QuizTimer timeRemaining={timeRemaining} />
        )}
      </View>

      <View style={styles.quizContainer}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={true}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionTypeBadge}>
                <Text style={styles.questionTypeBadgeText}>
                  {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' :
                   currentQuestion.type === 'true_false' ? 'True/False' :
                   currentQuestion.type === 'fill_blank' ? 'Fill in the Blank' :
                   'Essay'}
                </Text>
              </View>
              <Text style={styles.questionNumber}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Text>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Answer Options */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      currentAnswer === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleAnswerSelect(currentQuestion._id, option)}
                    activeOpacity={0.7}>
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          currentAnswer === option && styles.radioSelected,
                        ]}>
                        {currentAnswer === option && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentQuestion.type === 'true_false' && (
              <View style={styles.optionsContainer}>
                {['True', 'False'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      currentAnswer === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleAnswerSelect(currentQuestion._id, option)}
                    activeOpacity={0.7}>
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          currentAnswer === option && styles.radioSelected,
                        ]}>
                        {currentAnswer === option && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <View style={styles.fillBlankContainer}>
                <TextInput
                  style={styles.fillBlankInput}
                  value={currentAnswer || ''}
                  onChangeText={(text) => handleAnswerSelect(currentQuestion._id, text)}
                  placeholder="Type your answer here..."
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentQuestionIndex === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePrevious}
                disabled={currentQuestionIndex === 0}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.navButtonText,
                    currentQuestionIndex === 0 && styles.navButtonTextDisabled,
                  ]}>
                  ← Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.navButtonPrimary,
                  currentQuestionIndex === totalQuestions - 1 && styles.navButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.navButtonText,
                    styles.navButtonTextPrimary,
                    currentQuestionIndex === totalQuestions - 1 && styles.navButtonTextDisabled,
                  ]}>
                  Next →
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
              onPress={handleToggleFlag}
              activeOpacity={0.7}>
              <Text style={styles.flagButtonText}>
                {isFlagged ? '🏁 Flagged' : '🏁 Flag'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitQuiz}
              disabled={isSubmitting}
              activeOpacity={0.8}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Navigator Sidebar */}
        <QuestionNavigator
          totalQuestions={totalQuestions}
          currentQuestionIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          flaggedQuestions={flaggedQuestions}
          onQuestionSelect={handleQuestionSelect}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  quizInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  quizDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  quizDetails: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  startButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  viewAttemptsButton: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewAttemptsButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quizContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  questionScroll: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  questionTypeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  questionTypeBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  questionNumber: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '500',
    padding: 16,
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  navButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  navButtonTextPrimary: {
    color: COLORS.white,
  },
  navButtonTextDisabled: {
    color: COLORS.textLight,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 24,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundLight,
  },
  fillBlankContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fillBlankInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    minHeight: 48,
  },
  flagButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  flagButtonActive: {
    backgroundColor: COLORS.warning + '20',
    borderColor: COLORS.warning,
  },
  flagButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizScreen;
