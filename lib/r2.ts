import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function uploadText(
  key: string,
  body: string,
  contentType: string
): Promise<void> {
  await uploadBuffer(key, Buffer.from(body, "utf-8"), contentType);
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 3600,
  options?: {
    download?: boolean;
    filename?: string;
  }
): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    ResponseContentDisposition:
      options?.download
        ? `attachment; filename="${(options.filename ?? key.split("/").pop() ?? "video.mp4").replace(/"/g, "")}"`
        : undefined,
  });
  return getSignedUrl(client, command, { expiresIn });
}
