/**
 * Normalize file paths for cross-platform compatibility
 * Converts Windows backslashes to forward slashes for URLs
 * Also removes the 'uploads/' prefix if it exists
 */
export const normalizeFilePath = (filePath: string | undefined): string => {
  if (!filePath) return '';
  
  // Convert all backslashes to forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remove 'uploads/' prefix since the API endpoint already includes it
  // This prevents double 'uploads/uploads/' in the URL
  normalized = normalized.replace(/^uploads\//, '');
  
  return normalized;
};

/**
 * Normalize multiple file paths in an array
 */
export const normalizeFilePaths = (filePaths: string[] | undefined): string[] => {
  if (!filePaths || !Array.isArray(filePaths)) return [];
  
  return filePaths.map(path => normalizeFilePath(path));
};

