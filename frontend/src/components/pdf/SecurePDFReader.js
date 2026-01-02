// src/components/pdf/SecurePDFReader.js

// SIMPLIFIED VERSION - Uses PDF component's built-in gestures

import React, {useState, useEffect, useRef} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';

import Pdf from 'react-native-pdf';

import {COLORS} from '../../constants/colors';



const SecurePDFReader = ({
  source,
  onLoadComplete,
  onPageChanged,
  onError,
  title = 'PDF Document',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  const pdfRef = useRef(null);
  const pageCounterOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef(null);

  // Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
      console.log('📱 PDF Dimensions updated:', window.width, 'x', window.height);
    });

    return () => subscription?.remove();
  }, []);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (totalPages > 0 && showControls) {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [currentPage, totalPages, showControls]);

  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    setShowControls(true);
    pageCounterOpacity.setValue(1);

    controlsTimeoutRef.current = setTimeout(() => {
      Animated.timing(pageCounterOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 3000);
  };

  const handleLoadComplete = (numberOfPages, filePath) => {
    setTotalPages(numberOfPages);
    console.log('✅ PDF loaded:', numberOfPages, 'pages');
    if (onLoadComplete) {
      onLoadComplete(numberOfPages, filePath);
    }
  };

  const handlePageChanged = (page, numberOfPages) => {
    setCurrentPage(page);
    console.log('📄 Page:', page, '/', numberOfPages);
    resetControlsTimer();
    if (onPageChanged) {
      onPageChanged(page, numberOfPages);
    }
  };

  // Fixed: handleSingleTap now accepts (page, x, y) parameters as per react-native-pdf API
  const handleSingleTap = (page, x, y) => {
    // Toggle controls visibility
    if (showControls) {
      // Hide immediately
      Animated.timing(pageCounterOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      // Show controls
      resetControlsTimer();
    }
  };

  return (
    <View style={styles.container}>
      {/* PDF Viewer with built-in gestures */}
      <Pdf
        ref={pdfRef}
        trustAllCerts={false}
        source={source}
        style={[
          styles.pdf,
          {
            width: dimensions.width,
            height: dimensions.height,
          },
        ]}
        onLoadComplete={handleLoadComplete}
        onPageChanged={handlePageChanged}
        onError={onError}
        onLoadProgress={percent => {
          console.log(`📄 PDF Loading: ${percent}%`);
        }}
        onPageSingleTap={handleSingleTap}
        // KEY SETTINGS FOR HORIZONTAL LANDSCAPE READING
        horizontal={true}           // Horizontal page navigation
        enablePaging={true}          // Enable page-by-page scrolling
        spacing={10}                 // Space between pages
        fitPolicy={0}                // 0=FIT_WIDTH (best for landscape)
        // ZOOM SETTINGS (PDF handles this internally)
        minScale={1.0}               // Minimum zoom
        maxScale={4.0}               // Maximum zoom  
        enableAntialiasing={true}
        enableAnnotationRendering={true}
        // GESTURE SETTINGS (Let PDF handle all gestures)
        enableDoubleTapZoom={true}   // Double-tap to zoom
        // No custom gesture handlers - PDF handles everything
      />

      {/* Page Counter Overlay */}
      {totalPages > 0 && (
        <Animated.View 
          style={[
            styles.pageCounterOverlay, 
            { opacity: pageCounterOpacity }
          ]}
          pointerEvents="none">
          <View style={styles.pageCounter}>
            <Text style={styles.pageCounterText}>
              Page {currentPage} of {totalPages}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Navigation Hints (only show for first few seconds) */}
      {showControls && totalPages > 0 && (
        <Animated.View 
          style={[
            styles.hintsOverlay, 
            { opacity: pageCounterOpacity }
          ]}
          pointerEvents="none">
          {currentPage > 1 && (
            <View style={styles.hintLeft}>
              <Text style={styles.hintArrow}>‹</Text>
              <Text style={styles.hintText}>Swipe</Text>
            </View>
          )}
          {currentPage < totalPages && (
            <View style={styles.hintRight}>
              <Text style={styles.hintText}>Swipe</Text>
              <Text style={styles.hintArrow}>›</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Tap anywhere hint (shows once) */}
      {showControls && totalPages > 0 && currentPage === 1 && (
        <Animated.View 
          style={[
            styles.tapHint, 
            { opacity: pageCounterOpacity }
          ]}
          pointerEvents="none">
          <Text style={styles.tapHintText}>
            Tap to hide • Pinch to zoom • Swipe to navigate
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  pageCounterOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  pageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pageCounterText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hintsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 90,
  },
  hintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  hintRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  hintArrow: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  tapHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  tapHintText: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    textAlign: 'center',
  },
});

export default SecurePDFReader;
