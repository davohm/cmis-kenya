import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type DocumentType = 'bylaws' | 'member_list' | 'minutes' | 'id_copies';

interface UploadResult {
  url: string;
  path: string;
}

interface UploadError {
  message: string;
  code?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const FILE_TYPE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<UploadError | null>(null);

  const validateFile = (file: File): UploadError | null => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        message: `File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        code: 'FILE_TOO_LARGE',
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        message: `File type not allowed. Please upload PDF, PNG, JPG, JPEG, DOC, or DOCX files.`,
        code: 'INVALID_FILE_TYPE',
      };
    }

    return null;
  };

  const uploadDocument = async (
    file: File,
    applicationId: string,
    documentType: DocumentType
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError.message);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = FILE_TYPE_EXTENSIONS[file.type] || file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${extension}`;
      const filePath = `${applicationId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('registration-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        const errorMessage = uploadError.message || 'Failed to upload file';
        setError({ message: errorMessage, code: uploadError.name });
        throw new Error(errorMessage);
      }

      setProgress(100);

      // Get signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('registration-documents')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        const errorMessage = signedUrlError?.message || 'Failed to generate secure URL';
        setError({ message: errorMessage, code: signedUrlError?.name });
        throw new Error(errorMessage);
      }

      return {
        url: signedUrlData.signedUrl,
        path: filePath,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError({ message: errorMessage });
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (filePath: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('registration-documents')
        .remove([filePath]);

      if (deleteError) {
        throw new Error(deleteError.message || 'Failed to delete file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError({ message: errorMessage });
      throw err;
    }
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('registration-documents')
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) {
        console.error('Error generating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Error generating signed URL:', err);
      return null;
    }
  };

  return {
    uploadDocument,
    deleteDocument,
    getSignedUrl,
    uploading,
    progress,
    error,
    validateFile,
    formatFileSize,
    getFileExtension,
  };
}
