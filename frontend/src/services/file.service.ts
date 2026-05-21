import api from '../../lib/axios';

export type UploadUrlResponse = {
  uploadUrl: string;
  method: 'PUT';
  expiresIn: number;
  bucket: string;
  key: string;
  imageKey: string;
  imageUrl: string;
  thumbnailBucket: string;
  thumbnailKey: string;
  thumbnailUrl: string;
};

export const fileService = {
  async getTaskImageUploadUrl(
    taskId: string,
    file: File,
  ): Promise<UploadUrlResponse> {
    const res = await api.post(`/tasks/${taskId}/files/upload-url`, {
      fileName: file.name,
      contentType: file.type,
    });
    return res.data;
  },

  async uploadToS3(uploadUrl: string, file: File) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`S3 upload failed with ${res.status}`);
    }
  },
};
