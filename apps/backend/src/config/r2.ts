import { S3Client } from "@aws-sdk/client-s3";
import { logger } from "../utils/logger";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  logger.warn(
    "R2 configuration incomplete. File uploads will be unavailable."
  );
}

/**
 * Cloudflare R2 client (S3-compatible).
 * Endpoint format: https://<account-id>.r2.cloudflarestorage.com
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "aaa-feedback-evidence";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

logger.debug(`R2 client initialized for bucket: ${R2_BUCKET_NAME}`);
