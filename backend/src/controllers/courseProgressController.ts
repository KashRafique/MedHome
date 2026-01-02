import { Request, Response } from 'express';
import { CourseProgress } from '../models/CourseProgress';
import mongoose from 'mongoose';

/**
 * Get progress for a specific course
 * GET /api/courses/:courseId/progress
 */
export const getCourseProgress = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        let progress = await CourseProgress.findOne({
            student: userId,
            course: courseId
        });

        if (!progress) {
            // Return empty progress structure if none exists
            res.status(200).json({
                success: true,
                data: {
                    lessons: [],
                    completedLessons: [],
                    lastWatchedLesson: null
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                lessons: progress.lessonProgress,
                completedLessons: progress.completedLessons,
                lastWatchedLesson: progress.lastWatchedLesson
            }
        });

    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ message: 'Failed to fetch course progress' });
    }
};

/**
 * Update progress for a specific lesson
 * POST /api/courses/:courseId/lessons/:lessonId/progress
 */
export const updateLessonProgress = async (req: Request, res: Response) => {
    try {
        const { courseId, lessonId } = req.params;
        const { currentTime, duration, progressPercent, completed } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        // Find or create progress document
        let progress = await CourseProgress.findOne({
            student: userId,
            course: courseId
        });

        if (!progress) {
            progress = new CourseProgress({
                student: userId,
                course: courseId,
                startedAt: new Date(),
                completedLessons: [],
                lessonProgress: []
            });
        }

        // Update last active
        progress.lastActiveAt = new Date();
        progress.lastWatchedLesson = lessonId;

        // Find existing lesson progress
        const lessonIndex = progress.lessonProgress.findIndex(
            l => l.lessonId === lessonId
        );

        const lessonUpdate = {
            lessonId,
            currentTime: currentTime || 0,
            duration: duration || 0,
            progressPercent: progressPercent || 0,
            completed: completed || false,
            lastUpdated: new Date()
        };

        if (lessonIndex > -1) {
            // Update existing
            progress.lessonProgress[lessonIndex] = {
                ...progress.lessonProgress[lessonIndex],
                ...lessonUpdate,
                // Only mark completed if it was already completed OR new status is completed
                completed: progress.lessonProgress[lessonIndex].completed || completed
            };
        } else {
            // Add new
            progress.lessonProgress.push(lessonUpdate);
        }

        // If completed, add to completedLessons array if not already there
        if (completed) {
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }
        }

        await progress.save();

        res.status(200).json({
            success: true,
            message: 'Progress updated',
            data: lessonUpdate
        });

    } catch (error) {
        console.error('Update lesson progress error:', error);
        res.status(500).json({ message: 'Failed to update progress' });
    }
};

/**
 * Mark a lesson as fully completed
 * POST /api/courses/:courseId/lessons/:lessonId/complete
 */
export const markLessonComplete = async (req: Request, res: Response) => {
    try {
        const { courseId, lessonId } = req.params;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        let progress = await CourseProgress.findOne({
            student: userId,
            course: courseId
        });

        if (!progress) {
            progress = new CourseProgress({
                student: userId,
                course: courseId,
                startedAt: new Date(),
                completedLessons: [],
                lessonProgress: []
            });
        }

        // Add to completed list
        if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
        }

        // Update lesson progress entry if it exists, otherwise create it
        const lessonIndex = progress.lessonProgress.findIndex(
            l => l.lessonId === lessonId
        );

        if (lessonIndex > -1) {
            progress.lessonProgress[lessonIndex].completed = true;
            progress.lessonProgress[lessonIndex].progressPercent = 100;
            progress.lessonProgress[lessonIndex].lastUpdated = new Date();
        } else {
            progress.lessonProgress.push({
                lessonId,
                currentTime: 0,
                duration: 0, // Unknown if just marking complete
                progressPercent: 100,
                completed: true,
                lastUpdated: new Date()
            });
        }

        progress.lastActiveAt = new Date();
        await progress.save();

        res.status(200).json({
            success: true,
            message: 'Lesson marked as completed',
            data: { lessonId, completed: true }
        });

    } catch (error) {
        console.error('Mark lesson complete error:', error);
        res.status(500).json({ message: 'Failed to mark lesson as completed' });
    }
};
