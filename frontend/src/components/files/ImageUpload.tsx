'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { fileService } from '../../services/file.service';
import { taskService } from '../../services/task.service';

type Props = {
  taskId: string;
};

export default function ImageUpload({ taskId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const upload = await fileService.getTaskImageUploadUrl(taskId, file);
      await fileService.uploadToS3(upload.uploadUrl, file);
      await taskService.update(taskId, {
        imageKey: upload.imageKey,
        imageUrl: upload.imageUrl,
        thumbnailKey: upload.thumbnailKey,
        thumbnailUrl: upload.thumbnailUrl,
      });
      setMessage('Image uploaded. The thumbnail will appear after Lambda finishes resizing.');
    } catch {
      setError('Image upload failed. Check S3 CORS, bucket permissions, and backend logs.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ImageIcon className="h-4 w-4" />
          Task image
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading' : 'Upload'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Selected task attachment preview"
          className="h-40 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          No image selected
        </div>
      )}

      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
