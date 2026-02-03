// src/screens/main/PDFViewerScreen.js
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
// Lazy import RNFS to avoid loading it before native module is ready
let RNFS = null;
const getRNFS = () => {
  if (!RNFS) {
    try {
      RNFS = require('react-native-fs');
    } catch (error) {
      console.error('Failed to load react-native-fs:', error);
      return null;
    }
  }
  return RNFS;
};
import Pdf from 'react-native-pdf';
import {COLORS} from '../../constants/colors';
import {getPdfUrl, extractPdfFileName, getSecurePdfDownload} from '../../config/videoCDN';
import PDFDownloadProgress from '../../components/pdf/PDFDownloadProgress';
import SecurePDFReader from '../../components/pdf/SecurePDFReader';

const {width, height} = Dimensions.get('window');

// Check if RNFS native module is available
const isRNFSAvailable = () => {
  try {
    const {NativeModules} = require('react-native');
    const rnfs = getRNFS();
    return NativeModules.RNFSManager && 
           NativeModules.RNFSManager.RNFSFileTypeRegular !== undefined &&
           rnfs &&
           rnfs.CachesDirectoryPath !== undefined;
  } catch (error) {
    console.error('RNFS availability check failed:', error);
    return false;
  }
};

const PDFViewerScreen = ({route, navigation}) => {
  const {lesson, courseTitle} = route.params || {};
  const [stage, setStage] = useState('validating'); // 'validating' | 'downloading' | 'viewing' | 'error'
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [localFilePath, setLocalFilePath] = useState(null);
  
  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const downloadStartTime = useRef(null);
  const lastBytesRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const downloadJobRef = useRef(null);
  const downloadJobIdRef = useRef(null);
  const isCancellingRef = useRef(false);
  const cancelPressedRef = useRef(false);

  // Get filename (will be set after pdfUrl is validated)
  const getFileName = () => {
    if (lesson?.ebookName) {
      return extractPdfFileName(pdfUrl || '', lesson.ebookName);
    }
    if (pdfUrl) {
      return extractPdfFileName(pdfUrl);
    }
    return 'document.pdf';
  };

  // Check RNFS availability on mount
  useEffect(() => {
    if (!isRNFSAvailable()) {
      setError(true);
      setErrorMessage(
        'File system module not available. Please rebuild the app:\n\n' +
        '1. Stop Metro bundler\n' +
        '2. Run: cd android && ./gradlew clean && cd ..\n' +
        '3. Run: npx react-native run-android'
      );
      setStage('error');
      return;
    }
  }, []);

  // Validate and get PDF URL
  useEffect(() => {
    if (!lesson) {
      setError(true);
      setErrorMessage('Lesson data not found');
      setStage('error');
      return;
    }

    // Don't proceed if RNFS is not available
    if (!isRNFSAvailable()) {
      return;
    }

    // Get PDF URL from lesson (check pdfUrl first, then fallback to url for backward compatibility)
    const url = lesson.pdfUrl || lesson.url;
    
    if (!url) {
      console.error('❌ PDF Error: No PDF URL found in lesson:', lesson);
      setError(true);
      setErrorMessage('No PDF source available for this lesson');
      setStage('error');
      return;
    }

    // Validate URL using videoCDN config
    const validatedUrl = getPdfUrl(url);
    
    if (!validatedUrl) {
      console.error('❌ PDF Error: Invalid PDF URL:', url);
      setError(true);
      setErrorMessage('Invalid PDF URL format');
      setStage('error');
      return;
    }

    console.log('✅ PDF URL validated:', validatedUrl);
    setPdfUrl(validatedUrl);
    setStage('downloading');
    downloadPDF(validatedUrl);
  }, [lesson]);

  // Lock orientation to landscape when viewing PDF
  useEffect(() => {
    if (stage === 'viewing') {
      StatusBar.setHidden(true);
      Orientation.lockToLandscape();
    } else {
      StatusBar.setHidden(false);
      Orientation.unlockAllOrientations();
    }

    return () => {
      // Unlock orientation on unmount
      Orientation.unlockAllOrientations();
      StatusBar.setHidden(false);
    };
  }, [stage]);

  // Handle Android back button - unlock orientation and navigate back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stage === 'viewing') {
        Orientation.unlockAllOrientations();
        StatusBar.setHidden(false);
      }
      return false; // Let default back handler work
    });

    return () => backHandler.remove();
  }, [stage]);

  // Cleanup: Delete downloaded file when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function - delete downloaded file
      if (localFilePath) {
        const rnfs = getRNFS();
        if (rnfs) {
          rnfs.unlink(localFilePath)
            .then(() => {
              console.log('✅ Cleaned up downloaded PDF:', localFilePath);
            })
            .catch((error) => {
              console.warn('⚠️ Failed to cleanup PDF file:', error);
            });
        }
      }
    };
  }, [localFilePath]);

  // Download PDF with progress tracking
  const downloadPDF = async (url) => {
    try {
      setStage('downloading');
      downloadStartTime.current = Date.now();
      lastBytesRef.current = 0;
      lastTimeRef.current = Date.now();

      // Get secure download config
      const downloadConfig = getSecurePdfDownload(url);
      
      // Create local file path
      const rnfs = getRNFS();
      if (!rnfs) {
        throw new Error('RNFS module not available');
      }
      const fileName = lesson?.ebookName 
        ? extractPdfFileName(url, lesson.ebookName)
        : extractPdfFileName(url);
      const localPath = `${rnfs.CachesDirectoryPath}/${fileName}`;

      console.log('📥 Starting PDF download:', {
        url: downloadConfig.url,
        localPath,
      });

      // Reset cancel flags
      isCancellingRef.current = false;
      cancelPressedRef.current = false;

      // Start download with progress tracking
      const downloadJob = rnfs.downloadFile({
        fromUrl: downloadConfig.url,
        toFile: localPath,
        headers: downloadConfig.headers,
        progress: (res) => {
          // Don't update if cancelling
          if (isCancellingRef.current) return;

          const bytesWritten = res.bytesWritten;
          const contentLength = res.contentLength;
          const now = Date.now();
          
          // Calculate progress
          const progress = contentLength > 0 
            ? (bytesWritten / contentLength) * 100 
            : 0;
          
          setDownloadProgress(progress);
          setDownloadedBytes(bytesWritten);
          setTotalBytes(contentLength);

          // Calculate speed (bytes per second)
          const timeDiff = (now - lastTimeRef.current) / 1000; // seconds
          if (timeDiff > 0) {
            const bytesDiff = bytesWritten - lastBytesRef.current;
            const speed = bytesDiff / timeDiff;
            setDownloadSpeed(speed);

            // Calculate time left
            if (speed > 0 && contentLength > bytesWritten) {
              const remainingBytes = contentLength - bytesWritten;
              const timeRemaining = remainingBytes / speed;
              setTimeLeft(timeRemaining);
            }
          }

          lastBytesRef.current = bytesWritten;
          lastTimeRef.current = now;
        },
      });

      downloadJobRef.current = downloadJob;
      downloadJobIdRef.current = downloadJob.jobId;

      // Wait for download to complete
      const result = await downloadJob.promise;

      if (result.statusCode === 200) {
        console.log('✅ PDF downloaded successfully:', localPath);
        setLocalFilePath(localPath);
        setStage('viewing');
      } else {
        throw new Error(`Download failed with status code: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('❌ PDF Download Error:', error);
      setError(true);
      setErrorMessage(error?.message || 'Failed to download PDF. Please check your internet connection.');
      setStage('error');
    }
  };

  // Stop download immediately - no confirmation needed
  const stopDownload = () => {
    if (downloadJobIdRef.current !== null && !isCancellingRef.current) {
      isCancellingRef.current = true;
      const rnfs = getRNFS();
      if (rnfs) {
        try {
          rnfs.stopDownload(downloadJobIdRef.current);
          console.log('🛑 Download stopped, jobId:', downloadJobIdRef.current);
        } catch (error) {
          console.warn('⚠️ Error stopping download:', error);
        }
      }
    }
  };

  // Cancel download - stop immediately, then navigate
  const handleCancelDownload = () => {
    // Prevent multiple rapid clicks
    if (cancelPressedRef.current) return;
    cancelPressedRef.current = true;

    // Stop download immediately
    stopDownload();
    
    // Clean up partial download file
    const rnfs = getRNFS();
    if (localFilePath && rnfs) {
      rnfs.unlink(localFilePath).catch(() => {});
    }
    
    // Navigate back immediately (no confirmation delay)
    setTimeout(() => {
      navigation.goBack();
    }, 100); // Small delay to ensure stopDownload is called
  };

  // Build source object for PDF viewer
  const source = localFilePath ? {
    uri: `file://${localFilePath}`,
    cache: false,
  } : null;

  return (
    <View style={styles.container}>
      {/* Header - Hide when viewing PDF */}
      {stage !== 'viewing' && (
      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => {
              if (stage === 'viewing') {
                Orientation.unlockAllOrientations();
                StatusBar.setHidden(false);
              }
              navigation.goBack();
            }}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
              {lesson?.title || 'PDF Document'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
              {courseTitle || ''}
          </Text>
        </View>
      </View>
      )}

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {/* Download Progress Screen */}
        {stage === 'downloading' && (
          <PDFDownloadProgress
            progress={downloadProgress}
            downloadedBytes={downloadedBytes}
            totalBytes={totalBytes}
            speed={downloadSpeed}
            timeLeft={timeLeft}
            fileName={getFileName()}
            onCancel={handleCancelDownload}
          />
        )}

        {/* PDF Viewer */}
        {stage === 'viewing' && source && (
          <SecurePDFReader
            source={source}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`✅ PDF loaded successfully: ${numberOfPages} pages`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`📄 Page changed: ${page}/${numberOfPages}`);
            }}
            onError={error => {
              console.error('❌ PDF Error:', error);
              setError(true);
              setErrorMessage(
                error?.message || 
                'Failed to load PDF. Please check your internet connection.'
              );
              setStage('error');
            }}
            title={lesson?.title || 'PDF Document'}
          />
        )}

        {/* Error Screen */}
        {stage === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load PDF</Text>
            <Text style={styles.errorSubtext}>
              {errorMessage || 'Please check your internet connection'}
            </Text>
            {pdfUrl && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(false);
                  setStage('downloading');
                  downloadPDF(pdfUrl);
                }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.retryButton, styles.cancelButton]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Validating Screen */}
        {stage === 'validating' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Validating PDF...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  pageCounter: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pageCounterText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  loadingText: {
    color: COLORS.textPrimary,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    zIndex: 10,
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
    marginTop: 12,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PDFViewerScreen;
