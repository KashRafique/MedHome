import express, { Request, Response, NextFunction } from 'express';
import quizController from '../controllers/quizController';
import { uploadQuestionImage } from '../controllers/quizController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Type the request handlers properly
const createQuizHandler = (req: Request, res: Response, next: NextFunction) => quizController.createQuiz(req, res, next);
const getQuizHandler = (req: Request, res: Response, next: NextFunction) => quizController.getQuiz(req, res, next);
const getAllQuizzesHandler = (req: Request, res: Response, next: NextFunction) => quizController.getAllQuizzes(req, res, next);
const getQuizzesByCourseHandler = (req: Request, res: Response, next: NextFunction) => quizController.getQuizzesByCourse(req, res, next);
const updateQuizHandler = (req: Request, res: Response, next: NextFunction) => quizController.updateQuiz(req, res, next);
const deleteQuizHandler = (req: Request, res: Response, next: NextFunction) => quizController.deleteQuiz(req, res, next);

const addQuestionHandler = (req: Request, res: Response, next: NextFunction) => quizController.addQuestion(req, res, next);
const updateQuestionHandler = (req: Request, res: Response, next: NextFunction) => quizController.updateQuestion(req, res, next);
const deleteQuestionHandler = (req: Request, res: Response, next: NextFunction) => quizController.deleteQuestion(req, res, next);

const startAttemptHandler = (req: Request, res: Response, next: NextFunction) => quizController.startAttempt(req, res, next);
const getAttemptHandler = (req: Request, res: Response, next: NextFunction) => quizController.getAttempt(req, res, next);
const submitAttemptHandler = (req: Request, res: Response, next: NextFunction) => quizController.submitAttempt(req, res, next);
const getUserAttemptsHandler = (req: Request, res: Response, next: NextFunction) => quizController.getUserAttempts(req, res, next);

const getQuizStatisticsHandler = (req: Request, res: Response, next: NextFunction) => quizController.getQuizStatistics(req, res, next);
const checkQuizEligibilityHandler = (req: Request, res: Response, next: NextFunction) => quizController.checkQuizEligibility(req, res, next);

// Course-specific Quiz Routes (must come before /:id routes)
router.post('/courses/:courseId', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.INSTRUCTOR), createQuizHandler);
router.get('/courses/:courseId/quizzes', authenticateToken, getQuizzesByCourseHandler); // Get all quizzes for a course

// Get all quizzes (with pagination and filters) - must come before /:id routes
router.get('/', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.INSTRUCTOR), getAllQuizzesHandler);

// Analytics Routes - MUST come before /:id route (more specific routes first)
router.get('/:quizId/eligibility', authenticateToken, checkQuizEligibilityHandler);
router.get('/:quizId/statistics', authenticateToken, getQuizStatisticsHandler);

// Attempt Routes - MUST come before /:id route (more specific routes first)
router.post('/:quizId/attempts', authenticateToken, startAttemptHandler);
router.get('/:quizId/attempts', authenticateToken, getUserAttemptsHandler);
router.get('/attempts/:attemptId', authenticateToken, getAttemptHandler);
router.put('/attempts/:attemptId', authenticateToken, submitAttemptHandler);

// Question Routes - MUST come before /:id route (more specific routes first)
router.post('/:quizId/questions', authenticateToken, uploadQuestionImage, addQuestionHandler);
router.put('/:quizId/questions/:questionId', authenticateToken, updateQuestionHandler);
router.delete('/:quizId/questions/:questionId', authenticateToken, deleteQuestionHandler);

// Individual Quiz Routes - Generic routes must come LAST
router.get('/:id', authenticateToken, getQuizHandler);
router.put('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.INSTRUCTOR), updateQuizHandler);
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), deleteQuizHandler);

export default router;
