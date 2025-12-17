// src/screens/main/PDFViewerScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {COLORS} from '../../constants/colors';

const {width, height} = Dimensions.get('window');

const PDFViewerScreen = ({route, navigation}) => {
  const {lesson, courseTitle} = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const source = {
    uri: lesson.url,
    cache: true,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>
      </View>

      {/* Page Counter */}
      {totalPages > 0 && (
        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>
      )}

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load PDF</Text>
            <Text style={styles.errorSubtext}>
              Please check your internet connection
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && (
          <Pdf
            trustAllCerts={false}
            source={source}
            style={styles.pdf}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`PDF loaded: ${numberOfPages} pages`);
              setTotalPages(numberOfPages);
              setLoading(false);
            }}
            onPageChanged={(page, numberOfPages) => {
              setCurrentPage(page);
            }}
            onError={error => {
              console.error('PDF Error:', error);
              setError(true);
              setLoading(false);
            }}
            onLoadProgress={percent => {
              console.log(`Loading: ${percent}%`);
            }}
            spacing={10}
            enablePaging={true}
            horizontal={false}
            fitPolicy={0}
            enableAntialiasing={true}
          />
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
  pdfContainer: {
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
});

export default PDFViewerScreen;
