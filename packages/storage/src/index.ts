import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "./env";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const getPresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 3600,
) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url, key };
};

export const getPresignedDownloadUrl = async (
  key: string,
  expiresIn = 3600,
) => {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn });
};

export const uploadFile = async (
  key: string,
  body: Buffer | string,
  contentType: string,
) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);
  return { key };
};

export const getPublicUrl = (key: string) => {
  return `https://cdn.codingducks.xyz/${key}`;
};
