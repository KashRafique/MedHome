const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      // Defaults
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      // Video formats
      'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm',
      // Audio formats
      'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav',
      // Document formats
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Font formats
      'otf', 'ttf',
      // Other
      'zip', 'txt', 'json',
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
