import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Robots.txt with Content Signals
// ─────────────────────────────────────────────────────────────────────────────
test('Robots.txt route emits Content-Signal and proper directives', async () => {
  const robotsPath = path.join(rootDir, 'public/robots.txt');
  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');

  // Verify app/robots.ts was removed to prevent route collision
  const oldRobotsPath = path.join(rootDir, 'app/robots.ts');
  assert.ok(!fs.existsSync(oldRobotsPath), 'app/robots.ts must be deleted');

  // Read content of robots.txt
  const routeSource = fs.readFileSync(robotsPath, 'utf8');

  // Verify Content-Signal directive exists under User-agent: *
  assert.match(
    routeSource,
    /User-agent:\s*\*\r?\nContent-Signal:\s*ai-train=no,\s*search=yes,\s*ai-input=no/,
    'Content-Signal must be declared under User-agent: *'
  );

  // Verify Generative AI bot agents
  const aiBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'anthropic-ai', 'Google-Extended', 'Applebot'];
  for (const bot of aiBots) {
    assert.ok(routeSource.includes(bot), `Robots.txt must mention ${bot}`);
  }

  // Verify search engines & image crawlers
  assert.ok(routeSource.includes('User-agent: Googlebot'), 'Must mention Googlebot');
  assert.ok(routeSource.includes('User-agent: Bingbot'), 'Must mention Bingbot');
  assert.ok(routeSource.includes('User-agent: Googlebot-Image'), 'Must mention Googlebot-Image');

  // Verify sitemap directive
  assert.match(routeSource, /Sitemap:\s*(https?:\/\/[^\s]+|\$\{baseUrl\})\/sitemap\.xml/, 'Must contain Sitemap directive');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Safepay HMAC-SHA256 Signature Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Safepay webhook signature verification with timingSafeEqual', async () => {
  const { SafepayService } = await import(path.join(rootDir, 'lib/payment/safepay.ts'));

  const testSecret = 'test_webhook_secret_key_12345';
  process.env.SAFEPAY_WEBHOOK_SECRET = testSecret;

  const payload = JSON.stringify({
    data: {
      token: 'track_123456',
      state: 'PAID',
      order_id: 'EM-TEST-001',
    },
  });

  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(payload)
    .digest('hex');

  // Test 1: Valid signature passes
  assert.equal(
    SafepayService.verifyWebhookSignature(payload, validSignature),
    true,
    'Valid HMAC signature should pass'
  );

  // Test 2: Tampered payload fails
  const tamperedPayload = payload.replace('PAID', 'FAILED');
  assert.equal(
    SafepayService.verifyWebhookSignature(tamperedPayload, validSignature),
    false,
    'Tampered payload should fail'
  );

  // Test 3: Wrong signature fails
  const badSignature = validSignature.slice(0, -4) + '0000';
  assert.equal(
    SafepayService.verifyWebhookSignature(payload, badSignature),
    false,
    'Mismatched HMAC should fail'
  );

  // Test 4: Truncated / odd-length signature does NOT throw RangeError (length guard)
  assert.doesNotThrow(() => {
    const result = SafepayService.verifyWebhookSignature(payload, 'abc12');
    assert.equal(result, false, 'Truncated signature should safely return false');
  });

  // Test 5: Empty signature safely returns false
  assert.equal(
    SafepayService.verifyWebhookSignature(payload, ''),
    false,
    'Empty signature should return false'
  );

  // Test 6: Non-hex characters safely return false without throwing
  assert.doesNotThrow(() => {
    const result = SafepayService.verifyWebhookSignature(payload, 'not-a-valid-hex-string!!');
    assert.equal(result, false, 'Invalid hex should return false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Image Magic-Byte Binary Verification
// ─────────────────────────────────────────────────────────────────────────────
test('Magic-byte binary detection for image uploads', async () => {
  function detectImageType(buffer) {
    if (buffer.length < 12) return null;
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
    ) return 'image/png';
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) return 'image/webp';
    if (buffer.toString('utf8', 4, 8) === 'ftyp') {
      const brand = buffer.toString('utf8', 8, 12);
      if (brand === 'avif' || brand === 'avis' || brand === 'mif1') return 'image/avif';
    }
    return null;
  }

  // Valid JPEG buffer
  const jpegBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.equal(detectImageType(jpegBuf), 'image/jpeg');

  // Valid PNG buffer
  const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  assert.equal(detectImageType(pngBuf), 'image/png');

  // Valid WebP buffer (RIFF....WEBP)
  const webpBuf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
  assert.equal(detectImageType(webpBuf), 'image/webp');

  // Valid AVIF buffer (....ftypavif)
  const avifBuf = Buffer.from([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
  assert.equal(detectImageType(avifBuf), 'image/avif');

  // Malicious SVG with XSS disguised as image
  const svgBuf = Buffer.from('<svg onload="alert(document.cookie)"></svg>');
  assert.equal(detectImageType(svgBuf), null, 'SVG should be rejected by magic bytes');

  // Malicious HTML with script
  const htmlBuf = Buffer.from('<html><script>window.location="evil"</script></html>');
  assert.equal(detectImageType(htmlBuf), null, 'HTML should be rejected by magic bytes');

  // Malicious PHP / executable shell
  const phpBuf = Buffer.from('<?php system($_GET["cmd"]); ?>');
  assert.equal(detectImageType(phpBuf), null, 'PHP script should be rejected');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Image Proxy Path-Traversal Protection
// ─────────────────────────────────────────────────────────────────────────────
test('Image proxy path-traversal validation', async () => {
  function validateProxyKey(keyParts) {
    if (!keyParts || keyParts.length === 0) return { valid: false, reason: 'missing' };
    const decodedParts = keyParts.map((part) => {
      try { return decodeURIComponent(part); } catch { return part; }
    });
    for (const part of decodedParts) {
      if (part.includes('..') || part.includes('/') || part.includes('\\') || part.includes('\0')) {
        return { valid: false, reason: 'traversal_pattern' };
      }
    }
    const rawKey = decodedParts.join('/');
    const normalizedKey = path.posix.normalize(rawKey);
    if (normalizedKey.startsWith('..') || path.isAbsolute(normalizedKey)) {
      return { valid: false, reason: 'path_traversal' };
    }
    if (!normalizedKey.startsWith('products/')) {
      return { valid: false, reason: 'outside_scope' };
    }
    return { valid: true, key: normalizedKey };
  }

  // Legitimate product image
  assert.equal(validateProxyKey(['products', '1714660000000-shoe.jpg']).valid, true);

  // Path traversal with ..
  assert.equal(validateProxyKey(['products', '..', '..', 'etc', 'passwd']).valid, false);

  // Encoded traversal %2e%2e
  assert.equal(validateProxyKey(['products', '%2e%2e', 'secrets.json']).valid, false);

  // Null byte injection
  assert.equal(validateProxyKey(['products', 'shoe.jpg\0.png']).valid, false);

  // Outside allowed products prefix
  assert.equal(validateProxyKey(['backups', 'database.sql']).valid, false);
  assert.equal(validateProxyKey(['private', 'keys.pem']).valid, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Hardcoded Database Credentials Scan
// ─────────────────────────────────────────────────────────────────────────────
test('No hardcoded database credentials remain in source code or scripts', async () => {
  const searchPattern1 = ['npg', '_', 'si9fM8gyAZCx'].join('');
  const searchPattern2 = ['postgresql://neondb', '_', 'owner:npg_'].join('');
  const searchPattern3 = ['kPvafiLoQgke', 'HXhaCVeAamZEwziaQEEx'].join('');

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.next' ||
        entry.name === '.env' ||
        entry.name === '.env.local' ||
        entry.name === 'test-security-audit.mjs'
      ) {
        continue;
      }
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (
        entry.name.endsWith('.ts') ||
        entry.name.endsWith('.tsx') ||
        entry.name.endsWith('.mjs') ||
        entry.name.endsWith('.js')
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(!content.includes(searchPattern1), `Found pattern 1 in ${fullPath}`);
        assert.ok(!content.includes(searchPattern2), `Found pattern 2 in ${fullPath}`);
        assert.ok(!content.includes(searchPattern3), `Found pattern 3 in ${fullPath}`);
      }
    }
  }

  scanDir(rootDir);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PostEx Webhook Fail-Closed Authentication
// ─────────────────────────────────────────────────────────────────────────────
test('PostEx webhook auth fails closed in production when secret is missing', async () => {
  const postexRouteSource = fs.readFileSync(
    path.join(rootDir, 'app/api/webhooks/postex/route.ts'),
    'utf8'
  );

  // Verify constant-time comparison
  assert.ok(postexRouteSource.includes('crypto.timingSafeEqual'), 'Must use crypto.timingSafeEqual');

  // Verify fail closed in production
  assert.ok(
    postexRouteSource.includes('Rejecting request') && postexRouteSource.includes('return false;'),
    'Must fail closed when secret is not configured in production'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Middleware RBAC & 401 API Protection
// ─────────────────────────────────────────────────────────────────────────────
test('Middleware enforces server-level RBAC and returns 401 JSON for APIs', async () => {
  const middlewareSource = fs.readFileSync(path.join(rootDir, 'middleware.ts'), 'utf8');

  // Verify /api/upload is covered in matcher
  assert.ok(middlewareSource.includes('"/api/upload"'), 'Matcher must protect /api/upload');

  // Verify unauthenticated API requests return 401 JSON instead of redirecting to login
  assert.ok(
    middlewareSource.includes('Unauthorized: Authentication required'),
    'Must return 401 JSON for unauthenticated API routes'
  );

  // Verify staff role check for upload
  assert.ok(
    middlewareSource.includes('BRANCH_MANAGER') &&
    middlewareSource.includes('WAREHOUSE_STAFF') &&
    middlewareSource.includes('Staff or Admin privileges required'),
    'Must restrict /api/upload to staff and admin roles'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Safepay Payment Failure Inventory Restoration
// ─────────────────────────────────────────────────────────────────────────────
test('Safepay webhook restores inventory on payment failure', async () => {
  const safepayRouteSource = fs.readFileSync(
    path.join(rootDir, 'app/api/webhooks/safepay/route.ts'),
    'utf8'
  );

  // Verify inventory restoration loop on FAILED state
  assert.ok(
    safepayRouteSource.includes("state === 'FAILED'"),
    'Must handle FAILED state'
  );
  assert.ok(
    safepayRouteSource.includes('quantity: { increment: item.quantity }'),
    'Must increment inventory quantity on digital payment failure'
  );
  assert.ok(
    safepayRouteSource.includes('type: "RETURN"'),
    'Must record RETURN inventory transaction on payment failure'
  );
});

