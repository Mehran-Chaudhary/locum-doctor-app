import api from './api';
import type { UploadResponse } from '../types';
import type { UploadType } from '../constants/enums';

/**
 * Upload a file (image / pdf) to the backend.
 *
 * @param type   - one of UploadType values: 'profile-pic' | 'pmdc-cert' | 'hospital-logo'
 * @param uri    - local file URI from expo-image-picker
 * @param mimeType - e.g. 'image/jpeg', 'application/pdf'
 * @param fileName - e.g. 'photo.jpg'
 */
export const uploadService = {
  upload: async (
    type: UploadType,
    uri: string,
    mimeType: string = 'image/jpeg',
    fileName: string = 'upload.jpg',
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: mimeType,
      name: fileName,
    } as any);

    const { data } = await api.post(`/upload/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (d) => d, // keep FormData untouched
    });

    return data.data;
  },
};
