import api from './api';

/**
 * Get all active courses
 * Backend endpoint: GET /api/public/courses (filters by ACTIVE state automatically)
 */
export const getActiveCourses = async () => {
  try {
    const response = await api.get('/api/public/courses');
    // Backend returns array directly, wrap in data property for consistency
    return { data: response.data };
  } catch (error) {
    console.error('Get active courses error:', error);
    throw error;
  }
};

/**
 * Get course by ID with full details including modules and lessons
 * Backend endpoint: GET /api/courses/:courseId
 * Returns: Course with modules.lessons array
 */
export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/api/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Get course by ID error:', error);
    throw error;
  }
};

/**
 * Get course content (modules and lessons)
 * This is the same as getCourseById but with explicit naming
 * Backend endpoint: GET /api/courses/:courseId
 */
export const getCourseContent = async (courseId) => {
  try {
    console.log('🌐 API: Calling GET /api/courses/' + courseId);
    const response = await api.get(`/api/courses/${courseId}`);
    console.log('🌐 API: Response received, status:', response.status);
    console.log('🌐 API: Course title:', response.data?.title);
    // Backend returns course with modules.lessons structure
    // Structure: course.modules[].lessons[]
    return response.data;
  } catch (error) {
    console.error('🌐 API: Get course content error:', error);
    console.error('🌐 API: Error status:', error.response?.status);
    console.error('🌐 API: Error data:', error.response?.data);
    throw error;
  }
};
