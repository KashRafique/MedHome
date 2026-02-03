import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getQuizAttempt, getQuiz, startQuizAttempt, checkQuizEligibility } from '../../services/quizService';

const QuizResultsScreen = ({ route, navigation }) => {
  const { attemptId, quizId, courseId, courseTitle, result } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState(result);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showYourAnswer, setShowYourAnswer] = useState(true);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [attemptId, quizId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [attemptResponse, quizResponse] = await Promise.all([
        attemptId ? getQuizAttempt(attemptId) : Promise.resolve({ data: result }),
        quizId ? getQuiz(quizId) : Promise.resolve(null),
      ]);

      setAttemptData(attemptResponse.data || attemptResponse || result);
      if (quizResponse) {
        setQuizData(quizResponse.data || quizResponse);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      Alert.alert('Error', 'Failed to load quiz results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeQuiz = async () => {
    if (!quizId) {
      Alert.alert('Error', 'Quiz ID not found');
      return;
    }

    try {
      // Check eligibility first
      const eligibilityResponse = await checkQuizEligibility(quizId);
      const eligibility = eligibilityResponse.data || eligibilityResponse;
      
      console.log('Retake quiz eligibility check:', eligibility);
      
      if (!eligibility.canTake) {
        Alert.alert(
          'Cannot Retake Quiz',
          eligibility.reason || 'You have reached the maximum number of attempts for this quiz.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (eligibility.attemptsRemaining <= 0) {
        Alert.alert(
          'No Attempts Remaining',
          'You have used all available attempts for this quiz.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Retake Quiz',
        `You have ${eligibility.attemptsRemaining} attempt(s) remaining. Are you sure you want to retake this quiz?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retake',
            onPress: async () => {
              try {
                console.log('Starting new quiz attempt for quizId:', quizId);
                const response = await startQuizAttempt(quizId);
                console.log('Start attempt response:', response);
                
                const attempt = response.attempt || response.data?.attempt || response.data;
                
                if (attempt?._id) {
                  console.log('Navigating to Quiz with attemptId:', attempt._id);
                  navigation.replace('Quiz', {
                    quizId,
                    courseId,
                    courseTitle,
                    attemptId: attempt._id,
                  });
                } else {
                  console.error('No attempt ID in response:', response);
                  Alert.alert('Error', 'Failed to start quiz attempt. Please try again.');
                }
              } catch (error) {
                console.error('Error starting quiz:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to start quiz. Please try again.';
                Alert.alert('Error', errorMessage);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error checking eligibility:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check quiz eligibility. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (!attemptData || !quizData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No results available</Text>
        </View>
      </View>
    );
  }

  const score = attemptData.score || 0;
  const percentage = attemptData.percentage || 0;
  const passed = attemptData.passed || false;
  const totalQuestions = quizData?.questions?.length || 0;
  const correctAnswers = attemptData.answers?.filter((a) => a.isCorrect).length || 0;
  const incorrectAnswers = attemptData.answers?.filter((a) => !a.isCorrect).length || 0;
  const unansweredQuestions = totalQuestions - (attemptData.answers?.length || 0);
  const timeSpent = attemptData.timeSpent || 0;

  // Helper to normalize question IDs
  const normalizeQuestionId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id._id) return id._id.toString();
    return id.toString();
  };

  // Get current question
  const currentQuestion = quizData.questions?.[currentQuestionIndex];
  const currentAnswer = attemptData.answers?.find((a) => {
    if (!currentQuestion) return false;
    const normalizedQuestionId = normalizeQuestionId(currentQuestion._id);
    const answerQuestionId = normalizeQuestionId(a.question);
    return answerQuestionId === normalizedQuestionId;
  });

  // Get question status for navigator
  const getQuestionStatus = (questionId) => {
    const normalizedQuestionId = normalizeQuestionId(questionId);
    if (!normalizedQuestionId) return 'unanswered';
    
    const answer = attemptData.answers?.find((a) => {
      const answerQuestionId = normalizeQuestionId(a.question);
      return answerQuestionId === normalizedQuestionId;
    });
    
    if (!answer) return 'unanswered';
    return answer.isCorrect ? 'correct' : 'incorrect';
  };

  // Format answer display
  const formatAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer || 'Not answered';
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
      </View>
    );
  }

  const isCorrect = currentAnswer?.isCorrect || false;
  const userAnswer = currentAnswer?.answer || 'Not answered';
  const correctAnswer = currentQuestion?.correctAnswer;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CourseDetail', { course: { _id: courseId } })}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <TouchableOpacity
          onPress={() => setShowNavigator(!showNavigator)}
          style={styles.navigatorToggle}>
          <Text style={styles.navigatorToggleText}>#</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          {/* Status Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconCircle, passed ? styles.passedIcon : styles.failedIcon]}>
              <Text style={[styles.summaryIcon, passed ? styles.summaryIconPassed : styles.summaryIconFailed]}>
                {passed ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={[styles.summaryValue, passed ? styles.passedText : styles.failedText]}>
              {passed ? 'PASSED' : 'FAILED'}
            </Text>
          </View>

          {/* Score Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconCircle, styles.scoreIcon]}>
              <Text style={[styles.summaryIcon, styles.summaryIconScore]}>📊</Text>
            </View>
            <Text style={styles.summaryLabel}>Score</Text>
            <Text style={styles.summaryValue}>{percentage.toFixed(1)}%</Text>
          </View>

          {/* Correct Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconCircle, styles.correctIcon]}>
              <Text style={[styles.summaryIcon, styles.summaryIconCorrect]}>✓</Text>
            </View>
            <Text style={styles.summaryLabel}>Correct</Text>
            <Text style={[styles.summaryValue, styles.correctText]}>
              {correctAnswers}/{totalQuestions}
            </Text>
          </View>

          {/* Time Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconCircle, styles.timeIcon]}>
              <Text style={[styles.summaryIcon, styles.summaryIconTime]}>⏱</Text>
            </View>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={[styles.summaryValue, styles.timeText]}>
              {formatTime(timeSpent)}
            </Text>
          </View>
        </View>

        {/* Feedback Message */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            {passed
              ? percentage >= 90
                ? "Excellent work! You've demonstrated a thorough understanding."
                : percentage >= 80
                ? "Great job! You have a solid grasp of the concepts."
                : "Good work! You've passed the quiz successfully."
              : percentage >= 60
              ? "You're close! Review the material and try again."
              : "Keep studying! Focus on the areas where you struggled."}
          </Text>
        </View>

        {/* Question Navigator Grid (Collapsible) */}
        {showNavigator && (
          <View style={styles.navigatorContainer}>
            <View style={styles.navigatorHeader}>
              <Text style={styles.navigatorTitle}>Question Navigator</Text>
              <TouchableOpacity onPress={() => setShowNavigator(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.navigatorGrid}>
              {quizData.questions.map((question, index) => {
                const status = getQuestionStatus(question._id);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <TouchableOpacity
                    key={question._id || index}
                    style={[
                      styles.navigatorButton,
                      isCurrent && styles.navigatorButtonCurrent,
                      status === 'correct' && !isCurrent && styles.navigatorButtonCorrect,
                      status === 'incorrect' && !isCurrent && styles.navigatorButtonIncorrect,
                      status === 'unanswered' && !isCurrent && styles.navigatorButtonUnanswered,
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(index);
                      setShowNavigator(false);
                    }}>
                    <Text
                      style={[
                        styles.navigatorButtonText,
                        isCurrent && styles.navigatorButtonTextCurrent,
                        status === 'correct' && !isCurrent && styles.navigatorButtonTextCorrect,
                        status === 'incorrect' && !isCurrent && styles.navigatorButtonTextIncorrect,
                      ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendCurrent]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendCorrect]} />
                <Text style={styles.legendText}>Correct</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendIncorrect]} />
                <Text style={styles.legendText}>Incorrect</Text>
              </View>
              {unansweredQuestions > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendUnanswered]} />
                  <Text style={styles.legendText}>Unanswered</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Current Question Display */}
        <View style={styles.questionContainer}>
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.questionHeaderLeft}>
              <Text style={styles.questionNumber}>
                Question {currentQuestionIndex + 1}
              </Text>
              <View style={styles.questionBadges}>
                <View style={styles.questionTypeBadge}>
                  <Text style={styles.questionTypeText}>
                    {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 
                     currentQuestion.type === 'true_false' ? 'True/False' :
                     currentQuestion.type === 'fill_blank' ? 'Fill in the Blank' :
                     'Essay'}
                  </Text>
                </View>
                <View style={[styles.questionPointsBadge, isCorrect ? styles.pointsCorrect : styles.pointsIncorrect]}>
                  <Text style={styles.questionPointsText}>
                    {currentAnswer?.points || 0}/{currentQuestion.points} pts
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.questionStatusIcon}>
              {isCorrect ? (
                <Text style={styles.correctIcon}>✓</Text>
              ) : (
                <Text style={styles.incorrectIcon}>✗</Text>
              )}
            </View>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {/* Your Answer - Collapsible */}
          <TouchableOpacity
            style={[styles.answerBox, isCorrect ? styles.answerBoxCorrect : styles.answerBoxIncorrect]}
            onPress={() => setShowYourAnswer(!showYourAnswer)}
            activeOpacity={0.7}>
            <View style={styles.answerBoxHeader}>
              <Text style={styles.answerBoxIcon}>{isCorrect ? '✓' : '✗'}</Text>
              <Text style={styles.answerBoxLabel}>Your Answer:</Text>
              <TouchableOpacity
                onPress={() => setShowYourAnswer(!showYourAnswer)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.expandIcon}>{showYourAnswer ? '▼' : '▶'}</Text>
              </TouchableOpacity>
            </View>
            {showYourAnswer && (
              <Text style={[styles.answerBoxText, isCorrect ? styles.answerTextCorrect : styles.answerTextIncorrect]}>
                {formatAnswer(userAnswer)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Correct Answer - Collapsible */}
          <TouchableOpacity
            style={[styles.answerBox, styles.answerBoxCorrectAnswer]}
            onPress={() => setShowCorrectAnswer(!showCorrectAnswer)}
            activeOpacity={0.7}>
            <View style={styles.answerBoxHeader}>
              <Text style={styles.answerBoxIcon}>✓</Text>
              <Text style={styles.answerBoxLabel}>Correct Answer:</Text>
              <TouchableOpacity
                onPress={() => setShowCorrectAnswer(!showCorrectAnswer)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.expandIcon}>{showCorrectAnswer ? '▼' : '▶'}</Text>
              </TouchableOpacity>
            </View>
            {showCorrectAnswer && (
              <Text style={[styles.answerBoxText, styles.answerTextCorrect]}>
                {formatAnswer(correctAnswer)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <View style={styles.explanationContainer}>
              <View style={styles.explanationHeader}>
                <Text style={styles.explanationIcon}>💡</Text>
                <Text style={styles.explanationLabel}>Explanation:</Text>
              </View>
              <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            </View>
          )}

          {/* Question Number List - Replace Previous/Next */}
          <View style={styles.questionNumberListContainer}>
            <Text style={styles.questionListTitle}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.questionNumberList}
              style={styles.questionNumberListScroll}>
              {quizData.questions.map((question, index) => {
                const status = getQuestionStatus(question._id);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <TouchableOpacity
                    key={question._id || index}
                    style={[
                      styles.questionNumberButton,
                      isCurrent && styles.questionNumberButtonCurrent,
                      status === 'correct' && !isCurrent && styles.questionNumberButtonCorrect,
                      status === 'incorrect' && !isCurrent && styles.questionNumberButtonIncorrect,
                      status === 'unanswered' && !isCurrent && styles.questionNumberButtonUnanswered,
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(index);
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.questionNumberButtonText,
                        isCurrent && styles.questionNumberButtonTextCurrent,
                        status === 'correct' && !isCurrent && styles.questionNumberButtonTextCorrect,
                        status === 'incorrect' && !isCurrent && styles.questionNumberButtonTextIncorrect,
                      ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Questions</Text>
            <Text style={styles.statsValue}>{totalQuestions}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Correct</Text>
            <Text style={[styles.statsValue, styles.statsValueCorrect]}>{correctAnswers}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Incorrect</Text>
            <Text style={[styles.statsValue, styles.statsValueIncorrect]}>{incorrectAnswers}</Text>
          </View>
          {unansweredQuestions > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Unanswered</Text>
              <Text style={styles.statsValue}>{unansweredQuestions}</Text>
            </View>
          )}
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Passing Score</Text>
            <Text style={styles.statsValue}>{quizData.passingScore}%</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Your Score</Text>
            <Text style={[styles.statsValue, passed ? styles.statsValueCorrect : styles.statsValueIncorrect]}>
              {percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={handleRetakeQuiz}
          activeOpacity={0.8}>
          <Text style={styles.retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButtonAction}
          onPress={() => navigation.navigate('CourseDetail', { course: { _id: courseId } })}
          activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Back to Course</Text>
        </TouchableOpacity>
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
  navigatorToggle: {
    padding: 8,
  },
  navigatorToggleText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  // Summary Cards
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: COLORS.white,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  passedIcon: {
    backgroundColor: COLORS.success + '20',
  },
  failedIcon: {
    backgroundColor: COLORS.error + '20',
  },
  correctIcon: {
    backgroundColor: COLORS.success + '20',
  },
  scoreIcon: {
    backgroundColor: COLORS.primary + '20',
  },
  timeIcon: {
    backgroundColor: COLORS.textSecondary + '20',
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryIconPassed: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  summaryIconFailed: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  summaryIconScore: {
    fontSize: 24,
  },
  summaryIconCorrect: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  summaryIconTime: {
    fontSize: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  passedText: {
    color: COLORS.success,
  },
  failedText: {
    color: COLORS.error,
  },
  correctText: {
    color: COLORS.success,
  },
  timeText: {
    color: COLORS.textSecondary,
  },
  // Feedback
  feedbackContainer: {
    backgroundColor: COLORS.backgroundLight,
    padding: 16,
    margin: 12,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  // Navigator
  navigatorContainer: {
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigatorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  navigatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  navigatorButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
  },
  navigatorButtonCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navigatorButtonCorrect: {
    backgroundColor: COLORS.success + '30',
    borderColor: COLORS.success,
  },
  navigatorButtonIncorrect: {
    backgroundColor: COLORS.error + '30',
    borderColor: COLORS.error,
  },
  navigatorButtonUnanswered: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  navigatorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  navigatorButtonTextCurrent: {
    color: COLORS.white,
  },
  navigatorButtonTextCorrect: {
    color: COLORS.success,
  },
  navigatorButtonTextIncorrect: {
    color: COLORS.error,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendCurrent: {
    backgroundColor: COLORS.primary,
  },
  legendCorrect: {
    backgroundColor: COLORS.success,
  },
  legendIncorrect: {
    backgroundColor: COLORS.error,
  },
  legendUnanswered: {
    backgroundColor: COLORS.borderLight,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Question Display
  questionContainer: {
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionHeaderLeft: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  questionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionTypeBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  questionTypeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  questionPointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointsCorrect: {
    backgroundColor: COLORS.success + '20',
  },
  pointsIncorrect: {
    backgroundColor: COLORS.error + '20',
  },
  questionPointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionStatusIcon: {
    marginLeft: 8,
  },
  correctIcon: {
    fontSize: 24,
    color: COLORS.success,
  },
  incorrectIcon: {
    fontSize: 24,
    color: COLORS.error,
  },
  questionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    lineHeight: 24,
  },
  answerBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  answerBoxCorrect: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success,
  },
  answerBoxIncorrect: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error,
  },
  answerBoxCorrectAnswer: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success,
  },
  answerBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  answerBoxIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  answerBoxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  answerBoxText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  answerTextCorrect: {
    color: COLORS.success,
    fontWeight: '600',
  },
  answerTextIncorrect: {
    color: COLORS.error,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  questionNumberListContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  questionListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  questionNumberListScroll: {
    maxHeight: 60,
  },
  questionNumberList: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  questionNumberButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  questionNumberButtonCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  questionNumberButtonCorrect: {
    backgroundColor: COLORS.success + '30',
    borderColor: COLORS.success,
  },
  questionNumberButtonIncorrect: {
    backgroundColor: COLORS.error + '30',
    borderColor: COLORS.error,
  },
  questionNumberButtonUnanswered: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  questionNumberButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  questionNumberButtonTextCurrent: {
    color: COLORS.white,
  },
  questionNumberButtonTextCorrect: {
    color: COLORS.success,
  },
  questionNumberButtonTextIncorrect: {
    color: COLORS.error,
  },
  // Stats
  statsContainer: {
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsValueCorrect: {
    color: COLORS.success,
  },
  statsValueIncorrect: {
    color: COLORS.error,
  },
  statsDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
  },
  // Actions
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundLight,
    gap: 12,
  },
  retakeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonAction: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default QuizResultsScreen;
