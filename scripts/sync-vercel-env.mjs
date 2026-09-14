import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found in', process.cwd());
  process.exit(1);
}

const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const envVars = [];

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx > -1) {
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars.push({ key, val });
  }
}

const NON_SENSITIVE = new Set([
  'AUTH_URL',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BRAND_NAME',
  'NEXT_PUBLIC_BRAND_PHONE',
  'NEXT_PUBLIC_IMAGE_URL',
  'NEON_BRANCH',
  'GMC_MERCHANT_ID',
  'GMC_DATA_SOURCE_ID',
  'GMC_FEED_ID',
  'GMC_TARGET_COUNTRY',
  'GMC_CONTENT_LANGUAGE',
  'GMC_CURRENCY',
  'AWS_DEFAULT_REGION',
  'S3_REGION',
]);

console.log(`Syncing ${envVars.length} variables to Vercel (Production, Preview)...`);

for (const { key, val } of envVars) {
  const isSensitive = !NON_SENSITIVE.has(key);
  const typeFlag = isSensitive ? '--sensitive' : '--no-sensitive';
  
  try {
    process.stdout.write(`Syncing ${key} (${isSensitive ? 'Sensitive' : 'Non-sensitive'})... `);
    execFileSync('npx', [
      '-y',
      'vercel',
      'env',
      'add',
      key,
      'production,preview',
      '--value',
      val,
      '--force',
      typeFlag,
      '--yes'
    ], {
      env: {
        ...process.env,
        LD_PRELOAD: '/data/data/com.termux/files/usr/lib/libtermux-exec.so'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('✅ Done');
  } catch (err) {
    console.log('❌ Failed');
    console.error(err.stderr ? err.stderr.toString() : err.message);
  }
}

console.log('\nAll variables synced to Vercel successfully!');
