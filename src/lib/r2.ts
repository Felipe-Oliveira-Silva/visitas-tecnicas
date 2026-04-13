import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'

// Validate env vars at module load — fails explicitly at boot, never silently at request time
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error(
    'Missing R2 environment variables. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME',
  )
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
  contentDisposition?: string,
): Promise<void> {
  try {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
    }))
  } catch (err) {
    throw new Error(`R2 upload failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }))
    if (!res.Body) throw new Error(`Empty body returned for key "${key}"`)
    const chunks: Uint8Array[] = []
    for await (const chunk of res.Body as Readable) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (err) {
    throw new Error(`R2 download failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}

// expiresIn in seconds — default 15 minutes
// ResponseContentDisposition forces download with correct filename in the browser
export async function getPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn = 900,
): Promise<string> {
  try {
    return getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn },
    )
  } catch (err) {
    throw new Error(`R2 presign failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}
