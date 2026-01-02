/**
 * Bunny.net CDN Configuration for Videos & PDFs
 * Storage Zone: a268bf91-e24
 * Library ID: 499688
 * Base URL: https://medhome.b-cdn.net
 * 
 * MERGED VERSION - Zero breaking changes, 100% backward compatible
 */

export const VIDEO_CDN_CONFIG = {
  bunnycdn: {
    // Storage zone
    storageZone: 'a268bf91-e24',
    
    // Library ID for videos
    libraryId: '499688',
    
    // Base CDN URL (for reference, PDFs use full URLs from backend)
    baseCdnUrl: 'https://medhome.b-cdn.net',
    
    // Security: Real production domains
    allowedDomains: [
      'https://uat.medhome.courses',
      'https://medhome.courses',
      'https://www.medhome.courses',
    ],
    
    // ========== VIDEO METHODS (EXISTING - NO CHANGES) ==========
    
    /**
     * Get HLS stream URL (for native video player)
     * EXISTING FUNCTION - UNCHANGED
     * @param {string} videoId - Video ID from Bunny.net
     * @returns {string} HLS stream URL
     */
    getHLSUrl: (videoId) => {
      if (!videoId) {
        console.error('Video ID is required');
        return '';
      }
      return `https://vz-${VIDEO_CDN_CONFIG.bunnycdn.storageZone}.b-cdn.net/${videoId}/playlist.m3u8`;
    },
    
    /**
     * Get secure headers for video requests
     * UPDATED: Better User-Agent for analytics
     * @returns {object} Headers object
     */
    getSecureHeaders: () => {
      return {
        'Referer': VIDEO_CDN_CONFIG.bunnycdn.allowedDomains[0],
        'User-Agent': 'MedHomeMobileApp/1.0',
        'Accept': '*/*',
      };
    },
    
    /**
     * Get video thumbnail URL
     * EXISTING FUNCTION - UNCHANGED
     * @param {string} videoId - Video ID from Bunny.net
     * @returns {string} Thumbnail URL
     */
    getThumbnailUrl: (videoId) => {
      if (!videoId) return '';
      return `https://vz-${VIDEO_CDN_CONFIG.bunnycdn.storageZone}.b-cdn.net/${videoId}/thumbnail.jpg`;
    },
    
    /**
     * Get iframe embed URL (kept for backward compatibility)
     * NOT CURRENTLY USED - but safe to keep
     * @param {string} videoId - Video ID from Bunny.net
     * @returns {string} Complete iframe URL
     */
    getIframeUrl: (videoId) => {
      if (!videoId) {
        console.error('Video ID is required');
        return '';
      }
      return `https://iframe.mediadelivery.net/play/${VIDEO_CDN_CONFIG.bunnycdn.libraryId}/${videoId}`;
    },
    
    /**
     * Get preview GIF URL (kept for backward compatibility)
     * NOT CURRENTLY USED - but safe to keep
     * @param {string} videoId - Video ID from Bunny.net
     * @returns {string} Preview GIF URL
     */
    getPreviewUrl: (videoId) => {
      if (!videoId) return '';
      return `https://vz-${VIDEO_CDN_CONFIG.bunnycdn.storageZone}.b-cdn.net/${videoId}/preview.webp`;
    },
    
    // ========== PDF METHODS (NEW - ADDITIVE ONLY) ==========
    
    /**
     * Validate and return PDF URL
     * Backend provides full HTTPS URL, just validate it
     * @param {string} pdfUrl - Full PDF URL from backend
     * @returns {string} Validated PDF URL or empty string
     */
    getPdfUrl: (pdfUrl) => {
      if (!pdfUrl || typeof pdfUrl !== 'string') {
        console.error('PDF URL is required and must be a string');
        return '';
      }
      
      const trimmedUrl = pdfUrl.trim();
      
      if (!trimmedUrl) {
        console.error('PDF URL cannot be empty');
        return '';
      }
      
      // Validate URL format - must be HTTP/HTTPS
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        console.error('Invalid PDF URL format - must start with http:// or https://:', trimmedUrl);
        return '';
      }
      
      // Optional: Validate URL structure
      try {
        new URL(trimmedUrl);
      } catch (error) {
        console.error('Invalid URL structure:', trimmedUrl, error);
        return '';
      }
      
      return trimmedUrl;
    },
    
    /**
     * Extract filename from PDF URL
     * Uses ebookName if provided, otherwise extracts from URL
     * Handles URL encoding and special characters
     * @param {string} pdfUrl - Full PDF URL
     * @param {string|null} ebookName - Optional custom name from backend
     * @returns {string} Filename with .pdf extension
     */
    extractPdfFileName: (pdfUrl, ebookName = null) => {
      // Use ebookName if provided
      if (ebookName && typeof ebookName === 'string') {
        // Sanitize filename (remove invalid characters)
        const sanitized = ebookName.replace(/[<>:"/\\|?*]/g, '_');
        return sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
      }
      
      // Extract from URL
      if (pdfUrl) {
        try {
          const url = new URL(pdfUrl);
          const pathname = url.pathname;
          let filename = pathname.split('/').pop();
          
          // Decode URL encoding (e.g., %20 -> space, %2F -> /)
          if (filename) {
            filename = decodeURIComponent(filename);
            // Remove query params if any
            filename = filename.split('?')[0].split('#')[0];
            if (filename && filename.length > 0) {
              return filename;
            }
          }
        } catch (error) {
          console.error('Error parsing PDF URL:', error);
        }
      }
      
      // Default fallback
      return 'document.pdf';
    },
    
    /**
     * Get secure headers for PDF downloads
     * @returns {object} Headers object for PDF requests
     */
    getPdfHeaders: () => {
      return {
        'Referer': VIDEO_CDN_CONFIG.bunnycdn.allowedDomains[0],
        'User-Agent': 'MedHomeMobileApp/1.0',
        'Accept': 'application/pdf,*/*',
      };
    },
    
    /**
     * Check if lesson has PDF
     * @param {object} lesson - Lesson object from backend
     * @returns {boolean} True if lesson has valid PDF URL
     */
    hasPdf: (lesson) => {
      return !!(lesson && 
                lesson.pdfUrl && 
                typeof lesson.pdfUrl === 'string' &&
                (lesson.pdfUrl.startsWith('http://') || 
                 lesson.pdfUrl.startsWith('https://')));
    },
    
    /**
     * Check if lesson has video
     * @param {object} lesson - Lesson object from backend
     * @returns {boolean} True if lesson has valid video
     */
    hasVideo: (lesson) => {
      return !!(lesson && 
                lesson.video && 
                lesson.videoSource === 'bunnycdn');
    },
  },
};

// ========== EXISTING EXPORTS (NO CHANGES) ==========

/**
 * Get video URL (defaults to HLS for native playback)
 * EXISTING FUNCTION - UNCHANGED
 * @param {string} videoId - Video ID from backend
 * @returns {string} Video URL
 */
export const getVideoUrl = (videoId) => {
  return VIDEO_CDN_CONFIG.bunnycdn.getHLSUrl(videoId);
};

/**
 * Get video source object with security headers
 * EXISTING FUNCTION - UNCHANGED
 * @param {string} videoId - Video ID from backend
 * @returns {object} Source object for react-native-video
 */
export const getSecureVideoSource = (videoId) => {
  return {
    uri: VIDEO_CDN_CONFIG.bunnycdn.getHLSUrl(videoId),
    headers: VIDEO_CDN_CONFIG.bunnycdn.getSecureHeaders(),
    type: 'm3u8',
  };
};

/**
 * Validate configuration
 * UPDATED: Better validation with domain checks
 * @returns {object} Validation result with warnings
 */
export const validateConfig = () => {
  const hasValidStorageZone = 
    !!VIDEO_CDN_CONFIG.bunnycdn.storageZone &&
    VIDEO_CDN_CONFIG.bunnycdn.storageZone !== 'YOUR_STORAGE_ZONE';
  
  const hasValidLibraryId = 
    !!VIDEO_CDN_CONFIG.bunnycdn.libraryId &&
    VIDEO_CDN_CONFIG.bunnycdn.libraryId !== 'YOUR_LIBRARY_ID';
  
  const hasValidDomains = 
    VIDEO_CDN_CONFIG.bunnycdn.allowedDomains.length > 0 &&
    !VIDEO_CDN_CONFIG.bunnycdn.allowedDomains.some(
      domain => domain.includes('yourdomain.com')
    );
  
  const isValid = hasValidStorageZone && hasValidLibraryId && hasValidDomains;
  
  return {
    bunnycdn: isValid,
    message: isValid ? 'Configuration is valid' : 'Configuration is incomplete',
    warnings: getConfigWarnings(),
  };
};

/**
 * Get configuration warnings
 * Helper function for validateConfig
 * @returns {array} Array of warning messages
 */
const getConfigWarnings = () => {
  const warnings = [];
  
  // Check if using placeholder domains
  const hasPlaceholder = VIDEO_CDN_CONFIG.bunnycdn.allowedDomains.some(
    domain => domain.includes('yourdomain.com')
  );
  
  if (hasPlaceholder) {
    warnings.push('⚠️ Update allowedDomains with your actual domains');
  }
  
  // Check if storage zone is placeholder
  if (VIDEO_CDN_CONFIG.bunnycdn.storageZone === 'YOUR_STORAGE_ZONE') {
    warnings.push('⚠️ Update storageZone with your actual Bunny.net storage zone');
  }
  
  // Check if library ID is placeholder
  if (VIDEO_CDN_CONFIG.bunnycdn.libraryId === 'YOUR_LIBRARY_ID') {
    warnings.push('⚠️ Update libraryId with your actual Bunny.net library ID');
  }
  
  return warnings;
};

// ========== NEW EXPORTS (ADDITIVE ONLY) ==========

/**
 * Get PDF URL (validated)
 * NEW EXPORT - Helper function for easy access
 * @param {string} pdfUrl - Full PDF URL from backend
 * @returns {string} Validated PDF URL or empty string
 */
export const getPdfUrl = (pdfUrl) => {
  return VIDEO_CDN_CONFIG.bunnycdn.getPdfUrl(pdfUrl);
};

/**
 * Extract PDF filename from URL or use ebookName
 * NEW EXPORT - Helper function for easy access
 * @param {string} pdfUrl - Full PDF URL
 * @param {string|null} ebookName - Optional custom name from backend
 * @returns {string} Filename with .pdf extension
 */
export const extractPdfFileName = (pdfUrl, ebookName = null) => {
  return VIDEO_CDN_CONFIG.bunnycdn.extractPdfFileName(pdfUrl, ebookName);
};

/**
 * Get PDF download configuration with headers
 * NEW EXPORT
 * @param {string} pdfUrl - Full PDF URL from backend
 * @returns {object} Download config with URL and headers
 */
export const getSecurePdfDownload = (pdfUrl) => {
  return {
    url: VIDEO_CDN_CONFIG.bunnycdn.getPdfUrl(pdfUrl),
    headers: VIDEO_CDN_CONFIG.bunnycdn.getPdfHeaders(),
  };
};

/**
 * Get lesson content type
 * Returns: 'video', 'pdf', 'both', or null
 * NEW EXPORT
 * @param {object} lesson - Lesson object from backend
 * @returns {string|null} Content type or null if neither
 */
export const getLessonContentType = (lesson) => {
  if (!lesson || typeof lesson !== 'object') {
    return null;
  }
  
  const hasVideo = VIDEO_CDN_CONFIG.bunnycdn.hasVideo(lesson);
  const hasPdf = VIDEO_CDN_CONFIG.bunnycdn.hasPdf(lesson);
  
  if (hasVideo && hasPdf) return 'both';
  if (hasVideo) return 'video';
  if (hasPdf) return 'pdf';
  return null;
};
