import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  endpoint: 'https://t3.storageapi.dev',
  region: 'auto',
  credentials: {
    accessKeyId: 'tid_zeRwhwZuDsChM_lfxkNNHktBEloZh_egRYxYVjNXRrBXPRcZAq',
    secretAccessKey: 'tsec_9wwW5yJ8wM-0zHsnyJ2czPsdIO-ipcDKo_Ve+GXE+Chggty6+j6V4Xqs4kOnW7cH8zxL5o',
  },
  forcePathStyle: true,
});

const BUCKET = 'optimized-cornucopia-sat3ki';

async function main() {
  console.log('Testing Railway S3 bucket connection...\n');

  // 1. List existing objects
  try {
    const list = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 5 }));
    console.log(`✅ List objects: success (${list.KeyCount ?? 0} objects found)`);
    if (list.Contents?.length) {
      for (const obj of list.Contents) {
        console.log(`   - ${obj.Key} (${obj.Size} bytes)`);
      }
    }
  } catch (e) {
    console.error(`❌ List objects failed: ${e.message}`);
  }

  // 2. Test upload a tiny file
  try {
    const testKey = 'test/connection-test.txt';
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: testKey,
      Body: Buffer.from('Railway S3 connection test'),
      ContentType: 'text/plain',
    }));
    const publicUrl = `https://t3.storageapi.dev/${BUCKET}/${testKey}`;
    console.log(`✅ Upload test: success`);
    console.log(`   Public URL: ${publicUrl}`);
  } catch (e) {
    console.error(`❌ Upload test failed: ${e.message}`);
    if (e.Code) console.error(`   Error code: ${e.Code}`);
  }
}

main().catch(e => console.error('Fatal:', e.message));
