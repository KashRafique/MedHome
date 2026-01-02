import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getCourseProgress,
    updateLessonProgress,
    markLessonComplete
} from '../controllers/courseProgressController';

const router = express.Router({ mergeParams: true });

// Note: These routes are intended to be mounted at /api/courses
// So the full paths will be:
// GET /api/courses/:courseId/progress
// POST /api/courses/:courseId/lessons/:lessonId/progress
// POST /api/courses/:courseId/lessons/:lessonId/complete

router.get('/:courseId/progress', authenticateToken, getCourseProgress);

router.post(
    '/:courseId/lessons/:lessonId/progress',
    authenticateToken,
    updateLessonProgress
);

router.post(
    '/:courseId/lessons/:lessonId/complete',
    authenticateToken,
    markLessonComplete
);

export default router;
