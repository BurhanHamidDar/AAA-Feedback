import { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "../config/r2";
import { supabase } from "../config/supabase";
import { PresignUploadSchema } from "@aaa-feedback/shared";
import { randomUUID } from "crypto";

const router: Router = Router();

router.use(requireAuth);

/**
 * POST /uploads/presign
 * Returns a presigned R2 URL for direct client upload.
 * After upload, client should call /uploads/confirm to record in DB.
 */
router.post(
  "/presign",
  validate(PresignUploadSchema),
  asyncHandler(async (req, res) => {
    const { feedback_id, file_name, file_type, file_size } = req.body as {
      feedback_id: string;
      file_name: string;
      file_type: string;
      file_size: number;
    };

    const ext = file_name.split(".").pop() ?? "jpg";
    const key = `evidence/${feedback_id}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: file_type,
      ContentLength: file_size,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    res.json({
      success: true,
      data: {
        upload_url: presignedUrl,
        public_url: publicUrl,
        key,
        expires_in: 300,
      },
    });
  })
);

/**
 * POST /uploads/confirm
 * Records the uploaded file in the database after successful R2 upload.
 */
router.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const { feedback_id, file_url, file_type, file_size } = req.body as {
      feedback_id: string;
      file_url: string;
      file_type: string;
      file_size: number;
    };

    const { data, error } = await supabase
      .from("feedback_evidence")
      .insert({ feedback_id, file_url, file_type, file_size })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  })
);

export default router;
