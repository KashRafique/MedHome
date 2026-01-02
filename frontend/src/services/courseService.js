import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/env';

// ============================================
// EXISTING FUNCTIONS (Preserved)
// ============================================

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

// ============================================
// VIDEO-RELATED FUNCTIONS (New)
// ============================================

// Enhanced API integration with retry logic and error recovery
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Utility: Wait for specified milliseconds
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility: Retry a function with exponential backoff
 */
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    console.log(`🔄 Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    await wait(delay);
    
    return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
  }
};

/**
 * Utility: Fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
};

/**
 * Get auth token from storage
 */
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token;
};

/**
 * Get course details with lessons
 * 🔄 WITH RETRY LOGIC
 */
export const getCourseDetails = async (courseId) => {
  return retryWithBackoff(async () => {
    try {
      const token = await getAuthToken();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/courses/${courseId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch course');
      }
      return {success: true, data};
    } catch (error) {
      console.error('Get course error:', error);
      
      // Don't retry on auth errors (401, 403)
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          requiresAuth: true,
        };
      }
      
      throw error; // Will trigger retry
    }
  }).catch(error => ({
    success: false,
    message: error.message || 'Failed to fetch course details',
    isNetworkError: true,
  }));
};

/**
 * Get lesson details
 * 🔄 WITH RETRY LOGIC
 */
export const getLessonDetails = async (courseId, lessonId) => {
  return retryWithBackoff(async () => {
    try {
      const token = await getAuthToken();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lesson');
      }
      return {success: true, data};
    } catch (error) {
      console.error('Get lesson error:', error);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          success: false,
          message: 'Authentication required',
          requiresAuth: true,
        };
      }
      
      throw error;
    }
  }).catch(error => ({
    success: false,
    message: error.message || 'Failed to fetch lesson details',
    isNetworkError: true,
  }));
};

/**
 * Update video progress with queue system
 * 🔄 WITH RETRY LOGIC & QUEUE
 */
let progressQueue = [];
let isProcessingQueue = false;

export const updateVideoProgress = async (
  courseId,
  lessonId,
  progressData,
) => {
  // Add to queue instead of making immediate request
  progressQueue.push({courseId, lessonId, progressData});
  
  if (!isProcessingQueue) {
    processProgressQueue();
  }
  
  return {success: true, queued: true};
};

/**
 * Process queued progress updates
 */
const processProgressQueue = async () => {
  if (isProcessingQueue || progressQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (progressQueue.length > 0) {
    const item = progressQueue.shift();
    
    try {
      await retryWithBackoff(async () => {
        const token = await getAuthToken();
        
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/courses/${item.courseId}/lessons/${item.lessonId}/progress`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentTime: item.progressData.currentTime,
              duration: item.progressData.duration,
              progressPercent: item.progressData.progressPercent,
              completed: item.progressData.completed,
              lastUpdated: new Date().toISOString(),
            }),
          },
        );
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update progress');
        }
        console.log('✅ Progress saved to backend');
        return {success: true, data};
      });
    } catch (error) {
      console.error('❌ Failed to save progress after retries:', error);
      
      // Re-queue if it's a network error
      if (error.message.includes('timeout') || error.message.includes('network')) {
        console.log('📥 Re-queuing progress update');
        progressQueue.push(item);
      }
    }
    
    // Small delay between requests
    await wait(500);
  }
  
  isProcessingQueue = false;
};

/**
 * Mark lesson as completed
 * 🔄 WITH RETRY LOGIC
 */
export const markLessonCompleted = async (courseId, lessonId) => {
  return retryWithBackoff(async () => {
    try {
      const token = await getAuthToken();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            completedAt: new Date().toISOString(),
          }),
        },
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as completed');
      }
      return {success: true, data};
    } catch (error) {
      console.error('Mark completed error:', error);
      throw error;
    }
  }).catch(error => ({
    success: false,
    message: error.message || 'Failed to mark lesson as completed',
    isNetworkError: true,
  }));
};

/**
 * Get user's video progress for a course
 * 🔄 WITH RETRY LOGIC
 */
export const getUserCourseProgress = async (courseId) => {
  return retryWithBackoff(async () => {
    try {
      const token = await getAuthToken();
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/courses/${courseId}/progress`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch progress');
      }
      return {success: true, data};
    } catch (error) {
      console.error('Get progress error:', error);
      throw error;
    }
  }).catch(error => ({
    success: false,
    message: error.message || 'Failed to fetch progress',
    isNetworkError: true,
  }));
};

/**
 * Force flush progress queue (call before app closes)
 */
export const flushProgressQueue = async () => {
  if (progressQueue.length > 0) {
    console.log(`📤 Flushing ${progressQueue.length} queued progress updates`);
    await processProgressQueue();
  }
};

// ============================================
// ERROR RECOVERY HELPERS
// ============================================

/**
 * Check if error requires user action
 */
export const requiresUserAction = (result) => {
  return result.requiresAuth || false;
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (result) => {
  return result.isNetworkError || false;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (result) => {
  if (result.requiresAuth) {
    return '🔒 Please log in again to continue';
  }
  
  if (result.isNetworkError) {
    return '📡 Connection issue. Please check your internet and try again.';
  }
  
  return result.message || 'Something went wrong. Please try again.';
};

/**
 * Example: Fetch course and navigate to video
 */
export const openVideoLesson = async (
  courseId,
  lessonId,
  navigation,
  showAlert,
) => {
  try {
    // Get course details with retry
    const courseResult = await getCourseDetails(courseId);
    
    if (!courseResult.success) {
      if (requiresUserAction(courseResult)) {
        showAlert('Authentication Required', courseResult.message, [
          {text: 'Login', onPress: () => navigation.navigate('Login')},
        ]);
        return;
      }
      
      if (isNetworkError(courseResult)) {
        showAlert(
          'Connection Error',
          getUserFriendlyError(courseResult),
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Retry', onPress: () => openVideoLesson(courseId, lessonId, navigation, showAlert)},
          ],
        );
        return;
      }
      
      showAlert('Error', courseResult.message);
      return;
    }

    // Find the lesson
    let lesson = null;
    for (const module of courseResult.data.modules) {
      lesson = module.lessons.find(l => l._id === lessonId);
      if (lesson) break;
    }

    if (!lesson) {
      showAlert('Error', 'Lesson not found');
      return;
    }

    if (!lesson.videoId) {
      showAlert('Error', 'Video not available for this lesson');
      return;
    }

    // Navigate to video player
    navigation.navigate('VideoPlayer', {
      lesson: lesson,
      courseId: courseId,
      courseTitle: courseResult.data.title,
    });
  } catch (error) {
    console.error('Error opening video:', error);
    showAlert('Error', 'Failed to open video. Please try again.');
  }
};
