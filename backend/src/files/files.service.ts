import { BadRequestException, Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';

type CreateUploadUrlInput = {
  fileName: string;
  contentType: string;
};

@Injectable()
export class FilesService {
  private readonly originalsBucket =
    process.env.S3_ORIGINAL_IMAGES_BUCKET || 'mini-jira-original-images-giu';
  private readonly resizedBucket =
    process.env.S3_RESIZED_IMAGES_BUCKET || 'mini-jira-resized-images-giu';
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly s3 = new AWS.S3({
    region: this.region,
    signatureVersion: 'v4',
  });

  async createTaskImageUploadUrl(
    taskId: string,
    { fileName, contentType }: CreateUploadUrlInput,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `task/${taskId}/${randomUUID()}-${safeFileName}`;
    const thumbnailKey = `thumbnails/${key}`;

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.originalsBucket,
      Key: key,
      ContentType: contentType,
      Expires: 300,
    });

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

  private publicS3Url(bucket: string, key: string) {
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  }
}
