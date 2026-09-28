import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl =
  process.env.STORAGE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}

async function migrate() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to PostgreSQL for payment schema migration...');

  try {
    // 1. Create Enums
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentTransactionStatus') THEN
          CREATE TYPE "PaymentTransactionStatus" AS ENUM (
            'INITIATED',
            'PENDING_3DS',
            'CAPTURED',
            'FAILED',
            'CANCELLED',
            'REFUNDED'
          );
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
          CREATE TYPE "DiscountType" AS ENUM (
            'PERCENTAGE',
            'FIXED_AMOUNT'
          );
        END IF;
      END $$;
    `);

    // 2. Create payment_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "gateway" TEXT NOT NULL,
        "transactionReference" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'PKR',
        "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'INITIATED',
        "cardScheme" TEXT,
        "cardLast4" TEXT,
        "cardBin" TEXT,
        "issuingBank" TEXT,
        "gatewayRawResponse" JSONB,
        "failureReason" TEXT,
        "idempotencyKey" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_transactionReference_key"
      ON "payment_transactions"("transactionReference");
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_idempotencyKey_key"
      ON "payment_transactions"("idempotencyKey");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "payment_transactions_orderId_idx"
      ON "payment_transactions"("orderId");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "payment_transactions_transactionReference_idx"
      ON "payment_transactions"("transactionReference");
    `);

    // 3. Create bank_discount_campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "bank_discount_campaigns" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "issuingBank" TEXT NOT NULL,
        "binPrefixes" TEXT[] NOT NULL,
        "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
        "discountValue" DECIMAL(10,2) NOT NULL,
        "maxDiscountCap" DECIMAL(10,2),
        "minimumOrderAmount" DECIMAL(10,2),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "promoCodeRequired" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bank_discount_campaigns_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "bank_discount_campaigns_issuingBank_idx"
      ON "bank_discount_campaigns"("issuingBank");
    `);

    console.log('✅ Tables and indexes created successfully.');

    // 4. Seed initial bank campaigns
    const campaigns = [
      {
        id: 'camp_hbl_15',
        name: 'HBL Privilege 15% Instant Discount',
        issuingBank: 'HBL',
        binPrefixes: ['421444', '410582', '457470', '400262', '451833', '524365', '548895', '530519', '512403', '552140', '606571'],
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxDiscountCap: 2500,
        minimumOrderAmount: 5000,
        isActive: true,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2030-12-31T23:59:59.000Z',
      },
      {
        id: 'camp_alfalah_10',
        name: 'Bank Alfalah Alfa 10% Card Discount',
        issuingBank: 'ALFALAH',
        binPrefixes: ['405624', '428288', '485353', '409160', '524163', '552243', '518544', '527357', '606572'],
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscountCap: 2000,
        minimumOrderAmount: 5000,
        isActive: true,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2030-12-31T23:59:59.000Z',
      },
      {
        id: 'camp_meezan_10',
        name: 'Meezan Bank 10% Shariah Privilege',
        issuingBank: 'MEEZAN',
        binPrefixes: ['400713', '489501', '409415', '521874', '539942', '552184', '606584'],
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscountCap: 1500,
        minimumOrderAmount: 4000,
        isActive: true,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2030-12-31T23:59:59.000Z',
      },
      {
        id: 'camp_scb_15',
        name: 'Standard Chartered Priority 15% Discount',
        issuingBank: 'SCB',
        binPrefixes: ['409544', '491502', '437551', '491503', '543460', '524376'],
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxDiscountCap: 3000,
        minimumOrderAmount: 6000,
        isActive: true,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2030-12-31T23:59:59.000Z',
      },
    ];

    for (const c of campaigns) {
      await client.query(`
        INSERT INTO "bank_discount_campaigns" (
          "id", "name", "issuingBank", "binPrefixes", "discountType",
          "discountValue", "maxDiscountCap", "minimumOrderAmount",
          "isActive", "startDate", "endDate", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "binPrefixes" = EXCLUDED."binPrefixes",
          "discountValue" = EXCLUDED."discountValue",
          "maxDiscountCap" = EXCLUDED."maxDiscountCap",
          "minimumOrderAmount" = EXCLUDED."minimumOrderAmount",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = CURRENT_TIMESTAMP
      `, [
        c.id,
        c.name,
        c.issuingBank,
        c.binPrefixes,
        c.discountType,
        c.discountValue,
        c.maxDiscountCap,
        c.minimumOrderAmount,
        c.isActive,
        c.startDate,
        c.endDate,
      ]);
    }

    console.log(`✅ Seeded ${campaigns.length} bank discount campaigns.`);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
