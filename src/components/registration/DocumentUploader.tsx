import { useState, useRef, DragEvent } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useDocumentUpload, DocumentType } from '../../hooks/useDocumentUpload';

interface DocumentUploaderProps {
  label: string;
  documentType: DocumentType;
  applicationId: string;
  currentUrl?: string;
  onUploadComplete: (url: string, path: string) => void;
  onRemove: () => void;
  required?: boolean;
}

export default function DocumentUploader({
  label,
  documentType,
  applicationId,
  currentUrl,
  onUploadComplete,
  onRemove,
  required = false,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(
    currentUrl ? { name: getFileNameFromUrl(currentUrl), size: 0, url: currentUrl } : null
  );

  const { uploadDocument, uploading, progress, error, validateFile, formatFileSize } = useDocumentUpload();

  function getFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      return;
    }

    try {
      const result = await uploadDocument(file, applicationId, documentType);
      setUploadedFile({
        name: file.name,
        size: file.size,
        url: result.url,
      });
      onUploadComplete(result.url, result.path);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!uploadedFile ? (
        <div
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center space-y-3">
              <Loader className="h-10 w-10 text-red-600 animate-spin" />
              <div className="w-full max-w-xs">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                <span className="text-red-600 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG, JPEG, DOC, DOCX (max 5MB)</p>
            </>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <File className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                {uploadedFile.size > 0 && (
                  <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                )}
              </div>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
            <button
              onClick={handleRemove}
              className="ml-4 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Accepted formats: PDF, PNG, JPG, JPEG, DOC, DOCX • Maximum size: 5MB
      </p>
    </div>
  );
}
