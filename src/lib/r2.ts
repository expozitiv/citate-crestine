import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Bucket-ul Cloudflare R2 privat (R2_BUCKET) — fișiere interne, accesibile doar din admin.
 * Media kit-ul stă sub numele fix `media-kit.zip` și se înlocuiește din dashboard-ul
 * Cloudflare (Upload cu același nume), fără deploy.
 */
export const CHEIE_MEDIA_KIT = 'media-kit.zip'

type ConfigR2 = { client: S3Client; bucket: string }

function configR2(): ConfigR2 | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null
  return {
    bucket: R2_BUCKET,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    }),
  }
}

export type InfoFisier = { marime: number; actualizat: Date | null }

/** Mărimea și data ultimei încărcări; `null` dacă R2 nu e configurat sau fișierul lipsește. */
export async function infoFisierR2(cheie: string): Promise<InfoFisier | null> {
  const r2 = configR2()
  if (!r2) return null
  try {
    const head = await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: cheie }))
    return { marime: head.ContentLength ?? 0, actualizat: head.LastModified ?? null }
  } catch {
    return null
  }
}

/** URL semnat, valabil `secunde`, care descarcă fișierul sub numele `numeDescarcare`. */
export async function urlSemnatR2(
  cheie: string,
  numeDescarcare: string,
  secunde = 300,
): Promise<string | null> {
  const r2 = configR2()
  if (!r2) return null
  return getSignedUrl(
    r2.client,
    new GetObjectCommand({
      Bucket: r2.bucket,
      Key: cheie,
      ResponseContentDisposition: `attachment; filename="${numeDescarcare}"`,
    }),
    { expiresIn: secunde },
  )
}
