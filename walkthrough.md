# Executive Mochi (`emochipk`) — Credit & Debit Card Payments & Bank Affiliation Walkthrough

**Target Platform:** Executive Mochi (`https://executivemochi.pk`)  
**Technology Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 6 (Neon PostgreSQL), tRPC v11, Tailwind CSS 4  
**Scope:** Payment Gateway Research, 3D Secure 2.0, PCI-DSS SAQ-A Compliance, Local Bank Affiliations & BIN Sponsorships, Technical Architecture, and Step-by-Step Implementation Guide.

---

## Table of Contents
1. [Executive Summary & Strategic Context](#1-executive-summary--strategic-context)
2. [Pakistani Payment Gateway Landscape (In-Depth Analysis)](#2-pakistani-payment-gateway-landscape-in-depth-analysis)
   - [2.1 Safepay (Recommended Primary Gateway)](#21-safepay-recommended-primary-gateway)
   - [2.2 Bank Alfalah Alfa Payment Gateway (APG)](#22-bank-alfalah-alfa-payment-gateway-apg)
   - [2.3 PayFast (APPS - Avanza Premier Payment Services)](#23-payfast-apps---avanza-premier-payment-services)
   - [2.4 Habib Bank Limited (HBL Pay / IPG)](#24-habib-bank-limited-hbl-pay--ipg)
   - [2.5 JazzCash & EasyPaisa Card Acquiring Solutions](#25-jazzcash--easypaisa-card-acquiring-solutions)
   - [2.6 Kuickpay](#26-kuickpay)
   - [2.7 Comprehensive Comparison Matrix](#27-comprehensive-comparison-matrix)
3. [Card Processing Mechanics, Security & Regulatory Compliance](#3-card-processing-mechanics-security--regulatory-compliance)
   - [3.1 3D Secure 2.0 (3DS 2.x) Authentication Flow](#31-3d-secure-20-3ds-2x-authentication-flow)
   - [3.2 State Bank of Pakistan (SBP) & Tax Regulations](#32-state-bank-of-pakistan-sbp--tax-regulations)
   - [3.3 PCI-DSS SAQ-A Compliance Strategy](#33-pci-dss-saq-a-compliance-strategy)
4. [Local Bank Affiliations & BIN Sponsorship Procedures](#4-local-bank-affiliations--bin-sponsorship-procedures)
   - [4.1 How Bank Alliances & Card Discounts Work](#41-how-bank-alliances--card-discounts-work)
   - [4.2 Commercial Funding Models](#42-commercial-funding-models)
   - [4.3 Step-by-Step Bank Partnership Onboarding Playbook](#43-step-by-step-bank-partnership-onboarding-playbook)
   - [4.4 Pakistani Bank BIN Reference Directory](#44-pakistani-bank-bin-reference-directory)
5. [Technical Architecture for Executive Mochi](#5-technical-architecture-for-executive-mochi)
   - [5.1 Database Schema Extensions (`prisma/schema.prisma`)](#51-database-schema-extensions-prismaschemaprisma)
   - [5.2 Modular Payment Gateway Service Layer](#52-modular-payment-gateway-service-layer)
   - [5.3 Dynamic BIN Detection & Discount Engine](#53-dynamic-bin-detection--discount-engine)
   - [5.4 Secure Webhook Ingestion & Idempotency Pipeline](#54-secure-webhook-ingestion--idempotency-pipeline)
6. [Step-by-Step Implementation Guide & Code Walkthrough](#6-step-by-step-implementation-guide--code-walkthrough)
   - [Step 1: Database Migration](#step-1-database-migration)
   - [Step 2: Payment Service & Safepay Driver Implementation](#step-2-payment-service--safepay-driver-implementation)
   - [Step 3: BIN Discount Engine & Validation Utilities](#step-3-bin-discount-engine--validation-utilities)
   - [Step 4: tRPC Router Procedures (`paymentRouter` & `orderRouter`)](#step-4-trpc-router-procedures-paymentrouter--orderrouter)
   - [Step 5: Cryptographic Webhook Handler (`/api/webhooks/safepay/route.ts`)](#step-5-cryptographic-webhook-handler-apiwebhookssafepayroutets)
   - [Step 6: High-Conversion Checkout UI with Real-time BIN Detection](#step-6-high-conversion-checkout-ui-with-real-time-bin-detection)
7. [Financial Reconciliation, Chargeback Handling & Fraud Prevention](#7-financial-reconciliation-chargeback-handling--fraud-prevention)
8. [Remaining Questions & Next Steps](#8-remaining-questions--next-steps)

---

## 1. Executive Summary & Strategic Context

In Pakistan's e-commerce ecosystem, **Cash on Delivery (COD)** represents between 75% and 85% of footwear retail orders. However, COD introduces major operational frictions for Executive Mochi:
1. **High Return-to-Origin (RTO) Rates:** Footwear returns for COD orders range between 15% and 25% due to customer impulse cancellations, failed delivery contact, or buyer remorse at the doorstep. In contrast, prepaid digital card orders experience RTO rates of **under 1.5%**.
2. **Courier Cash Handling Surcharges:** Courier partners (PostEx, Leopards, Trax) levy 1.5% to 2.5% COD collection fees and hold merchant cash flow for 3 to 7 days before remittance.
3. **Working Capital Delays:** Multi-branch inventory (Pasrur and Daska) remains reserved during transit for unverified COD shipments.

By integrating **Credit & Debit Card processing** and partnering with top Pakistani commercial banks (e.g., **Bank Alfalah, HBL, Meezan Bank, Bank AL Habib, Standard Chartered**) for **BIN-specific cardholder discounts (10% to 20% off)**, Executive Mochi can:
- Shift order volume from COD to high-intent prepaid card transactions.
- Leverage bank marketing channels (SMS broadcasts, mobile banking app banners, card privilege portals) reaching millions of affluent cardholders at zero customer acquisition cost (CAC).
- Maintain PCI-DSS SAQ-A compliance using modern embedded tokenization/iframes or hosted checkout without handling sensitive card numbers directly.

---

## 2. Pakistani Payment Gateway Landscape (In-Depth Analysis)

Accepting debit and credit cards in Pakistan requires navigating the State Bank of Pakistan (SBP) regulatory framework for **Payment Service Operators (PSOs)** and **Payment Service Providers (PSPs)** or integrating directly with commercial bank card acquirers.

### 2.1 Safepay (Recommended Primary Gateway)
- **Overview:** Backed by Stripe and Y Combinator, Safepay is an SBP-licensed PSO/PSP built specifically for modern developers. It represents the "Stripe of Pakistan" with clean REST APIs, robust Webhooks, and modern client SDKs.
- **Card Scheme Support:** Visa, Mastercard, PayPak (in phased rollout), and domestic bank accounts via Raast Wire API.
- **Integration Options:**
  1. *QuickPay / Hosted Checkout:* Server initiates payment and redirects the user to `https://getsafepay.com/checkout/pay?token=...`.
  2. *Safepay Atoms (`@sfpy/atoms`):* Embedded React components that mount secure iframes for card capture (`CardCapture`) and 3DS authentication modal (`PayerAuthentication`).
- **Fees & Commercials:**
  - **MDR (Merchant Discount Rate):** 2.5% + PKR 10 per successful transaction.
  - **Sales Tax / FED:** 16% PRA (Punjab) or 13% SRB (Sindh) levied only on the MDR fee amount.
  - **Setup & Annual Fees:** PKR 0 setup fee; PKR 0 monthly minimum.
- **Settlement Timeline:** T+2 to T+4 business days direct to any 1Link bank account (e.g., Executive Mochi's corporate account).
- **Built-in Discount Support:** Safepay Atoms natively supports `discountBody` with `bin_discount` (matching first 6 digits) and `promo_discount` for campaign management directly on card entry!
- **Verdict for emochipk:** **Highest recommendation**. Perfectly aligns with Next.js 16, React 19, and TypeScript with zero legacy baggage.

### 2.2 Bank Alfalah Alfa Payment Gateway (APG)
- **Overview:** Bank Alfalah is Pakistan's largest domestic card acquiring bank. APG operates on Mastercard Payment Gateway Services (MPGS) and CyberSource infrastructure.
- **Card Scheme Support:** Visa, Mastercard, PayPak, UnionPay, Alfa Wallet, and Alfalah Bank Accounts.
- **Integration Options:**
  1. *Hosted Checkout Page (HPP):* HTML Form POST redirect with SHA256 request signature (`HS_RequestHash`).
  2. *Direct API (Merchant Integration):* Server-to-server or CyberSource Secure Acceptance.
- **Fees & Commercials:**
  - **MDR:** 2.0% – 2.4% for Bank Alfalah cards ("on-us"); 2.6% – 3.0% for other bank cards ("off-us") + FED.
  - **Setup Fee:** PKR 25,000 – PKR 50,000 (often negotiable for registered private limited companies).
  - **Annual Maintenance Fee (AMC):** PKR 10,000 – PKR 20,000.
- **Settlement Timeline:** T+1 or T+2 directly credited into a Bank Alfalah corporate current account.
- **Native BIN Discount Engine:** APG features a built-in merchant portal discount module. When configured, APG checks the BIN of any entered Alfalah card on the gateway screen and automatically deducts the negotiated campaign discount.
- **Verdict for emochipk:** **Ideal for exclusive Bank Alfalah alliance campaigns**. Slightly higher onboarding friction (physical KYC, store inspection, dedicated Alfalah corporate account required).

### 2.3 PayFast (APPS - Avanza Premier Payment Services)
- **Overview:** SBP-licensed PSO/PSP widely used by medium and large Pakistani enterprises, universities, and billing aggregators.
- **Card Scheme Support:** Visa, Mastercard, UnionPay, PayPak (online enabled), 1Link bank direct debit, and mobile wallets.
- **Integration Options:**
  1. *PayFast Checkout (Hosted Page):* Token request followed by customer redirection.
  2. *REST API with IP Whitelisting:* Server fetches access token, submits transaction details, receives signed callback.
- **Fees & Commercials:**
  - **MDR:** 2.4% – 2.8% on Visa/Mastercard; 1.5% – 1.8% on PayPak + FED.
  - **Setup Fee:** PKR 15,000 – PKR 30,000.
  - **AMC:** PKR 10,000.
- **Settlement Timeline:** T+2 to any 1Link member bank.
- **Verdict for emochipk:** **Excellent secondary fallback** if domestic PayPak and UnionPay debit card volume is prioritized.

### 2.4 Habib Bank Limited (HBL Pay / IPG)
- **Overview:** Habib Bank Limited is Pakistan’s largest commercial bank with over 15 million customers and the highest card circulation in the country. HBL Internet Payment Gateway (IPG) is powered by MPGS.
- **Card Scheme Support:** Visa, Mastercard, PayPak.
- **Integration Options:** MPGS Hosted Session / Hosted Checkout (`checkout.min.js`).
- **Fees & Commercials:** 2.0% – 2.5% MDR + FED. High initial corporate balance requirements (typically PKR 500,000+ monthly average balance in HBL corporate account).
- **Settlement Timeline:** T+1 directly to HBL account.
- **Verdict for emochipk:** Essential for nationwide co-marketing tie-ups (e.g., "HBL Friday Deals" or "HBL Mega Shoe Fest").

### 2.5 JazzCash & EasyPaisa Card Acquiring Solutions
- **JazzCash:** Provides an MPGS-hosted card payment gateway as an add-on to its mobile wallet. MDR is relatively high (2.8% – 3.5% + PKR 10 + FED). International card success rate is lower than dedicated card acquirers.
- **EasyPaisa:** Offers merchant checkout for EasyPaisa Mobile Accounts (MA) and OTC vouchers. For card payments, EasyPaisa typically white-labels APPS/PayFast rails.
- **Verdict for emochipk:** Retain JazzCash and EasyPaisa primarily for **Mobile Wallet** checkouts; route credit/debit card processing through Safepay or APG.

### 2.6 Kuickpay
- **Overview:** 1Link 1Bill aggregator. Generates a 9-digit consumer bill number that customers pay via their banking app's "Bill Payment / 1Bill" section.
- **Verdict for emochipk:** Kuickpay is not an instant card acquiring gateway; it requires out-of-band asynchronous customer payments. Best suited for high-ticket B2B or custom bespoke leather orders.

---

### 2.7 Comprehensive Comparison Matrix

| Gateway | SBP Licensing | Setup Fee | Annual Fee | Card MDR (Domestic) | Settlement | PayPak Support | 3DS 2.0 | Next.js / TypeScript DX | Built-in BIN Discount Engine |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Safepay** | Licensed PSO/PSP | **PKR 0** | **PKR 0** | 2.5% + PKR 10 | T+2 to T+4 | Phased rollout | Yes (Native) | ⭐⭐⭐⭐⭐ (Official SDKs, `@sfpy/atoms`) | Yes (`bin_discount` API) |
| **Bank Alfalah APG** | Direct Bank Acquirer | PKR 25k–50k | PKR 10k–15k | 2.2%–2.8% | **T+1 to T+2** | Yes | Yes (MPGS/Cybersource) | ⭐⭐⭐ (Form POST, legacy docs) | Yes (APG Portal engine) |
| **PayFast** | Licensed PSO/PSP | PKR 15k–30k | PKR 10k | 2.4%–2.8% | T+2 | **Yes (Full)** | Yes (APPS Secure) | ⭐⭐⭐⭐ (REST API, IP whitelist) | Manual / Partner configured |
| **HBL Pay** | Direct Bank Acquirer | PKR 30k–50k | PKR 15k | **2.0%–2.5%** | **T+1** | Yes | Yes (MPGS) | ⭐⭐⭐⭐ (MPGS Session JS) | Yes (HBL Card Campaigns) |
| **JazzCash (Cards)** | Sub-license / Bank | Variable | Nil | 2.8%–3.5% | T+2 | Limited | Yes (Bank partner) | ⭐⭐⭐ (Form redirect) | No |

---

## 3. Card Processing Mechanics, Security & Regulatory Compliance

### 3.1 3D Secure 2.0 (3DS 2.x) Authentication Flow
Under State Bank of Pakistan mandates, all card-not-present (CNP) e-commerce transactions in Pakistan must undergo two-factor authentication (2FA).

```
Customer Checkout (Next.js)
       │
       ▼
1. User enters Card details in Secure Element / Atom (Safepay / APG)
       │
       ▼
2. Gateway queries Directory Server (Visa / Mastercard / PayPak)
       │
       ▼
3. Access Control Server (ACS) of Issuing Bank checks risk:
   ├── Low Risk ───────► Frictionless Flow: Authentication succeeded immediately without OTP!
   └── Challenge Flow ─► Issuing Bank presents OTP Challenge Modal (SMS / Banking App push)
       │
       ▼
4. Customer enters OTP -> ACS verifies and issues cryptographic CAVV / AAV token
       │
       ▼
5. Gateway authorizes transaction through Acquirer -> Merchant Webhook received -> Order Verified
```

### 3.2 State Bank of Pakistan (SBP) & Tax Regulations
1. **PSD Circular No. 02 of 2018 (Card Security):**
   - Mandatory EMV 3D Secure for all internet transactions. Unauthenticated fallback (no 3DS) is strictly prohibited on Pakistani domestic cards.
2. **Merchant SBP Regulations & KYC:**
   - E-commerce merchants must hold a valid **National Tax Number (NTN)** registered with FBR.
   - Business bank account in the registered entity name.
   - Clear online refund, exchange, and cancellation policy prominently published (Executive Mochi currently fulfills this via `/shipping` and `/returns`).
3. **Provincial Sales Tax on Services:**
   - Payment gateway service charges (the MDR fee) are subject to Provincial Sales Tax:
     - **Sindh (SRB):** 13% on processing fee.
     - **Punjab (PRA):** 16% on processing fee.
   - *Example calculation:* On a PKR 10,000 footwear purchase at 2.5% MDR:
     - Base MDR fee: `PKR 10,000 * 2.5% = PKR 250`
     - PRA Tax (16% of PKR 250): `PKR 40`
     - Net gateway deduction: `PKR 290`
     - Net merchant remittance: `PKR 9,710`.

### 3.3 PCI-DSS SAQ-A Compliance Strategy
Handling raw cardholder data (Primary Account Number - PAN, Expiration Date, CVV2) on Executive Mochi's Next.js server would subject the business to **PCI-DSS Level 1 / SAQ-D**, requiring costly audits, penetration tests, HSM hardware, and extreme legal liability.

**Executive Mochi Architectural Strategy:**
- **Zero Cardholder Data on Server:** Card data never touches Next.js route handlers or database models.
- Card inputs are rendered using **Safepay Atoms (`@sfpy/atoms`)** or **Safepay Hosted Checkout**.
- The client receives a single-use token or tracker ID.
- The server only stores:
  - Masked PAN: `**** **** **** 1234`
  - Card Scheme: `VISA`, `MASTERCARD`, `PAYPAK`
  - First 6 digits (BIN) for bank discount attribution: `421444`
  - Issuing Bank identifier: `HBL`, `ALFALAH`, `MEEZAN`
- **Result:** Executive Mochi qualifies for **PCI-DSS SAQ-A** (the simplest self-assessment questionnaire, completed in under 1 hour annually).

---

## 4. Local Bank Affiliations & BIN Sponsorship Procedures

### 4.1 How Bank Alliances & Card Discounts Work
Pakistani banks actively seek partnerships with premium, high-reputation local retail brands (such as Executive Mochi) to stimulate debit and credit card spending among their affluent account holders.

When a partnership is established:
1. **Cardholder Incentive:** Bank cardholders receive **10% to 20% instant discount** at checkout when paying with their eligible debit or credit card.
2. **Bank Promotion:** The bank advertises Executive Mochi to its card base via:
   - Automated promotional SMS blasts to cardholders in target cities (Lahore, Sialkot, Islamabad, Karachi).
   - Placement on the bank’s mobile app homepage under "Deals & Discounts" / "Alfa Privileges" / "HBL Mobile Deals".
   - Inclusion in electronic direct mailers (EDMs) and monthly credit card statement inserts.

### 4.2 Commercial Funding Models

| Model | Description | Typical Use Case | Who Absorbs Discount? | Marketing Commitments |
| :--- | :--- | :--- | :--- | :--- |
| **Merchant-Funded (Standard DTC)** | Merchant absorbs 100% of the discount (e.g. 15% off). | Evergreen privilege partnerships & DTC brands | Executive Mochi | Bank commits to SMS broadcast, app listing, and social media push |
| **Co-Funded (Split Cost)** | Merchant and bank split discount cost (e.g. 10% Merchant + 5% Bank). | High-velocity shopping festivals (Eid, Blessed Friday, Independence Day) | 50/50 or 60/40 Split | Joint marketing budget; prominent bank app banner placement |
| **Bank-Funded (Subsidized)** | Bank funds the entire discount or provides cashback. | Reserved for hyper-scale platforms (Daraz, Foodpanda) | Bank | Exclusive payment gateway acquiring rights |

*Recommendation for Executive Mochi:* Begin with **Merchant-Funded campaigns (10% to 15% discount, capped at PKR 2,000 per transaction)**. The footwear industry has comfortable retail margins (45%–60%), making a 15% promotional discount highly accretive when eliminating COD RTO losses and securing free targeted bank customer acquisition.

---

### 4.3 Step-by-Step Bank Partnership Onboarding Playbook

#### Phase 1: Commercial Pitch Preparation (Week 1)
Prepare the **Executive Mochi Merchant Alliance Profile**:
- **Brand Story:** Handcrafted luxury Pakistani leather footwear (Pasrur/Daska artisan heritage).
- **Key Metrics:**
  - Average Order Value (AOV): PKR 7,500 – PKR 14,000.
  - Core Customer Demographics: Affluent male professionals, wedding shoppers, diaspora buyers.
  - Active Digital Channels: `executivemochi.pk`, Meta Pixel / CAPI tracking, email list.
- **Proposed Campaign Terms:**
  - Offer: 15% off on all regular footwear articles.
  - Minimum Spend: PKR 5,000.
  - Maximum Discount Cap: PKR 2,000 per order.
  - Target Cards: Visa Platinum / Signature / Infinite, Mastercard World, Platinum Debit.

#### Phase 2: Bank Alliances Outreach (Weeks 2–3)
Submit formal partnership proposals to the **Consumer Cards & Alliances Departments**:

1. **Bank Alfalah (Consumer Finance & Alfa Alliances):**
   - Contact: Retail Alliances & Cards Department (`partnerships@bankalfalah.com` / Alfa Payment Gateway Team).
   - Strength: Built-in APG gateway integration allows instant discount automation without custom code.
2. **Habib Bank Limited (HBL Cards & Alliances):**
   - Contact: Consumer Banking - Card Products & Alliances (`cardalliances@hbl.com`).
   - Strength: Highest cardholder volume in Punjab and nationwide.
3. **Meezan Bank (Consumer Cards & Merchant Alliances):**
   - Contact: Consumer Banking - Debit Card Alliances.
   - Strength: Pakistan's largest Islamic bank with millions of strictly Shariah-conscious debit cardholders.
4. **Bank AL Habib & Standard Chartered Pakistan (SCB):**
   - Highly affluent cardholder demographic with highest e-commerce AOV in Pakistan.

#### Phase 3: Legal Agreement & SLA Execution (Weeks 3–4)
Execute a standard **Merchant Alliance Memorandum of Understanding (MOU)** covering:
- **Campaign Duration:** Evergreen (1 year) or Seasonal (6–8 weeks around Eid / Blessed Friday).
- **BIN Range List Sharing:** Bank provides an official annexure listing all eligible 6-digit and 8-digit BIN ranges.
- **Fair Usage & Cap Rules:** Capping per card (e.g., maximum 2 discounted orders per card per month).
- **Return & Refund Clawback:** In case of customer return or cancellation, the refund amount equals the **net discounted price actually paid by the cardholder**, not the original retail price.
- **Marketing Deliverables SLA:** Number of SMS broadcasts, mobile app push notifications, and social media placements guaranteed by the bank.

---

### 4.4 Pakistani Bank BIN Reference Directory

A Bank Identification Number (BIN) is the **first 6 to 8 digits** of a debit or credit card number. It uniquely identifies the issuing institution, card scheme, and card tier.

The following verified BIN table covers the primary card issuing banks in Pakistan:

| Bank Name | Scheme | Primary BIN Ranges (First 6 Digits) | Eligible Card Tiers |
| :--- | :--- | :--- | :--- |
| **Habib Bank Limited (HBL)** | Visa | `421444`, `410582`, `457470`, `400262`, `451833` | Classic, Gold, Platinum, Signature |
| **Habib Bank Limited (HBL)** | Mastercard | `524365`, `548895`, `530519`, `512403`, `552140` | Debit, World Mastercard |
| **Bank Alfalah** | Visa | `405624`, `428288`, `485353`, `409160` | Classic, Gold, Platinum, Signature |
| **Bank Alfalah** | Mastercard | `524163`, `552243`, `518544`, `527357` | Titanium, Platinum, World |
| **Meezan Bank** | Visa | `400713`, `489501`, `409415` | Shariah-compliant Visa Debit |
| **Meezan Bank** | Mastercard | `521874`, `539942`, `552184` | Titanium, Platinum Debit |
| **Standard Chartered (SCB)**| Visa | `409544`, `491502`, `437551`, `491503` | Priority Banking, Platinum, Infinite |
| **Standard Chartered (SCB)**| Mastercard | `543460`, `524376` | Titanium, World |
| **Bank AL Habib (BAHL)** | Visa | `409212`, `418108` | Debit, Gold |
| **Bank AL Habib (BAHL)** | Mastercard | `546836`, `554580` | Titanium, Platinum |
| **Faysal Bank** | Visa | `415234`, `424726` | Islamic Noor Cards, Platinum |
| **Faysal Bank** | Mastercard | `512127`, `531007` | World, Titanium |
| **MCB Bank** | Visa / MC | `426189`, `478886`, `527358`, `543889` | Smart Card, Platinum |
| **United Bank Limited (UBL)**| Visa / MC | `409055`, `421370`, `542418`, `525287` | Wiz, Signature, Premium Debit |
| **Allied Bank (ABL)** | Visa / MC | `400244`, `415235`, `541243`, `552185` | Everyday Debit, Platinum |
| **Domestic Scheme (PayPak)**| PayPak | `606571` (HBL), `606572` (Alfalah), `606584` (Meezan) | PayPak Domestic Debit |

---

## 5. Technical Architecture for Executive Mochi

### 5.1 Database Schema Extensions (`prisma/schema.prisma`)

To support digital card acquiring, track transaction references, and manage bank discount campaigns, the database schema requires two new models and minor extensions to `Order`:

```prisma
// ─── EXTENSIONS TO EXISTING ENUMS ──────────────────────────────────────────
enum PaymentTransactionStatus {
  INITIATED
  PENDING_3DS
  CAPTURED
  FAILED
  CANCELLED
  REFUNDED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

// ─── NEW MODEL: PaymentTransaction ─────────────────────────────────────────
model PaymentTransaction {
  id                   String                   @id @default(cuid())
  orderId              String
  gateway              String                   // SAFEPAY | ALFALAH_APG | PAYFAST
  transactionReference String                   @unique // Safepay tracker or gateway trans ID
  amount               Decimal                  @db.Decimal(10, 2)
  currency             String                   @default("PKR")
  status               PaymentTransactionStatus @default(INITIATED)
  
  // Card & BIN metadata (strictly SAQ-A compliant, NO raw PAN or CVV)
  cardScheme           String?                  // VISA, MASTERCARD, PAYPAK
  cardLast4            String?                  // e.g. "1234"
  cardBin              String?                  // First 6 digits e.g. "421444"
  issuingBank          String?                  // e.g. "HBL", "ALFALAH", "MEEZAN"
  
  // Auditing & Diagnostics
  gatewayRawResponse   Json?
  failureReason        String?
  idempotencyKey       String?                  @unique
  createdAt            DateTime                 @default(now())
  updatedAt            DateTime                 @updatedAt

  order                Order                    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([transactionReference])
  @@map("payment_transactions")
}

// ─── NEW MODEL: BankDiscountCampaign ────────────────────────────────────────
model BankDiscountCampaign {
  id                 String       @id @default(cuid())
  name               String       // e.g. "HBL Alliances 15% Privilege"
  issuingBank        String       // "HBL", "ALFALAH", "MEEZAN", etc.
  binPrefixes        String[]     // ["421444", "410582", "524365"]
  discountType       DiscountType @default(PERCENTAGE)
  discountValue      Decimal      @db.Decimal(10, 2) // 15 for 15%
  maxDiscountCap     Decimal?     @db.Decimal(10, 2) // e.g. 2000.00
  minimumOrderAmount Decimal?     @db.Decimal(10, 2) // e.g. 5000.00
  isActive           Boolean      @default(true)
  startDate          DateTime
  endDate            DateTime
  promoCodeRequired  String?      // Optional promo code binding (e.g. "HBL15")
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([issuingBank])
  @@map("bank_discount_campaigns")
}
```

---

### 5.2 Modular Payment Gateway Service Layer

Adopt an **Adapter Pattern** so Executive Mochi can switch or multi-home gateways without touching core checkout logic:

```
                  ┌────────────────────────┐
                  │    tRPC Order Router   │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │   PaymentService       │
                  │   (Unified Interface)  │
                  └───────────┬────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ SafepayAdapter  │  │ AlfalahAdapter  │  │ PayFastAdapter  │
│ (Primary Node)  │  │ (Direct APG)    │  │ (PayPak Backup) │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 5.3 Dynamic BIN Detection & Discount Engine

```
Customer Types Card Number: "4214 44..."
       │
       ▼
Client-side Debounce (6 digits reached)
       │
       ▼
1. Query tRPC: `api.discount.lookupBin.useQuery({ bin: '421444', amount: 12000 })`
       │
       ▼
2. Server matches against active `BankDiscountCampaign` records:
   - Matches: Habib Bank Limited (HBL)
   - Rule: 15% off, Max Cap PKR 2,000
   - Computed Discount: min(12000 * 0.15 = 1800, 2000) = PKR 1,800
       │
       ▼
3. UI dynamically updates:
   - Displays Badge: "🎉 HBL 15% Discount Applied (-PKR 1,800)"
   - Adjusted Payable: PKR 10,200
       │
       ▼
4. Server Re-verification on Order Placement:
   - Server re-calculates discount before generating gateway session token to prevent client-side price manipulation.
```

### 5.4 Secure Webhook Ingestion & Idempotency Pipeline

```
Safepay Server
       │
       ▼ POST /api/webhooks/safepay
1. Verify `X-SFPY-Signature` using `crypto.timingSafeEqual` with Webhook Secret
       │
       ▼
2. Check timestamp freshness (< 300s window) to prevent replay attacks
       │
       ▼
3. Atomic Database Transaction:
   - Check if `PaymentTransaction.status === 'CAPTURED'` (if yes, return HTTP 200 immediately)
   - Update `PaymentTransaction.status = 'CAPTURED'`
   - Update `Order.paymentStatus = 'PAID_DIGITAL'`
   - Update `Order.status = 'PROCESSING'`
   - Decrement variant physical inventory (`quantity - count`)
       │
       ▼
4. Asynchronously fire Meta CAPI `Purchase` Event (outside DB transaction)
```

---

## 6. Step-by-Step Implementation Guide & Code Walkthrough

### Step 1: Database Migration
Add the `PaymentTransaction` and `BankDiscountCampaign` models to [`prisma/schema.prisma`](file:///data/data/com.termux/files/home/emochipk/prisma/schema.prisma), then run:
```bash
npx prisma db push
```

---

### Step 2: Payment Service & Safepay Driver Implementation
Create [`lib/payment/types.ts`](file:///data/data/com.termux/files/home/emochipk/lib/payment/types.ts):

```typescript
export interface CreateSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in PKR
  currency: 'PKR';
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  billingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  discountInfo?: {
    campaignId?: string;
    bankName?: string;
    discountAmount: number;
  };
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  token: string;
  redirectUrl: string;
  tracker: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderNumber?: string;
  tracker?: string;
  amount?: number;
  status?: 'CAPTURED' | 'FAILED';
  cardBin?: string;
  cardLast4?: string;
  cardScheme?: string;
}
```

Create [`lib/payment/safepay.ts`](file:///data/data/com.termux/files/home/emochipk/lib/payment/safepay.ts):

```typescript
import crypto from 'crypto';
import type { CreateSessionParams, CheckoutSessionResult, WebhookVerificationResult } from './types';

const SAFEPAY_ENV = process.env.SAFEPAY_ENVIRONMENT ?? 'sandbox'; // 'sandbox' | 'production'
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY ?? '';
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET ?? '';

const BASE_URL = SAFEPAY_ENV === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com';

const CHECKOUT_URL = SAFEPAY_ENV === 'production'
  ? 'https://getsafepay.com/checkout/pay'
  : 'https://sandbox.api.getsafepay.com/checkout/pay';

export class SafepayService {
  /**
   * Initializes a payment session on Safepay and returns the checkout token & redirect URL.
   */
  static async createCheckoutSession(params: CreateSessionParams): Promise<CheckoutSessionResult> {
    // 1. Create payment order token
    const res = await fetch(`${BASE_URL}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': SAFEPAY_API_KEY,
      },
      body: JSON.stringify({
        client: 'custom',
        amount: Math.round(params.amount * 100), // convert to paisa
        currency: params.currency,
        environment: SAFEPAY_ENV,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Safepay initialization failed: ${errText}`);
    }

    const { data } = await res.json();
    const token = data.token; // order token

    // 2. Build secure hosted checkout redirect URL
    const queryParams = new URLSearchParams({
      beacon: token,
      order_id: params.orderNumber,
      redirect_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      source: 'custom',
      webhooks: 'true',
    });

    return {
      token,
      redirectUrl: `${CHECKOUT_URL}?${queryParams.toString()}`,
      tracker: token,
    };
  }

  /**
   * Cryptographically verifies webhook payloads using HMAC-SHA256.
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature || !SAFEPAY_WEBHOOK_SECRET) return false;
    const computedSignature = crypto
      .createHmac('sha256', SAFEPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }
}
```

---

### Step 3: BIN Discount Engine & Validation Utilities
Create [`lib/payment/bin-lookup.ts`](file:///data/data/com.termux/files/home/emochipk/lib/payment/bin-lookup.ts):

```typescript
import { prisma } from '@/server/db';

export interface BinLookupResult {
  isEligible: boolean;
  bankName?: string;
  campaignId?: string;
  campaignName?: string;
  discountPercentage?: number;
  discountAmount: number;
  finalPayable: number;
  message?: string;
}

/**
 * Validates a card BIN (first 6 digits) against active bank discount campaigns in the DB.
 */
export async function evaluateBinDiscount(bin: string, subtotal: number): Promise<BinLookupResult> {
  const cleanBin = bin.replace(/\D/g, '').slice(0, 6);
  if (cleanBin.length < 6) {
    return { isEligible: false, discountAmount: 0, finalPayable: subtotal };
  }

  const now = new Date();
  const activeCampaigns = await prisma.bankDiscountCampaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      binPrefixes: { has: cleanBin },
    },
    orderBy: { discountValue: 'desc' },
  });

  if (activeCampaigns.length === 0) {
    return { isEligible: false, discountAmount: 0, finalPayable: subtotal };
  }

  const campaign = activeCampaigns[0];

  // Check minimum order amount threshold
  if (campaign.minimumOrderAmount && subtotal < Number(campaign.minimumOrderAmount)) {
    return {
      isEligible: false,
      bankName: campaign.issuingBank,
      discountAmount: 0,
      finalPayable: subtotal,
      message: `Minimum order of PKR ${campaign.minimumOrderAmount} required for ${campaign.issuingBank} discount.`,
    };
  }

  let calculatedDiscount = 0;
  if (campaign.discountType === 'PERCENTAGE') {
    const rawDiscount = subtotal * (Number(campaign.discountValue) / 100);
    const maxCap = campaign.maxDiscountCap ? Number(campaign.maxDiscountCap) : Infinity;
    calculatedDiscount = Math.min(rawDiscount, maxCap);
  } else {
    calculatedDiscount = Number(campaign.discountValue);
  }

  calculatedDiscount = Math.round(calculatedDiscount);
  const finalPayable = Math.max(0, subtotal - calculatedDiscount);

  return {
    isEligible: true,
    campaignId: campaign.id,
    campaignName: campaign.name,
    bankName: campaign.issuingBank,
    discountPercentage: Number(campaign.discountValue),
    discountAmount: calculatedDiscount,
    finalPayable,
    message: `🎉 ${campaign.issuingBank} ${campaign.discountValue}% discount applied!`,
  };
}
```

---

### Step 4: tRPC Router Procedures (`paymentRouter` & `orderRouter`)
Create [`server/routers/payment.ts`](file:///data/data/com.termux/files/home/emochipk/server/routers/payment.ts):

```typescript
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { evaluateBinDiscount } from '@/lib/payment/bin-lookup';
import { SafepayService } from '@/lib/payment/safepay';

export const paymentRouter = createTRPCRouter({
  /**
   * Real-time BIN lookup endpoint for checkout card number input
   */
  lookupBin: publicProcedure
    .input(z.object({
      bin: z.string().min(6),
      subtotal: z.number().positive(),
    }))
    .query(async ({ input }) => {
      return evaluateBinDiscount(input.bin, input.subtotal);
    }),

  /**
   * Initiates digital card checkout for an existing PENDING order
   */
  initiateCardSession: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      cardBin: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { shippingAddress: true, user: true },
      });

      if (!order) throw new Error('Order not found');
      if (order.userId !== ctx.session.user.id) throw new Error('Unauthorized');
      if (order.paymentStatus === 'PAID_DIGITAL') throw new Error('Order is already paid');

      const addr = order.shippingAddress;
      if (!addr) throw new Error('Shipping address missing');

      const [firstName, ...rest] = addr.fullName.split(' ');
      const lastName = rest.join(' ') || 'Customer';

      const returnUrl = `${process.env.NEXTAUTH_URL}/checkout/payment-return?order=${order.orderNumber}`;
      const cancelUrl = `${process.env.NEXTAUTH_URL}/checkout?cancelled=true`;

      // Generate checkout session with Safepay
      const session = await SafepayService.createCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        currency: 'PKR',
        customer: {
          email: order.user.email,
          phone: addr.phone,
          firstName,
          lastName,
        },
        billingAddress: {
          street: addr.street,
          city: addr.city,
          province: addr.province,
          postalCode: addr.postalCode ?? undefined,
        },
        returnUrl,
        cancelUrl,
      });

      // Record transaction in database
      await ctx.db.paymentTransaction.create({
        data: {
          orderId: order.id,
          gateway: 'SAFEPAY',
          transactionReference: session.tracker,
          amount: order.totalAmount,
          status: 'INITIATED',
          cardBin: input.cardBin?.slice(0, 6),
        },
      });

      return {
        redirectUrl: session.redirectUrl,
        tracker: session.tracker,
      };
    }),
});
```

---

### Step 5: Cryptographic Webhook Handler (`/api/webhooks/safepay/route.ts`)
Create [`app/api/webhooks/safepay/route.ts`](file:///data/data/com.termux/files/home/emochipk/app/api/webhooks/safepay/route.ts):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { SafepayService } from '@/lib/payment/safepay';
import { sendMetaEvents, buildUserData, nowSeconds } from '@/lib/meta-capi';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-sfpy-signature') || '';

    // 1. Verify cryptographic signature
    const isValid = SafepayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Safepay Webhook] Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.data;
    const tracker = event.token || event.tracker;
    const orderNumber = event.metadata?.order_id || event.order_id;
    const state = event.state; // 'PAID' | 'FAILED'

    if (!tracker) {
      return NextResponse.json({ error: 'Missing tracker' }, { status: 400 });
    }

    // 2. Process payment state atomically
    if (state === 'PAID') {
      const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.paymentTransaction.findFirst({
          where: { transactionReference: tracker },
          include: { order: { include: { items: { include: { variant: { include: { product: true } } } }, shippingAddress: true, user: true } } },
        });

        if (!transaction) throw new Error(`Transaction ${tracker} not found`);
        if (transaction.status === 'CAPTURED') {
          return { alreadyProcessed: true, order: transaction.order };
        }

        // Update transaction
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'CAPTURED',
            gatewayRawResponse: payload,
            cardLast4: event.payment_details?.last4,
            cardScheme: event.payment_details?.scheme,
          },
        });

        // Update Order
        const updatedOrder = await tx.order.update({
          where: { id: transaction.orderId },
          data: {
            paymentStatus: 'PAID_DIGITAL',
            status: 'PROCESSING', // Paid orders skip COD verification and enter packing queue immediately
          },
          include: { items: { include: { variant: { include: { product: true } } } }, shippingAddress: true, user: true },
        });

        return { alreadyProcessed: false, order: updatedOrder };
      });

      // 3. Fire Meta CAPI Purchase event if freshly paid
      if (!result.alreadyProcessed && result.order) {
        const order = result.order;
        const addr = order.shippingAddress;
        const [firstName, ...rest] = (addr?.fullName ?? '').split(' ');

        void sendMetaEvents([{
          event_name: 'Purchase',
          event_time: nowSeconds(),
          event_id: `purchase-${order.id}`,
          event_source_url: 'https://executivemochi.pk/checkout',
          action_source: 'website',
          user_data: buildUserData({
            email: order.user.email,
            phone: addr?.phone,
            firstName,
            lastName: rest.join(' '),
            city: addr?.city,
            state: addr?.province,
            postalCode: addr?.postalCode ?? undefined,
            country: 'pk',
            userId: order.userId,
          }),
          custom_data: {
            order_id: order.orderNumber,
            currency: 'PKR',
            value: Number(order.totalAmount),
            num_items: order.items.length,
            content_type: 'product',
          },
        }]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Safepay Webhook Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Step 6: High-Conversion Checkout UI with Real-time BIN Detection

In [`app/(storefront)/checkout/page.tsx`](file:///data/data/com.termux/files/home/emochipk/app/%28storefront%29/checkout/page.tsx), add card BIN input handling:

```tsx
// Inside CheckoutPage component
const [cardNumberPrefix, setCardNumberPrefix] = useState<string>('');
const [appliedBankDiscount, setAppliedBankDiscount] = useState<{
  bankName: string;
  discountAmount: number;
} | null>(null);

// Real-time BIN detection query
const { data: binData } = api.payment.lookupBin.useQuery(
  { bin: cardNumberPrefix, subtotal: cart.subtotal },
  { enabled: paymentMethod === 'CARD' && cardNumberPrefix.length >= 6 }
);

useEffect(() => {
  if (binData?.isEligible && binData.discountAmount > 0) {
    setAppliedBankDiscount({
      bankName: binData.bankName!,
      discountAmount: binData.discountAmount,
    });
    toast.success(binData.message);
  } else {
    setAppliedBankDiscount(null);
  }
}, [binData]);

// Trigger card session on submit
const initiateCardPayment = api.payment.initiateCardSession.useMutation({
  onSuccess: ({ redirectUrl }) => {
    // Redirect customer to secure 3D Secure payment page
    window.location.href = redirectUrl;
  },
  onError: (err) => {
    toast.error(err.message || 'Payment initiation failed.');
    setIsSubmitting(false);
  },
});
```

---

## 7. Financial Reconciliation, Chargeback Handling & Fraud Prevention

### 7.1 Daily Settlement & Reconciliation Procedure
Safepay and bank acquirers provide automated **Settlement Files (CSV / MT940)** via their dashboard and SFTP:
1. **Automated Cron / Reconciliation Worker:** Match each gateway settlement record (`transactionReference`) against Neon PostgreSQL `payment_transactions`.
2. **Flag Discrepancies:** Verify MDR deductions match agreed contractual rates (`2.5% + PKR 10 + PRA 16%`).
3. **Internal ERP Settlement:** Mark corresponding branch inventory sales as financially closed.

### 7.2 Fraud Prevention & Card Testing Mitigation
- **Rate Limiting:** Implement Upstash Redis rate limiting on `/checkout` and `initiateCardSession` (maximum 5 payment attempts per IP / customer per 10 minutes) to prevent card-testing bot attacks.
- **Cloudflare Turnstile:** Enforce invisible CAPTCHA verification before issuing payment tokens.
- **Velocity Checks:** Reject multiple distinct cards attempted with the same shipping address within a 1-hour window.

### 7.3 Handling Refunds & Returns with Bank Discounts
- If a customer purchases a shoe retailing for PKR 10,000 with a **15% HBL Bank Discount** (paying **PKR 8,500** net):
  - In the event of a customer size exchange: The exchange variant is issued at zero additional cost.
  - In the event of a full refund or return: The refund amount processed through Safepay/bank acquirer is strictly the **net charged amount (PKR 8,500)**. The bank discount is not convertible to cash.

---

## 8. Remaining Questions & Next Steps

1. **Gateways Decision:** Does Executive Mochi wish to launch with **Safepay** as the single primary modern gateway (fastest time-to-market, zero setup fees, modern `@sfpy/atoms` UI), or pursue parallel physical paperwork for **Bank Alfalah APG**?
2. **Bank Selection:** Which bank alliance should be prioritized first? (Recommendation: **Bank Alfalah** due to its integrated APG discount engine, followed by **HBL** for maximum volume).
3. **Discount Budget:** Confirm the proposed promotional discount parameters (e.g. 15% discount, PKR 5,000 minimum cart, PKR 2,000 maximum cap).
4. **Environment Keys:** Safepay sandbox credentials should be acquired from `https://sandbox.api.getsafepay.com` to test 3DS test card authentication end-to-end.
