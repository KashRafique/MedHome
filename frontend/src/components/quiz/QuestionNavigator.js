import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/colors';

const QuestionNavigator = ({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  flaggedQuestions,
  onQuestionSelect,
}) => {
  const getQuestionStatus = (index) => {
    if (index === currentQuestionIndex) {
      return 'current';
    }
    if (flaggedQuestions.has(index)) {
      return 'flagged';
    }
    if (answeredQuestions.has(index)) {
      return 'answered';
    }
    return 'unanswered';
  };

  const getQuestionStyle = (status) => {
    switch (status) {
      case 'current':
        return [styles.questionButton, styles.currentQuestion];
      case 'answered':
        return [styles.questionButton, styles.answeredQuestion];
      case 'flagged':
        return [styles.questionButton, styles.flaggedQuestion];
      default:
        return [styles.questionButton, styles.unansweredQuestion];
    }
  };

  const getQuestionTextStyle = (status) => {
    switch (status) {
      case 'current':
        return styles.currentText;
      case 'answered':
        return styles.answeredText;
      case 'flagged':
        return styles.flaggedText;
      default:
        return styles.unansweredText;
    }
  };

  const answeredCount = answeredQuestions.size;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {answeredCount} of {totalQuestions} answered
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.grid}>
          {Array.from({ length: totalQuestions }, (_, index) => {
            const status = getQuestionStatus(index);
            return (
              <TouchableOpacity
                key={index}
                style={getQuestionStyle(status)}
                onPress={() => onQuestionSelect(index)}
                activeOpacity={0.7}>
                <Text style={getQuestionTextStyle(status)}>{index + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Legend right under the question grid */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.currentQuestion]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.answeredQuestion]} />
            <Text style={styles.legendText}>Answered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.unansweredQuestion]} />
            <Text style={styles.legendText}>Unanswered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.flaggedQuestion]} />
            <Text style={styles.legendText}>Flagged</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    backgroundColor: COLORS.white,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderLight,
    paddingVertical: 12,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingBottom: 4,
    justifyContent: 'flex-start',
  },
  questionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
  },
  currentQuestion: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  answeredQuestion: {
    backgroundColor: COLORS.success + '30',
    borderColor: COLORS.success,
  },
  unansweredQuestion: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  flaggedQuestion: {
    backgroundColor: COLORS.warning + '30',
    borderColor: COLORS.warning,
  },
  currentText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  answeredText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  unansweredText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  flaggedText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});

export default QuestionNavigator;
