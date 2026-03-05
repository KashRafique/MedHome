import { Request, Response, NextFunction } from 'express';
import { Quiz } from '../models/Quiz';
import { Question } from '../models/Question';
import { QuizAttempt } from '../models/QuizAttempt';
import multer from 'multer';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/question-images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for image uploads
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .png, and .gif formats allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Quiz CRUD Operations
const createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { courseId, lessonId, title, description, passingScore, maxAttempts, timeLimit, shuffleQuestions, showCorrectAnswers, allowReview } = req.body;
    
    // Validate required fields
    if (!courseId || !title || !passingScore) {
      res.status(400).json({ message: 'Course ID, title, and passing score are required' });
      return;
    }

    const quizData = {
      course: courseId,
      lesson: lessonId && lessonId.trim() !== '' ? lessonId : undefined, // Only set if not empty
      title,
      description,
      passingScore,
      maxAttempts: maxAttempts || 1,
      timeLimit,
      shuffleQuestions: shuffleQuestions || false,
      showCorrectAnswers: showCorrectAnswers || false,
      allowReview: allowReview !== false, // Default to true
      isActive: true
    };
    
    console.log('Creating quiz with data:', quizData);
    
    const quiz = await Quiz.create(quizData);

    // Populate course reference
    await quiz.populate('course');

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully'
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating quiz:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating quiz', 
      error: err.message 
    });
  }
};

const getQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course')
      .populate('questions');
    
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting quiz:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error getting quiz', 
      error: err.message 
    });
  }
};

const getAllQuizzes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN && authReq.user.role !== UserRole.INSTRUCTOR) {
    return next(new Error('Unauthorized: Only admins and instructors can view all quizzes'));
  }
  
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const filter: any = {};
    
    if (req.query.courseId) {
      filter.course = req.query.courseId;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get quizzes with pagination
    const quizzes = await Quiz.find(filter)
      .populate('course', 'title')
      .populate('questions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Quiz.countDocuments(filter);
    
    // Transform quizzes to include additional info
    const transformedQuizzes = quizzes.map(quiz => {
      const populatedCourse = quiz.course as any; // Type assertion for populated document
      return {
        _id: quiz._id,
        title: quiz.title,
        course: populatedCourse ? {
          _id: populatedCourse._id,
          title: populatedCourse.title
        } : {
          _id: 'unknown',
          title: 'Course not found'
        },
        lesson: quiz.lesson,
        questionCount: quiz.questions.length,
        isActive: quiz.isActive,
        createdAt: quiz.createdAt,
        totalAttempts: 0, // TODO: Add attempt count
        averageScore: 0 // TODO: Add average score calculation
      };
    });
    
    res.json({
      success: true,
      data: {
        quizzes: transformedQuizzes,
        count: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting all quizzes:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error getting quizzes', 
      error: err.message 
    });
  }
};

const getQuizzesByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.find({ course: courseId, isActive: true })
      .populate('questions')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        quizzes
      },
      message: 'Quizzes retrieved successfully'
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting quizzes by course:', err);
    res.status(500).json({ message: 'Error getting quizzes', error: err.message });
  }
};

const updateQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN && authReq.user.role !== UserRole.INSTRUCTOR) {
    return next(new Error('Unauthorized: Only admins and instructors can update quizzes'));
  }
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('course');
    
    if (!quiz) {
      return next(new Error('Quiz not found'));
    }
    res.json({
      success: true,
      data: quiz,
      message: 'Quiz updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN) {
    return next(new Error('Unauthorized: Only admins can delete quizzes'));
  }
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return next(new Error('Quiz not found'));
    }
    res.json({ 
      success: true,
      message: 'Quiz deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Question Management
const addQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN && authReq.user.role !== UserRole.INSTRUCTOR) {
    return next(new Error('Unauthorized: Only admins and instructors can add questions'));
  }
  try {
    const { quizId } = req.params;
    const { question, type, options, correctAnswer, explanation, points, order } = req.body;
    
    // Validate required fields
    if (!question || !type || !correctAnswer) {
      res.status(400).json({ message: 'Question text, type, and correct answer are required' });
      return;
    }

    const newQuestion = await Question.create({
      quiz: quizId,
      question,
      type,
      options,
      correctAnswer,
      explanation,
      points: points || 1,
      order: order || 0,
      isActive: true
    });

    // Add the question ID to the quiz's questions array
    await Quiz.findByIdAndUpdate(quizId, {
      $push: { questions: newQuestion._id }
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN && authReq.user.role !== UserRole.INSTRUCTOR) {
    return next(new Error('Unauthorized: Only admins and instructors can update questions'));
  }
  try {
    const question = await Question.findByIdAndUpdate(req.params.questionId, req.body, { new: true });
    if (!question) {
      return next(new Error('Question not found'));
    }
    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (authReq.user.role !== UserRole.ADMIN) {
    return next(new Error('Unauthorized: Only admins can delete questions'));
  }
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);
    if (!question) {
      return next(new Error('Question not found'));
    }

    // Remove the question ID from the quiz's questions array
    await Quiz.findByIdAndUpdate(question.quiz, {
      $pull: { questions: question._id }
    });

    res.json({ 
      success: true,
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Quiz Attempt Tracking
const startAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    // Check if user has reached max attempts
    const existingAttempts = await QuizAttempt.countDocuments({ 
      student: authReq.user._id, 
      quiz: quiz._id 
    });

    if (existingAttempts >= quiz.maxAttempts) {
      res.status(400).json({ message: 'Maximum attempts reached for this quiz' });
      return;
    }

    const attempt = await QuizAttempt.create({
      student: authReq.user._id,
      quiz: quiz._id,
      course: quiz.course,
      startedAt: new Date(),
      attemptNumber: existingAttempts + 1,
      score: 0,
      percentage: 0,
      passed: false,
      timeSpent: 0,
      answers: []
    });

    res.status(201).json({
      message: 'Quiz attempt started successfully',
      attempt
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error starting attempt:', err);
    res.status(500).json({ message: 'Error starting attempt', error: err.message });
  }
};

const getAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
          model: 'Question'
        }
      })
      .populate('course')
      .populate('student');
    
    if (!attempt) {
      res.status(404).json({ 
        success: false,
        message: 'Attempt not found' 
      });
      return;
    }

    // Verify the attempt belongs to the user (unless admin/instructor)
    // Handle both ObjectId and populated student object
    const studentObj = attempt.student as any;
    const studentId = studentObj?._id 
      ? studentObj._id.toString() 
      : studentObj.toString();
    const userId = authReq.user._id.toString();
    
    if (authReq.user.role !== UserRole.ADMIN && 
        authReq.user.role !== UserRole.INSTRUCTOR &&
        studentId !== userId) {
      res.status(403).json({ 
        success: false,
        message: 'Unauthorized: This attempt does not belong to you' 
      });
      return;
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting attempt:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error getting attempt', 
      error: err.message 
    });
  }
};

const submitAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const { answers } = req.body;
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    // Verify the attempt belongs to the user
    if (attempt.student.toString() !== authReq.user._id.toString()) {
      res.status(403).json({ message: 'Unauthorized: This attempt does not belong to you' });
      return;
    }

    // Get quiz details for scoring
    const quiz = await Quiz.findById(attempt.quiz).populate('questions');
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;
    const scoredAnswers = [];

    for (const answer of answers) {
      const question = (quiz as any).questions.find((q: any) => q._id.toString() === answer.question);
      if (question) {
        const isCorrect = checkAnswer(question, answer.answer);
        const points = isCorrect ? question.points : 0;
        
        scoredAnswers.push({
          question: answer.question,
          answer: answer.answer,
          isCorrect,
          points,
          timeSpent: answer.timeSpent || 0
        });

        totalScore += points;
        totalPoints += question.points;
      }
    }

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Update attempt
    attempt.answers = scoredAnswers;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.completedAt = new Date();
    attempt.timeSpent = answers.reduce((total: number, ans: any) => total + (ans.timeSpent || 0), 0);

    await attempt.save();

    res.json({
      message: 'Quiz attempt submitted successfully',
      attempt: {
        score: totalScore,
        percentage,
        passed,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error submitting attempt:', err);
    res.status(500).json({ message: 'Error submitting attempt', error: err.message });
  }
};

// Helper function to check if an answer is correct
const checkAnswer = (question: any, userAnswer: any): boolean => {
  if (question.type === 'multiple_choice') {
    return userAnswer === question.correctAnswer;
  } else if (question.type === 'true_false') {
    return userAnswer === question.correctAnswer;
  } else if (question.type === 'fill_blank') {
    return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  } else if (question.type === 'essay') {
    // For essay questions, we might need manual grading
    // For now, return true if answer is not empty
    return userAnswer && userAnswer.trim().length > 0;
  }
  return false;
};

// Analytics Endpoints
const getQuizStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    const stats = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averagePercentage: { $avg: '$percentage' },
          passedCount: { $sum: { $cond: ['$passed', 1, 0] } },
          averageTimeSpent: { $avg: '$timeSpent' }
        }
      }
    ]);

    res.json({
      quiz: quiz.title,
      statistics: stats[0] || {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        passedCount: 0,
        averageTimeSpent: 0
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting quiz statistics:', err);
    res.status(500).json({ message: 'Error getting quiz statistics', error: err.message });
  }
};

// Get all attempts for a quiz by the current user
const getUserAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const { quizId } = req.params;
    
    const attempts = await QuizAttempt.find({
      student: authReq.user._id,
      quiz: quizId
    })
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
          model: 'Question'
        }
      })
      .populate('course')
      .sort({ attemptNumber: -1 }); // Most recent first
    
    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting user attempts:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error getting user attempts', 
      error: err.message 
    });
  }
};

// Check quiz eligibility (if user can take the quiz)
const checkQuizEligibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const { quizId } = req.params;
    
    // Get the quiz
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) {
      res.status(404).json({ 
        success: false,
        message: 'Quiz not found' 
      });
      return;
    }

    // Check if user is enrolled in the course
    const { Enrollment } = await import('../models/Enrollment');
    const enrollment = await Enrollment.findOne({ 
      student: authReq.user._id, 
      course: quiz.course,
      status: 'approved'
    });

    if (!enrollment) {
      res.json({
        success: true,
        data: {
          canTake: false,
          reason: 'You must be enrolled in this course to take the quiz',
          attemptsRemaining: 0,
          maxAttempts: quiz.maxAttempts
        }
      });
      return;
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      res.json({
        success: true,
        data: {
          canTake: false,
          reason: 'This quiz is currently inactive',
          attemptsRemaining: 0,
          maxAttempts: quiz.maxAttempts
        }
      });
      return;
    }

    // Check attempts
    const attemptCount = await QuizAttempt.countDocuments({
      student: authReq.user._id,
      quiz: quizId
    });

    const attemptsRemaining = quiz.maxAttempts - attemptCount;

    if (attemptsRemaining <= 0) {
      res.json({
        success: true,
        data: {
          canTake: false,
          reason: `You have used all ${quiz.maxAttempts} attempts for this quiz`,
          attemptsRemaining: 0,
          maxAttempts: quiz.maxAttempts
        }
      });
      return;
    }

    // User can take the quiz
    res.json({
      success: true,
      data: {
        canTake: true,
        attemptsRemaining,
        maxAttempts: quiz.maxAttempts
      }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error checking quiz eligibility:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error checking quiz eligibility', 
      error: err.message 
    });
  }
};

export const uploadQuestionImage = upload.single('image');

export default {
  createQuiz,
  getQuiz,
  getAllQuizzes,
  getQuizzesByCourse,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  startAttempt,
  getAttempt,
  submitAttempt,
  getUserAttempts,
  getQuizStatistics,
  checkQuizEligibility
};
