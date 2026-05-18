import {BASE_URL, CURRENT_ENV} from '../config/env';

/**
 * Image host for course/upload assets (prod CDN/API on same domain as API in uat/prod).
 * In dev, API is localhost but images live on production.
 */
const getImageBaseUrl = () => {
  if (CURRENT_ENV === 'dev') {
    return 'https://medhome.courses';
  }
  return BASE_URL;
};

/**
 * Converts an image path to a full URL for React Native Image component
 * Handles various path formats and ensures it's a valid absolute URL
 *
 * Handles DB paths like:
 * - "uploads/course-images/..." -> converts to "{base}/api/uploads/course-images/..."
 * - "/uploads/course-images/..." -> converts to "{base}/api/uploads/course-images/..."
 * - Already full URLs are returned as-is
 */
export const getImageUrl = imagePath => {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  let cleanPath = imagePath;
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  } else if (cleanPath.startsWith('/uploads/')) {
    cleanPath = cleanPath.replace('/uploads/', '');
  }

  cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

  return `${getImageBaseUrl()}/api/uploads/${cleanPath}`;
};
