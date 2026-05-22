import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

type CreateUploadUrlInput = {
  fileName: string;
  contentType: string;
};

@Injectable()
export class FilesService {
  private readonly originalsBucket =
    process.env.S3_ORIGINAL_IMAGES_BUCKET ||
    process.env.S3_ORIGINAL_BUCKET ||
    'mini-jira-original-images-giu';
  private readonly resizedBucket =
    process.env.S3_RESIZED_IMAGES_BUCKET ||
    process.env.S3_RESIZED_BUCKET ||
    'mini-jira-resized-images-giu';
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly s3 = new S3Client({
    region: this.region,
  });

  async createTaskImageUploadUrl(
    taskId: string,
    { fileName, contentType }: CreateUploadUrlInput,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        'Only JPG, JPEG, and PNG images are allowed.',
      );
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `task/${taskId}/${randomUUID()}-${safeFileName}`;
    const thumbnailKey = `thumbnails/${key}`;

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.originalsBucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );

    return {
      uploadUrl,
      method: 'PUT',
      expiresIn: 300,
      bucket: this.originalsBucket,
      key,
      imageKey: key,
      imageUrl: this.publicS3Url(this.originalsBucket, key),
      thumbnailBucket: this.resizedBucket,
      thumbnailKey,
      thumbnailUrl: this.publicS3Url(this.resizedBucket, thumbnailKey),
    };
  }

  async deleteTaskImages(imageKey?: string, thumbnailKey?: string) {
    if (imageKey) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.originalsBucket,
          Key: imageKey,
        }),
      );
    }

    if (thumbnailKey) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.resizedBucket,
          Key: thumbnailKey,
        }),
      );
    }
  }

  private publicS3Url(bucket: string, key: string) {
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  }
}
