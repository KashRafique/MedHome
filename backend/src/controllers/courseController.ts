import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { Course, CourseState, ICourseData, IModuleData, IModuleDocument, ICourseDocument } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';
import { validateCourse, validateModule, validateCourseStateUpdate, validateCourseActivation } from '../validators/courseValidator';
import fs from 'fs';
import path from 'path';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

interface PopulatedCreatedBy {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
}

interface CourseWithPopulatedFields extends Omit<ICourseDocument, 'createdBy'> {
  createdBy: PopulatedCreatedBy;
}

// Get all courses (admin only) or active courses for regular users
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    
    // Filter by state if provided (e.g., ?state=ACTIVE)
    // If state=ACTIVE is provided, only show active courses to users
    if (req.query.state) {
      filter.state = req.query.state;
    } else {
      // If no state filter is provided, check if user is admin
      // Non-admin users should only see active courses by default
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role === 'admin';
      if (!isAdmin) {
        // Regular users only see active courses
        filter.state = CourseState.ACTIVE;
      }
      // Admins see all courses when no state filter is provided
    }
    
    if (req.query.category) {
      filter.categories = req.query.category;
    }
    
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    const courses = await Course.find(filter)
      .populate('createdBy', 'fullName email') // Populate createdBy with fullName and email fields
      .populate('categories')
      .populate('tags')
      .sort({ createdAt: -1 }).lean();

    // Get enrollment counts for each course
    const coursesWithEnrollment = await Promise.all(courses.map(async (course) => {
      const enrollmentCount = await mongoose.model('Enrollment').countDocuments({ course: course._id });
      
      return {
        _id: course._id,
        title: course.title,
        status: course.state,
        thumbnail: course.thumbnail,
        description: course.description,
        price: course.price,
        state: course.state,
        instructor: course.createdBy ? {
          _id: course.createdBy._id,
          fullName: (course.createdBy as any).fullName // Use type assertion since we've populated the field
        } : null,
        enrolledCount: enrollmentCount
      };
    }));

    res.json(coursesWithEnrollment);
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

// Get public courses
export const getPublicCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = { state: CourseState.ACTIVE };
    
    if (req.query.category) {
      filter.categories = req.query.category;
    }
    
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    const courses = await Course.find(filter)
      .select('title description price thumbnail categories tags')
      .populate('categories')
      .populate('tags').lean();

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

// Get course details
export const getCourseDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    console.log('🔍 Fetching course details for ID:', courseId);
    console.log('👤 User:', (req as AuthRequest).user?._id);
    console.log('👤 User Role:', (req as AuthRequest).user?.role);
    
    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('❌ Invalid course ID format:', courseId);
      res.status(400).json({ message: 'Invalid course ID format' });
      return;
    }

    console.log('✅ Course ID format valid, querying database...');
    
    // Fetch course with populated modules and lessons
    const course = await Course.findById(courseId)
      .populate({
        path: 'createdBy',
        select: 'fullName email'
      })
      .populate({
        path: 'modules',
        select: 'title description order',
        populate: {
          path: 'lessons',
          select: 'title description order duration isPreview video videoSource pdfUrl ebookName'
        }
      })
      .populate('categories')
      .populate('tags')
      .lean();
      
    if (!course) {
      console.log('❌ Course not found in database:', courseId);
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    console.log('✅ Course found:', course.title);
    console.log('📦 State:', course.state);
    console.log('📦 Modules count:', course.modules?.length || 0);
    if (course.modules && course.modules.length > 0) {
      console.log('📦 First module lessons:', course.modules[0].lessons?.length || 0);
    }

    // Check if user is admin (through auth middleware)
    const isAdmin = (req as AuthRequest).user?.role === 'admin';
    console.log('🔑 Is admin:', isAdmin);

    // If course is not active and user is not admin, don't show details
    if (course.state !== CourseState.ACTIVE && !isAdmin) {
      console.log('⚠️  Course not active and user is not admin');
      res.status(403).json({ message: 'Course is not available' });
      return;
    }

    // Check if user is enrolled and get enrollment status
    let enrollmentStatus = null;
    let isEnrolled = false;
    if ((req as AuthRequest).user) {
      const enrollment = await Enrollment.findOne({
        student: (req as AuthRequest).user!._id,
        course: courseId
      }).select('status');
      
      if (enrollment) {
        enrollmentStatus = enrollment.status;
        isEnrolled = true;
        console.log('✅ User enrollment found, status:', enrollmentStatus);
      } else {
        console.log('ℹ️  User not enrolled in this course');
      }
    }

    // Format response with enrollment status and lesson accessibility
    const response = {
      ...course,
      enrollmentStatus,
      enrolled: isEnrolled,
      modules: course.modules?.map((module: any) => ({
        ...module,
        lessons: module.lessons?.map((lesson: any) => ({
          ...lesson,
          isAccessible: lesson.isPreview || enrollmentStatus === 'approved' || isAdmin
        }))
      }))
    };

    console.log('✅ Sending course data to client with enrollment status:', enrollmentStatus);
    res.json(response);
  } catch (error) {
    console.error('❌ ERROR in getCourseDetails:', error);
    console.error('📍 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('📍 Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('📍 Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    res.status(500).json({ 
      message: 'Error fetching course details',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown'
    });
  }
};

// Create a new course (admin or instructor)
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user?._id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const courseData: ICourseData = {
      title: req.body.title,
      description: req.body.description,
      price: parseFloat(req.body.price),
      state: CourseState.DRAFT,
      createdBy: authReq.user._id,
      modules: [],
      noticeBoard: [],
      enrollmentCount: 0,
      categories: req.body.categories || [],
      tags: req.body.tags || []
    };

    const { error } = validateCourse(courseData);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    // Handle file uploads if present
    if (req.files) {
      const files = req.files as MulterFiles;
      
      if (files.thumbnail) {
        courseData.thumbnail = files.thumbnail[0].path;
      }
      if (files.banner) {
        courseData.banner = files.banner[0].path;
      }
    }

    const course = new Course(courseData);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course' });
  }
};

// Update course state (admin only)
export const updateCourseState = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { state } = req.body;
    const { error } = validateCourseStateUpdate({ state });
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Additional validation for activating a course
    if (state === CourseState.ACTIVE) {
      const { error: activationError } = validateCourseActivation(course);
      if (activationError) {
        res.status(400).json({ message: activationError.details[0].message });
        return;
      }
    }

    course.state = state;
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error updating course state' });
  }
};

// Update a course (admin or instructor)
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const updateData: Partial<ICourseData> = {
      title: req.body.title,
      description: req.body.description,
      price: parseFloat(req.body.price),
      state: req.body.state,
    };

    // Update categories and tags if provided
    if (req.body.categories) {
      updateData.categories = req.body.categories;
    }
    
    if (req.body.tags) {
      updateData.tags = req.body.tags;
    }

    // Handle file uploads if present
    if (req.files) {
      const files = req.files as MulterFiles;
      
      if (files.thumbnail?.[0]) {
        updateData.thumbnail = files.thumbnail[0].path;
      }
      if (files.banner?.[0]) {
        updateData.banner = files.banner[0].path;
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('categories')
    .populate('tags').lean();

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course' });
  }
};

// Delete a course (admin only)
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course' });
  }
};

// Add a module to a course (admin or instructor)
export const addModule = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const moduleData: IModuleData = {
      title: req.body.title,
      description: req.body.description,
      order: course.modules.length,
      lessons: []
    };

    const { error } = validateModule(moduleData);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    course.modules.push(moduleData);
    await course.save();
    res.status(201).json(course.modules[course.modules.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding module' });
  }
};

// Update a module (admin or instructor)
export const updateModule = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      res.status(404).json({ message: 'Module not found' });
      return;
    }

    // Create update data object with only the fields we want to update
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
      lessons: req.body.lessons || []
    };

    // Validate the update data
    const { error } = validateModule(updateData);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    // Update module fields
    module.title = updateData.title;
    module.description = updateData.description;
    module.order = updateData.order;
    module.lessons = updateData.lessons;

    await course.save();
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Error updating module' });
  }
};

// Delete a module (admin or instructor)
export const deleteModule = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const moduleIndex = course.modules.findIndex(
      module => module._id.toString() === req.params.moduleId
    );

    if (moduleIndex === -1) {
      res.status(404).json({ message: 'Module not found' });
      return;
    }

    // Remove the module
    course.modules.splice(moduleIndex, 1);
    
    // Update order of remaining modules
    course.modules.forEach((mod, index) => {
      mod.order = index;
    });

    await course.save();
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting module' });
  }
};

// Reorder modules (admin or instructor)
export const reorderModules = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const { moduleId, newOrder } = req.body;
    const moduleIndex = course.modules.findIndex(
      module => module._id.toString() === moduleId
    );

    if (moduleIndex === -1) {
      res.status(404).json({ message: 'Module not found' });
      return;
    }

    if (newOrder < 0 || newOrder >= course.modules.length) {
      res.status(400).json({ message: 'Invalid order position' });
      return;
    }

    // Remove module from current position
    const [module] = course.modules.splice(moduleIndex, 1);
    // Insert at new position
    course.modules.splice(newOrder, 0, module);

    // Update order numbers
    course.modules.forEach((mod, index) => {
      mod.order = index;
    });

    await course.save();
    res.json(course.modules);
  } catch (error) {
    res.status(500).json({ message: 'Error reordering modules' });
  }
};

// Clone a course (admin only)
export const cloneCourse = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const originalCourse = await Course.findById(req.params.courseId)
      .populate('categories')
      .populate('tags')
      .lean();

    if (!originalCourse) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Create a deep copy of the course data
    const clonedCourseData = {
      title: `${originalCourse.title} (Copy)`,
      description: originalCourse.description,
      price: originalCourse.price,
      thumbnail: originalCourse.thumbnail,
      banner: originalCourse.banner,
      state: 'DRAFT', // Always start as draft
      modules: originalCourse.modules.map(module => ({
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: module.lessons.map((lesson: any) => ({
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          duration: lesson.duration,
          video: lesson.video,
          videoSource: lesson.videoSource,
          attachments: lesson.attachments || [],
          isPreview: lesson.isPreview
        }))
      })),
      noticeBoard: originalCourse.noticeBoard || [],
      categories: originalCourse.categories,
      tags: originalCourse.tags,
      createdBy: authReq.user!._id,
      enrollmentCount: 0 // Reset enrollment count for cloned course
    };

    // Validate the cloned course data
    const { error } = validateCourse(clonedCourseData);
    if (error) {
      console.error('Validation error:', error.details);
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    // Create the new course
    const clonedCourse = new Course(clonedCourseData);
    await clonedCourse.save();

    // Populate the response with categories and tags
    await clonedCourse.populate('categories');
    await clonedCourse.populate('tags');

    // Clone quizzes associated with the original course
    await cloneQuizzesForCourse(originalCourse._id.toString(), clonedCourse._id.toString());

    console.log(`Course "${originalCourse.title}" cloned successfully to "${clonedCourse.title}"`);

    res.status(201).json({
      message: 'Course cloned successfully',
      course: clonedCourse
    });
  } catch (error) {
    console.error('Error cloning course:', error);
    res.status(500).json({ message: 'Error cloning course' });
  }
};

// Helper function to clone quizzes for a course
const cloneQuizzesForCourse = async (originalCourseId: string, clonedCourseId: string): Promise<void> => {
  try {
    // Import Quiz and Question models
    const { Quiz } = await import('../models/Quiz');
    const { Question } = await import('../models/Question');

    // Get the original and cloned courses to map lesson IDs
    const originalCourse = await Course.findById(originalCourseId).lean();
    const clonedCourse = await Course.findById(clonedCourseId).lean();

    if (!originalCourse || !clonedCourse) {
      throw new Error('Course not found for lesson mapping');
    }

    // Create a mapping of original lesson IDs to cloned lesson IDs
    const lessonIdMapping = new Map<string, string>();
    
    // Map module and lesson IDs
    for (let moduleIndex = 0; moduleIndex < originalCourse.modules.length; moduleIndex++) {
      const originalModule = originalCourse.modules[moduleIndex];
      const clonedModule = clonedCourse.modules[moduleIndex];
      
      for (let lessonIndex = 0; lessonIndex < originalModule.lessons.length; lessonIndex++) {
        const originalLesson = originalModule.lessons[lessonIndex];
        const clonedLesson = clonedModule.lessons[lessonIndex];
        
        if (originalLesson._id && clonedLesson._id) {
          lessonIdMapping.set(
            originalLesson._id.toString(), 
            clonedLesson._id.toString()
          );
        }
      }
    }

    // Find all quizzes for the original course
    const originalQuizzes = await Quiz.find({ course: originalCourseId }).lean();

    for (const originalQuiz of originalQuizzes) {
      // Map the lesson ID if it exists
      let mappedLessonId = originalQuiz.lesson;
      if (originalQuiz.lesson && lessonIdMapping.has(originalQuiz.lesson.toString())) {
        const mappedId = lessonIdMapping.get(originalQuiz.lesson.toString());
        if (mappedId) {
          mappedLessonId = mappedId as any;
        }
      }

      // Create cloned quiz data
      const clonedQuizData = {
        title: `${originalQuiz.title} (Copy)`,
        description: originalQuiz.description,
        course: clonedCourseId,
        lesson: mappedLessonId, // Use mapped lesson ID
        timeLimit: originalQuiz.timeLimit,
        passingScore: originalQuiz.passingScore,
        maxAttempts: originalQuiz.maxAttempts,
        isActive: originalQuiz.isActive,
        shuffleQuestions: originalQuiz.shuffleQuestions,
        showCorrectAnswers: originalQuiz.showCorrectAnswers,
        allowReview: originalQuiz.allowReview
      };

      // Create the cloned quiz
      const clonedQuiz = new Quiz(clonedQuizData);
      const savedQuiz = await clonedQuiz.save();

      // Clone questions for this quiz
      await cloneQuestionsForQuiz(originalQuiz._id.toString(), savedQuiz._id?.toString() || '');

      console.log(`Quiz "${originalQuiz.title}" cloned successfully`);
    }

    console.log(`All quizzes cloned for course ${originalCourseId} -> ${clonedCourseId}`);
  } catch (error) {
    console.error('Error cloning quizzes:', error);
    throw error;
  }
};

// Helper function to clone questions for a quiz
const cloneQuestionsForQuiz = async (originalQuizId: string, clonedQuizId: string): Promise<void> => {
  try {
    // Import Question model
    const { Question } = await import('../models/Question');

    // Find all questions for the original quiz
    const originalQuestions = await Question.find({ quiz: originalQuizId }).lean();

    for (const originalQuestion of originalQuestions) {
      // Create cloned question data
      const clonedQuestionData = {
        quiz: clonedQuizId,
        question: originalQuestion.question,
        type: originalQuestion.type,
        options: originalQuestion.options,
        correctAnswer: originalQuestion.correctAnswer,
        explanation: originalQuestion.explanation,
        points: originalQuestion.points,
        order: originalQuestion.order,
        isActive: originalQuestion.isActive
      };

      // Create the cloned question
      const clonedQuestion = new Question(clonedQuestionData);
      await clonedQuestion.save();

      console.log(`Question "${originalQuestion.question.substring(0, 50)}..." cloned successfully`);
    }

    console.log(`All questions cloned for quiz ${originalQuizId} -> ${clonedQuizId}`);
  } catch (error) {
    console.error('Error cloning questions:', error);
    throw error;
  }
};

// Get quizzes for a course
export const getCourseQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    
    // Import Quiz model
    const { Quiz } = await import('../models/Quiz');
    
    const quizzes = await Quiz.find({ course: courseId, isActive: true })
      .populate('questions')
      .sort({ createdAt: -1 });

    console.log(`Found ${quizzes.length} quizzes for course ${courseId}:`, 
      quizzes.map(q => ({ id: q._id, title: q.title, lesson: q.lesson, course: q.course }))
    );

    res.json({
      success: true,
      data: {
        quizzes,
        count: quizzes.length
      }
    });
  } catch (error) {
    console.error('Error getting course quizzes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting course quizzes' 
    });
  }
};
