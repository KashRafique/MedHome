import api from './api';

/**
 * Get quiz by ID with populated questions
 * Backend endpoint: GET /api/quizzes/:id
 */
export const getQuiz = async (quizId) => {
  try {
    const response = await api.get(`/api/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Get quiz error:', error);
    throw error;
  }
};

/**
 * Check quiz eligibility (attempts remaining, enrollment status)
 * Backend endpoint: GET /api/quizzes/:quizId/eligibility
 */
export const checkQuizEligibility = async (quizId) => {
  try {
    const url = `/api/quizzes/${quizId}/eligibility`;
    console.log('🔍 Checking quiz eligibility:', { quizId, url, fullUrl: `${api.defaults.baseURL}${url}` });
    const response = await api.get(url);
    console.log('✅ Eligibility check success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Check quiz eligibility error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Start a new quiz attempt
 * Backend endpoint: POST /api/quizzes/:quizId/attempts
 */
export const startQuizAttempt = async (quizId) => {
  try {
    const response = await api.post(`/api/quizzes/${quizId}/attempts`, {});
    return response.data;
  } catch (error) {
    console.error('Start quiz attempt error:', error);
    throw error;
  }
};

/**
 * Submit quiz attempt with answers
 * Backend endpoint: PUT /api/quizzes/attempts/:attemptId
 * @param {string} attemptId - The quiz attempt ID
 * @param {Object} answers - Object mapping questionId to answer, or array of answer objects
 */
export const submitQuizAttempt = async (attemptId, answers) => {
  try {
    // Normalize answers to array format
    const normalizedAnswers = Array.isArray(answers)
      ? answers
      : Object.entries(answers).map(([questionId, answer]) => ({
          question: questionId,
          answer: answer,
          timeSpent: 0, // Could track time per question in future
        }));

    const response = await api.put(`/api/quizzes/attempts/${attemptId}`, {
      answers: normalizedAnswers,
    });
    return response.data;
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    throw error;
  }
};

/**
 * Get all quizzes for a course
 * Backend endpoint: GET /api/quizzes/courses/:courseId/quizzes
 */
export const getQuizzesByCourse = async (courseId) => {
  try {
    const response = await api.get(`/api/quizzes/courses/${courseId}/quizzes`);
    // Backend returns: { success: true, data: { quizzes: [...], count: number } }
    return response.data;
  } catch (error) {
    console.error('Get quizzes by course error:', error);
    throw error;
  }
};

/**
 * Get quiz attempt details
 * Backend endpoint: GET /api/quizzes/attempts/:attemptId
 */
export const getQuizAttempt = async (attemptId) => {
  try {
    const response = await api.get(`/api/quizzes/attempts/${attemptId}`);
    return response.data;
  } catch (error) {
    console.error('Get quiz attempt error:', error);
    throw error;
  }
};

/**
 * Get user's attempts for a quiz
 * Backend endpoint: GET /api/quizzes/:quizId/attempts
 */
export const getUserQuizAttempts = async (quizId) => {
  try {
    const response = await api.get(`/api/quizzes/${quizId}/attempts`);
    return response.data;
  } catch (error) {
    console.error('Get user quiz attempts error:', error);
    throw error;
  }
};