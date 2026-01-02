// @ts-nocheck
// NOTE: This is a web-only component. It uses web APIs (HTMLInputElement, FormData, etc.)
// and should not be used in React Native. It's kept here for reference only.
// The actual web version exists in webfrontend/src/components/course/CloudflarePDFUpload.tsx

import React, { useState } from 'react';
// @ts-ignore - FontAwesome web packages not available in React Native
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// @ts-ignore - FontAwesome web packages not available in React Native
import { faCloudUploadAlt, faFile, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/axios';

interface CloudflarePDFUploadProps {
  courseId: string;
  moduleId: string;
  lessonId: string;
  onUploadSuccess?: (result: CloudflareUploadResult) => void;
  onError?: (error: string) => void;
}

interface CloudflareUploadResult {
  key: string;
  url: string;
  originalName: string;
  size: number;
  lesson: {
    id: string;
    title: string;
  };
}

export const CloudflarePDFUpload: React.FC<CloudflarePDFUploadProps> = ({
  courseId,
  moduleId,
  lessonId,
  onUploadSuccess,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are allowed');
      setUploadStatus('error');
      return;
    }

    // Validate file size (200MB limit)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      setErrorMessage('File size must be less than 200MB');
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadToCloudflare = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('pdf', selectedFile);

      console.log('🔄 CloudflarePDFUpload: Starting upload to Cloudflare R2');
      console.log('📁 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      const response = await api.post(
        `/course-content/${courseId}/modules/${moduleId}/lessons/${lessonId}/upload-cloudflare-pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
              console.log(`📊 Upload progress: ${progress}%`);
            }
          },
        }
      );

      console.log('✅ CloudflarePDFUpload: Upload successful', response.data);

      setUploadStatus('success');
      setUploadProgress(100);

      if (onUploadSuccess && response.data.data) {
        onUploadSuccess(response.data.data);
      }

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);

    } catch (error: any) {
      console.error('❌ CloudflarePDFUpload: Upload failed', error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setErrorMessage(errorMsg);
      setUploadStatus('error');
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <FontAwesomeIcon icon={faCloudUploadAlt} className="text-blue-500 text-xl mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Upload PDF to Cloudflare</h3>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        Upload PDFs to Cloudflare R2 for faster global delivery and better performance.
      </div>

      {/* File Selection */}
      {!selectedFile && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <FontAwesomeIcon icon={faFile} className="text-gray-400 text-3xl mb-3" />
          <div className="mb-3">
            <label htmlFor="cloudflare-pdf-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Choose PDF file
              </span>
              <input
                id="cloudflare-pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Maximum file size: 200MB • Only PDF files allowed
          </p>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && uploadStatus !== 'success' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faFile} className="text-red-500 mr-2" />
              <span className="font-medium text-gray-800">{selectedFile.name}</span>
            </div>
            <span className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</span>
          </div>
          
          {uploadStatus === 'uploading' && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Uploading to Cloudflare...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={uploadToCloudflare}
              disabled={uploading}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload to Cloudflare'}
            </button>
            <button
              onClick={resetUpload}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
            <span className="font-medium text-green-800">
              PDF uploaded to Cloudflare successfully!
            </span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Your PDF is now available globally through Cloudflare's CDN.
          </p>
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
            <span className="font-medium text-red-800">Upload Failed</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          <button
            onClick={resetUpload}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}; 