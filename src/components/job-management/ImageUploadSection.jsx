import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import JobDataSource from '../../api/datasources/JobDataSource.js'
import { useLanguage } from '../../hooks/useLanguage.js'

const ImageUploadSection = ({ jobId, currentImageUrl, onImageUpload, onImageDelete, isLoading, error }) => {
  const { tPageSync } = useLanguage({ pageName: 'job-management', autoLoad: true })
  const tPage = (key, params = {}) => tPageSync(key, params)

  const [preview, setPreview] = useState(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const license = localStorage.getItem('udaan_agency_license')

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const validateFile = (file) => {
    if (!file) {
      setUploadError('No file selected')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds 5MB limit')
      return false
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: JPG, PNG, WebP')
      return false
    }

    return true
  }

  const handleFileSelect = async (file) => {
    if (!validateFile(file)) {
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadSuccess(false)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)

      // Upload file
      const result = await JobDataSource.uploadJobImage(license, jobId, file)

      if (result.success && result.url) {
        setUploadSuccess(true)
        // Construct full URL from relative path
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
        const fullUrl = result.url.startsWith('http') ? result.url : `${baseUrl}/${result.url}`
        onImageUpload(fullUrl)
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        setUploadError(result.error || 'Upload failed')
        setPreview(currentImageUrl || null)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Failed to upload image')
      setPreview(currentImageUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDelete = async () => {
    try {
      setIsUploading(true)
      setUploadError(null)

      const result = await JobDataSource.deleteJobImage(license, jobId)

      if (result.success) {
        setPreview(null)
        onImageDelete()
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        setUploadError(result.error || 'Failed to delete image')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setUploadError(err.message || 'Failed to delete image')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          {isUploading ? (
            <>
              <Loader className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Drag and drop your image here
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    disabled={isUploading}
                  >
                    click to browse
                  </button>
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG, WebP • Max 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {(uploadError || error) && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{uploadError || error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {preview && !currentImageUrl ? 'Image uploaded successfully' : 'Image deleted successfully'}
          </p>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="space-y-3">
          <div className="relative inline-block w-full">
            <img
              src={preview}
              alt="Job posting preview"
              className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={handleDelete}
              disabled={isUploading}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click the X button to remove this image
          </p>
        </div>
      )}

      {/* No Image State */}
      {!preview && (
        <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No image uploaded yet</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploadSection
