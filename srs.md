**EXECUTIVE MOCHI**

E-Commerce Platform

*executivemochi.pk*

**SOFTWARE REQUIREMENTS SPECIFICATION**

Version 1.0 \| April 1, 2026 \| Status: Draft

  ----------------------- ------------------------------------------------------
  **Document Title**      Software Requirements Specification (SRS)

  **System**              Executive Mochi E-Commerce Platform

  **Version**             1.0

  **Date**                April 1, 2026

  **Status**              Draft

  **Prepared For**        Executive Mochi --- Development & Stakeholder Teams

  **Technology Stack**    Next.js 15 · tRPC · Prisma · PostgreSQL · TypeScript

  **Deployment**          Vercel (Frontend) · GCS (File Storage)
  ----------------------- ------------------------------------------------------

  -----------------------------------------------------------------------
  **REVISION HISTORY**

  -----------------------------------------------------------------------

  ------------- ---------------- ------------------ -------------------------------------------------------------------
  **Version**   **Date**         **Author**         **Description**

  0.1           March 15, 2026   Product Team       Initial draft --- core catalog, inventory, order management

  0.2           March 20, 2026   Product Team       Added logistics, payment gateway, and courier integration modules

  0.3           March 25, 2026   Product Team       Expanded multi-branch synchronization, returns management, CRM

  0.4           March 28, 2026   Product Team       Added Antigravity development framework requirements

  1.0           April 1, 2026    Product Team       Final version --- complete SRS with Prisma schema alignment
  ------------- ---------------- ------------------ -------------------------------------------------------------------

  -----------------------------------------------------------------------
  **1. INTRODUCTION**

  -----------------------------------------------------------------------

**1.1 Purpose**

This Software Requirements Specification (SRS) document provides a comprehensive blueprint for the development and operationalization of the Executive Mochi e-commerce platform (executivemochi.pk). The platform is a specialized footwear e-commerce system designed to manage shoe product listings, variant-level inventory across two distinct city branches (Pasrur and Daska), and deep integration with the Pakistani logistics and payment infrastructure.

This document serves as the authoritative reference for system development, quality assurance testing, and future enhancement planning. It defines the complete set of functional and non-functional requirements for the platform, with particular emphasis on the unique challenges of footwear inventory management --- characterized by deep SKU matrices (size-color-width combinations), multi-branch inventory synchronization, and Cash on Delivery (COD) payment workflows dominant in the Pakistani market.

**1.2 Document Conventions**

The following keyword conventions are used throughout this document to indicate requirement priority and obligation:

  ---------------- ----------------------------------- ----------------------------------------------------------------------------------------------
  **Keyword**      **Meaning**                         **Usage Context**

  **SHALL**        **Mandatory requirement**           Non-compliance constitutes a defect. All test cases MUST verify SHALL requirements.

  **SHOULD**       **Highly desirable**                Deviation from a SHOULD requirement requires documented justification from the project lead.

  **MAY**          **Optional feature**                Inclusion is at the discretion of the development team based on time and budget.

  **FR-XXX-NN**    **Functional requirement ID**       Prefix indicates module (e.g., CAT = Catalog, INV = Inventory, ORD = Orders).

  **NFR-XXX-NN**   **Non-functional requirement ID**   Prefix indicates category (e.g., PERF = Performance, SEC = Security).

  **IF-XXX-NN**    **Interface requirement ID**        Prefix indicates type (UI, HW, SW, COM).

  **DR-NN**        **Data requirement ID**             Covers Prisma schema integrity, validation, and transactions.
  ---------------- ----------------------------------- ----------------------------------------------------------------------------------------------

**1.3 Intended Audience and Reading Suggestions**

This document is intended for the following stakeholders. Each role is directed to the sections most relevant to their responsibilities:

  ------------------------------------------------- ------------------------------------------------------ --------------------------
  **Stakeholder**                                   **Primary Responsibility**                             **Key Sections**

  **Software Developers**                           Implement all defined features and system behaviours   3 (all), 4.3, 6.1

  **QA Engineers & Testers**                        Design test cases and acceptance criteria              3 (all), 5, 6.2

  **Project Managers**                              Manage scope, deliverables, and change requests        1, 2, 3.9

  **DB / System Administrators**                    Infrastructure, data model, and operational needs      2.4, 4, 6.1, 6.2

  **Branch Managers (Pasrur/Daska)**                Inventory management, order fulfillment, POS           3.2, 3.7, 3.8

  **Logistics Partners (PostEx, Leopards, Trax)**   Validate API integration specifications                3.4, 4.3, 7.2
  ------------------------------------------------- ------------------------------------------------------ --------------------------

**1.4 Product Scope**

The executivemochi.pk platform is designed to act as the central nervous system for Executive Mochi\'s retail operations, transforming physical stores in Pasrur and Daska into micro-fulfillment centers for nationwide e-commerce. The scope encompasses six integrated capability domains:

-   Matrix Product Catalog --- Creation and management of footwear products with size-color-width variations, automatic SKU generation, dynamic sizing guide, and high-resolution media management including 360-degree product views.

-   Multi-Branch Inventory Control --- Real-time stock synchronization across physical branches, inter-branch transfers with Digital Handshake workflow, low-stock alerting with configurable thresholds, and overselling prevention.

-   Mobile-First Storefront --- High-conversion checkout experience optimized for Pakistani consumers, supporting guest checkout, COD prioritization, and local payment gateways (Raast, JazzCash, EasyPaisa, Safepay).

-   Logistics Integration --- Automated airway bill generation with multiple courier partners (Leopards, PostEx, Trax, Pakistan Post), dynamic shipping cost calculation, real-time tracking synchronization, and COD reconciliation.

-   Returns and Exchange Management --- 7-day exchange policy workflow, store credit issuance, size exchange processing, and reverse logistics coordination.

-   Branch Management Portal --- Web-based interface for branch staff to manage orders, print shipping labels, conduct stock audits via barcode scanner, and record in-store POS sales.

**1.5 References**

The following standards, APIs, and frameworks inform the requirements specified in this document:

**\[1\]** Google Antigravity Documentation --- *https://antigravity.google/docs/home*

**\[2\]** Next.js Documentation --- *https://nextjs.org/docs*

**\[3\]** tRPC Documentation --- *https://trpc.io/docs*

**\[4\]** Prisma ORM Documentation --- *https://www.prisma.io/docs/*

**\[5\]** NextAuth.js Documentation --- *https://next-auth.js.org/*

**\[6\]** Leopards Courier API --- *https://www.leopardscourier.com/developer*

**\[7\]** PostEx API Documentation --- *https://postex.pk/developers*

**\[8\]** Trax Courier API --- *https://trax.pk/api-docs*

**\[9\]** Safepay Payment Gateway --- *https://safepay.pk/developers*

**\[10\]** JazzCash Business API --- *https://jazzcash.com.pk/business*

**\[11\]** Raast Payment System --- *https://raast.pk/developers*

**\[12\]** WCAG 2.1 Accessibility Guidelines --- *https://www.w3.org/TR/WCAG21/*

  -----------------------------------------------------------------------
  **2. OVERALL DESCRIPTION**

  -----------------------------------------------------------------------

**2.1 Product Perspective**

Executive Mochi is a specialized luxury footwear brand with physical retail locations in Pasrur and Daska (Punjab province, Pakistan). The e-commerce platform is not merely a digital catalog --- it is a full operational extension of the physical craft, unifying online and offline commerce into a single, coherent system. Each branch functions as both a retail store and a dark store (a fulfillment center for online orders), requiring seamless data synchronization between physical counters and the digital storefront.

The application follows a modern, type-safe full-stack architecture built on the T3 stack paradigm:

  --------------------------- ----------------------------------------------------------------------------------------------------------------------------------------
  **Layer**                   **Technology & Notes**

  **Frontend**                Next.js 15 (App Router) with React Server Components; Tailwind CSS for styling; shadcn/ui for component primitives.

  **API Layer**               tRPC providing fully type-safe, end-to-end API communication between client and server layers, eliminating API contract drift.

  **Data Layer**              Prisma ORM interfacing with a PostgreSQL database. Schema defined in Section 6.1 is the ground-truth data model.

  **Authentication**          NextAuth.js with Credentials Provider and JWT-based sessions. Role-based access enforced at the tRPC procedure level.

  **File Storage**            Google Cloud Storage (GCS) for product imagery, 360-degree videos, shipping labels, and PDF documents. Signed URL access for security.

  **External Integrations**   Courier APIs (Leopards, PostEx, Trax, Pakistan Post); Payment gateways (Safepay, JazzCash, Raast); SMS/WhatsApp gateway.

  **Development Platform**    Google Antigravity --- an agentic development IDE enabling autonomous AI agents to plan, implement, and verify features.
  --------------------------- ----------------------------------------------------------------------------------------------------------------------------------------

**2.2 Product Features**

The Executive Mochi E-Commerce Platform delivers seven integrated feature domains, each defined in detail in Section 3:

**1. Matrix Product Management ---** Creation of products with size-color-width variations, automatic SKU generation, dynamic sizing guide, and high-resolution media management.

**2. Multi-Branch Inventory Synchronization ---** Real-time stock tracking across Pasrur and Daska, inter-branch transfers with Digital Handshake, low-stock alerts, and overselling prevention.

**3. Order Management and Checkout ---** Guest checkout, COD prioritization, digital payment integration, order verification workflow, and automated tracking generation.

**4. Logistics and Fulfillment ---** Dynamic shipping cost calculation, multi-courier API integration, airway bill generation, tracking synchronization, and COD reconciliation dashboard.

**5. Returns and Exchanges ---** 7-day exchange policy workflow, store credit management, size exchange processing, and reverse logistics coordination.

**6. Customer Relationship Management ---** Size memory, purchase history, loyalty program integration (Bronze/Silver/Gold tiers), and personalized product recommendations.

**7. Branch Management Portal ---** Order fulfillment interface, barcode scanner support for stock audits, thermal printer integration, and in-store POS recording.

**2.3 User Classes and Characteristics**

  ------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ------------------------- ----------------------
  **User Role**                         **Primary Responsibilities**                                                                                                                                               **Technical Expertise**   **Access Scope**

  **Admin (Global)**                    Full system ownership: user lifecycle management, catalog configuration, financial governance, courier rate configuration, promotion management, and all system reports.   Moderate--High            All modules

  **Branch Manager (Pasrur / Daska)**   Branch operations: inventory management, order fulfillment, stock audits, inter-branch transfer initiation, shipping label printing, and COD reconciliation.               Basic--Moderate           Branch-scoped

  **Warehouse Staff**                   Fulfillment operations: picking, packing, dispatch confirmation, courier handover, and RTO (Return to Origin) processing.                                                  Basic                     Fulfillment queue

  **Customer**                          Self-service shopping: browse catalog, manage cart, checkout, view order history, initiate returns/exchanges, and manage profile.                                          Basic                     Storefront + profile
  ------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ------------------------- ----------------------

**2.4 Operating Environment**

  -------------------------- -------------------------------------------------------------------
  **Component**              **Specification**

  **Server Runtime**         Node.js LTS

  **Web Framework**          Next.js 15 (App Router architecture)

  **API Layer**              tRPC --- type-safe, end-to-end API communication

  **Database**               PostgreSQL (primary) with Prisma ORM

  **Authentication**         NextAuth.js with Credentials Provider; JWT-based sessions

  **File Storage**           Google Cloud Storage (GCS) with signed URL access

  **Client Runtime**         Modern web browser with HTML5, CSS3, and ES6+ JavaScript support

  **Mobile Support**         Responsive web design with mobile-optimized bottom-bar navigation

  **Development Platform**   Google Antigravity --- agentic development IDE

  **Hosting**                Vercel (frontend and serverless API routes)
  -------------------------- -------------------------------------------------------------------

**2.5 Design and Implementation Constraints**

**C-01:** The system SHALL be developed using Next.js 15, React, tRPC, Prisma ORM, and TypeScript as the core technology stack. No substitutions to these core technologies are permitted without a formal SRS revision.

**C-02:** Authentication SHALL be handled exclusively by NextAuth.js using the Credentials Provider. Third-party OAuth providers (Google, Facebook) MAY be added in future versions.

**C-03:** Styling SHALL utilise Tailwind CSS; shadcn/ui component primitives SHOULD be used for consistent UI across admin and customer-facing interfaces.

**C-04:** File uploads SHALL be managed via Google Cloud Storage using pre-signed URLs for secure, direct browser-to-storage uploads. No binary data SHALL pass through the application server.

**C-05:** PDF document generation (shipping labels, invoices, return forms, store credit vouchers) SHALL use the pdf-lib library.

**C-06:** The codebase architecture SHALL follow established T3 stack patterns including tRPC router organisation, Next.js server and client component separation, and Prisma query conventions.

**C-07:** The database schema SHALL remain aligned with the definitions in Section 6.1 (Prisma Schema). Any schema changes require a formal SRS revision.

**C-08:** All courier and payment gateway API keys SHALL be stored as environment variables, never committed to source control.

**2.6 Assumptions and Dependencies**

-   All branch locations (Pasrur, Daska) maintain reliable, persistent internet connectivity for all users accessing the Branch Management Portal.

-   All users access the system via modern, standards-compliant web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

-   All required environment variables (database connection URL, NextAuth secret, GCP credentials, courier API keys, payment gateway keys) are correctly configured in deployment environments.

-   A Google Cloud Platform account with appropriate IAM permissions for Cloud Storage bucket access is provisioned, maintained, and funded.

-   The Prisma schema is considered the ground-truth data model; any schema changes must be reflected in this SRS via a formal revision cycle.

-   Courier partners (Leopards, PostEx, Trax, Pakistan Post) maintain stable, documented APIs with at least 30-day notice for breaking changes.

-   Payment gateways (Safepay, JazzCash, Raast) maintain stable, documented APIs with appropriate sandbox/test environments available.

-   Pakistan Post\'s API coverage is limited to tracking only; AWB generation may require manual processes for this courier.

  -----------------------------------------------------------------------
  **3. SYSTEM FEATURES --- FUNCTIONAL REQUIREMENTS**

  -----------------------------------------------------------------------

**3.1 Matrix Product Management and Cataloging**

This module governs the creation, management, and customer-facing presentation of footwear products with size-color-width variations --- the system\'s core \"SKU matrix\" capability.

**3.1.1 Product Creation and Matrix Attributes**

**FR-CAT-01:** The system **SHALL** allow administrators to create \'Matrix Products\' where attributes --- size, color, and width --- are defined as variable parameters that drive automatic SKU generation.

**FR-CAT-02:** The system **SHALL** support the generation of unique SKUs for every combination of variant attributes, ensuring precise inventory tracking. SKU format SHALL be configurable (e.g., \[BRAND\]-\[STYLE\]-\[COLOR\]-\[SIZE\]-\[WIDTH\]).

**FR-CAT-03:** The system **SHALL** allow for product categorisation based on Occasion (Ethnic, Wedding, Sports, Formal, Casual) and Style (Loafers, Oxfords, Moccasins, Peshawari, Sandals, Sneakers).

**FR-CAT-04:** The system **SHALL** allow administrators to define all product master attributes, including: product name (unique), rich-text description, base price, category (Men/Women/Kids), occasion tags, style tags, leather type (Calf Skin, Goat Leather, Suede, Nubuck, Premium Synthetic), manufacturing city (Pasrur, Daska, or Imported), and SEO metadata (meta title, meta description, URL slug).

**FR-CAT-05:** The system **SHALL** support a configurable size range per product from a master size list covering UK/Pakistan sizes 36--46 for men and 34--42 for women, with half-size support where applicable.

**3.1.2 Variant Management**

**FR-CAT-06:** The system **SHALL** automatically generate all variant records when a product\'s matrix attributes are defined. Each variant SHALL include: unique SKU, multi-standard size (UK/Pakistan, US, EU, foot CM), color with hex code, width classification (Standard/Wide/Extra Wide), a price delta field for premium materials, and Active/Inactive status.

**FR-CAT-07:** The system **SHALL** allow administrators to individually override any variant attribute (price, SKU, active status) after automatic generation.

**FR-CAT-08:** The system **SHALL** allow administrators to bulk-update variant prices using either a percentage or fixed-amount adjustment.

**FR-CAT-09:** The system **SHALL** provide a variant matrix view displaying all variants in a grid --- color as columns, size as rows --- showing current inventory levels and price per cell.

**3.1.3 Media Management**

**FR-CAT-10:** The system **SHALL** support high-resolution \'Deep Zoom\' imagery allowing customers to examine leather texture and stitching quality at magnification.

**FR-CAT-11:** The system **SHALL** support 360-degree product videos for each product, stored in Google Cloud Storage and streamed to the frontend.

**FR-CAT-12:** The system **SHALL** allow administrators to upload multiple images per product, with the ability to designate a primary image and reorder images via drag-and-drop.

**FR-CAT-13:** The system **SHALL** support color-based imagery, where selecting a color variant automatically displays product images specific to that color.

**FR-CAT-14:** The system **SHALL** serve all product images optimised for web delivery in WebP format with responsive sizes (mobile, tablet, desktop) and lazy loading applied to off-screen images.

**3.1.4 Sizing Guide**

**FR-CAT-15:** The system **SHALL** provide a dynamic sizing guide that converts foot measurements in millimetres to the appropriate UK, US, or EU size used by the brand.

**FR-CAT-16:** The system **SHALL** include in the sizing guide: foot measurement instructions (how to measure foot length and width), size conversion tables (UK/Pakistan ↔ US ↔ EU), fit notes per product style (e.g., \'This style runs true to size\' or \'Size up one half-size\'), and a width guide for customers with wide feet.

**FR-CAT-17:** The system **SHALL** make the sizing guide accessible from all product detail pages and from the main navigation.

**3.1.5 Product Search and Filtering**

**FR-CAT-18:** The system **SHALL** provide a Product Listing Page (PLP) with advanced filtering for: size (by available sizes), color, price range, occasion, style, leather type, and \'In-Stock at My Nearest Branch\' using geolocation or customer\'s selected branch preference.

**FR-CAT-19:** The system **SHALL** support sorting of products by: Newest, Price (Low to High), Price (High to Low), Popularity, and Customer Rating.

**FR-CAT-20:** The system **SHALL** support a product search function with autocomplete suggestions based on product name, style, and occasion tags.

**3.2 Multi-Branch Inventory Synchronization**

This module governs real-time stock tracking across physical branches in Pasrur and Daska, inter-branch transfers with the Digital Handshake protocol, overselling prevention, and low-stock alerting.

**3.2.1 Branch Definition**

**FR-INV-01:** The system **SHALL** allow administrators to define branch locations with: branch name, city, complete address with landmark, contact phone number, manager name, operating hours, default shipping origin for cost calculation, and Active/Inactive status.

**FR-INV-02:** The system **SHALL** support a virtual \'Online Warehouse\' concept that aggregates stock visibility from all physical branches for a unified inventory view while tracking individual branch contributions.

**3.2.2 Real-Time Stock Tracking**

**FR-INV-03:** The system **SHALL** track inventory levels in real-time for each individual branch (Pasrur, Daska) and for the aggregate online warehouse view.

**FR-INV-04:** The system **SHALL** automatically decrement stock from the appropriate branch whenever: (a) an online order is fulfilled from that location, (b) an in-store sale is recorded via the Branch Management Portal, or (c) an inter-branch transfer outbound is confirmed.

**FR-INV-05:** The system **SHALL** automatically increment stock when: (a) an inter-branch transfer inbound is confirmed, (b) a return is processed and the item is restocked, or (c) an order cancellation is processed before dispatch.

**FR-INV-06:** The system **SHALL** maintain an immutable inventory transaction log recording: variant ID, branch ID, quantity change (positive or negative), transaction type (SALE, TRANSFER_OUT, TRANSFER_IN, RETURN, ADJUSTMENT, RESTOCK, DAMAGE_WRITE_OFF), reference ID (order/transfer/return ID), timestamp, and the user ID who performed the action.

**3.2.3 Overselling Prevention**

**FR-INV-07:** The system **SHALL** prevent overselling by checking inventory availability at the selected fulfillment branch before confirming any order. If insufficient stock exists at the nearest branch, the system SHALL either: (a) suggest an alternative fulfillment branch with available stock, (b) notify the customer of an extended delivery time, or (c) block checkout with a clear \'Out of Stock\' message.

**FR-INV-08:** The system **SHALL** reserve inventory for 24 hours during the COD verification process. Unverified orders SHALL automatically release reserved inventory back to available stock upon expiration of the verification window.

**3.2.4 Inter-Branch Stock Transfers (Digital Handshake)**

**FR-INV-09:** The system **SHALL** allow branch managers to initiate inter-branch stock transfers specifying: source branch, destination branch, variant and quantity, transfer reason, and scheduled transfer date.

**FR-INV-10:** The system **SHALL** implement the Digital Handshake workflow for all inter-branch transfers, comprising four stages: (1) Initiate --- source branch creates transfer, stock marked \'In Transit\' and removed from source available stock; (2) Dispatch --- source branch confirms physical dispatch; (3) Receive --- destination branch confirms physical receipt, stock added to destination inventory; (4) Reject --- destination branch can reject with documented reason, stock returns to source.

**FR-INV-11:** The system **SHALL** generate a transfer receipt PDF accompanying the physical shipment, including: Transfer ID, source and destination branch details, itemised list with SKU, description and quantity, dispatch date, and tracking number if a courier is used.

**3.2.5 Stock Alerts and Reporting**

**FR-INV-12:** The system **SHALL** allow administrators to define low-stock thresholds per variant per branch (configurable; default: 5 units).

**FR-INV-13:** The system **SHALL** generate Low Stock Alerts when a specific SKU falls below the defined threshold at any location. Alerts SHALL be displayed on the Admin dashboard, the relevant Branch Manager\'s dashboard, and delivered as an email digest to subscribed users.

**FR-INV-14:** The system **SHALL** provide the following inventory reports: stock level report (current inventory by branch and by variant), stock movement report (inflow/outflow over a configurable date range), slow-moving inventory report (items with no sales in X days, where X is configurable), best-sellers report by branch, and stock value report (quantity × cost price by branch).

**3.3 Order Management and Checkout Lifecycle**

This module governs the complete order lifecycle from cart to delivery, optimised for the Pakistani consumer with COD prioritisation, automated order verification to reduce RTO rates, and integration with local payment infrastructure.

**3.3.1 Shopping Cart**

**FR-ORD-01:** The system **SHALL** maintain a persistent shopping cart for both authenticated and guest users, storing cart contents server-side for logged-in users and in browser local storage for guests, with merge logic when a guest authenticates.

**FR-ORD-02:** The system **SHALL** display cart contents with: product image thumbnail, product name, selected variant (size, color, width), quantity selector, unit price, line subtotal, and a stock availability indicator for low-stock variants.

**FR-ORD-03:** The system **SHALL** allow customers to update quantities and remove items from the cart at any time before checkout.

**FR-ORD-04:** The system **SHALL** provide a cart summary including: subtotal, estimated shipping cost (calculated from customer\'s delivery city and parcel weight), order total, and a prominent \'Proceed to Checkout\' call-to-action.

**3.3.2 Checkout Process**

**FR-ORD-05:** The system **SHALL** support a Guest Checkout option to minimise cart abandonment. Guest customers SHALL be offered the option to create an account after order completion, pre-populated with the data entered during checkout.

**FR-ORD-06:** The system **SHALL** complete the checkout flow in no more than 4 steps from the cart: (1) Cart Review, (2) Shipping Address Entry, (3) Payment Method Selection, (4) Order Confirmation.

**FR-ORD-07:** The system **SHALL** collect the following customer information during checkout: full name, complete shipping address (street, city, province, postal code), phone number (required for courier contact and order verification), and email address (for order confirmation and tracking notifications).

**FR-ORD-08:** The system **SHALL** validate Pakistani addresses with province selection from a predefined list (Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, Gilgit-Baltistan, Azad Jammu and Kashmir).

**3.3.3 Payment Integration**

**FR-ORD-09:** The system **SHALL** integrate with the Raast instant payment gateway for real-time bank-to-bank transfers.

**FR-ORD-10:** The system **SHALL** integrate with local mobile wallet platforms: JazzCash Business API and EasyPaisa API.

**FR-ORD-11:** The system **SHALL** integrate with card payment gateways (Safepay, PayFast) for credit and debit card transactions.

**FR-ORD-12:** The system **SHALL** prioritise Cash on Delivery (COD) as the primary displayed payment method for Pakistani customers, with a clear in-line explanation of the verification process.

**FR-ORD-13:** The system **SHALL** redirect customers to the payment gateway for digital payments, capture payment confirmation via signed webhook, and update order status and payment status atomically upon successful receipt.

**3.3.4 Order Verification Workflow for COD**

To reduce fraudulent orders and RTO rates --- a critical operational concern in Pakistan\'s COD-dominant market --- the following automated verification workflow SHALL be implemented:

**FR-ORD-14:** The system **SHALL** implement an automated Order Verification workflow for COD orders: (1) Order placed with status PENDING_VERIFICATION; (2) System sends a verification message via WhatsApp and/or SMS containing a 6-digit code or confirmation link; (3) Customer confirms order by responding within 24 hours; (4) Upon confirmation, order status transitions to VERIFIED and proceeds to fulfillment; (5) If no confirmation within 24 hours, order status transitions to CANCELLED_VERIFICATION_FAILED and reserved inventory is released.

**FR-ORD-15:** The system **SHALL** make the verification workflow configurable per order value threshold (e.g., orders above Rs. 10,000 require verification; orders below a configurable minimum are automatically verified).

**3.3.5 Shipping Cost Calculation**

**FR-ORD-16:** The system **SHALL** calculate shipping costs dynamically based on: parcel weight (aggregated from product weights of all items in the order), distance or zone between the fulfillment branch and the delivery address, selected courier service, and a configurable free-shipping order value threshold.

**FR-ORD-17:** The system **SHALL** display shipping costs clearly at checkout with a breakdown when multiple shipping options are offered.

**3.3.6 Order Tracking and Notifications**

**FR-ORD-18:** The system **SHALL** generate a unique order tracking number for each order, displayed in the customer\'s order history and sent via email/SMS upon order confirmation.

**FR-ORD-19:** The system **SHALL** automatically send order status notifications at the following lifecycle events: Order Confirmed (email/SMS), Order Verified (SMS), Order Packed (email), Order Shipped (email/SMS with tracking link), Out for Delivery (SMS), Delivered (email/SMS), and Cancelled (email/SMS with reason).

**FR-ORD-20:** The system **SHALL** provide a public order tracking page accessible via tracking number (no login required), displaying the current status and a complete status timeline with timestamps.

**3.4 Logistics and Fulfillment Management**

This module governs integration with Pakistani courier partners, automated airway bill generation, dispatch workflow, and COD settlement reconciliation.

**3.4.1 Courier Integration**

**FR-LOG-01:** The system **SHALL** integrate with the following courier services via their respective APIs: Leopards Courier (primary national partner), PostEx (COD upfront settlement specialist), Trax Courier (tech-driven urban partner), and Pakistan Post (rural area coverage).

**FR-LOG-02:** The system **SHALL** for each courier, perform the following automated operations: generate airway bills (AWB) when an order is marked ready for dispatch, print shipping labels in 4×6 inch format with barcode, transmit tracking information to the customer, and receive tracking status updates via webhook or scheduled polling.

**FR-LOG-03:** The system **SHALL** allow branch staff to select the optimal courier per order based on: delivery address (city and area), parcel weight, COD amount (some couriers have a maximum COD value), and required delivery speed.

**3.4.2 Automated Dispatch Workflow**

**FR-LOG-04:** The system **SHALL** provide a \'Ready to Dispatch\' queue in the Branch Management Portal, surfacing all orders that are: verified (for COD) or paid (for digital payments), have inventory allocated, and are assigned to the fulfillment branch.

**FR-LOG-05:** The system **SHALL** allow fulfillment staff to perform the following actions on each queued order: print picking list (items with SKU and quantity), print packing slip (for inclusion in the customer\'s package), generate AWB via the selected courier API, print the 4×6 inch shipping label, and mark the order as \'Packed\'.

**FR-LOG-06:** The system **SHALL** update order status to SHIPPED, send a tracking notification to the customer, record the courier name and AWB number, and initiate a webhook subscription for tracking updates when an order is marked \'Handover to Courier\'.

**3.4.3 COD Reconciliation Dashboard**

**FR-LOG-07:** The system **SHALL** provide a COD Reconciliation Dashboard accessible to Admin and Branch Managers, showing: all COD orders with current payment status, orders categorised by stage (Picked Up by Courier, In Transit, Delivered, Cash Received), courier settlement status with amounts, and an aging analysis (days since delivery vs. settlement date).

**FR-LOG-08:** The system **SHALL** allow branch managers to manually mark COD parcels as \'Picked Up by Courier\' and reconcile \'Cash Received\' against courier settlement transfers.

**FR-LOG-09:** The system **SHALL** integrate with PostEx\'s upfront COD settlement API to automatically reflect settlement amounts and dates in the reconciliation dashboard, reducing manual reconciliation effort.

**3.4.4 Return to Origin (RTO) Management**

**FR-LOG-10:** The system **SHALL** when a courier reports an RTO event via API webhook or manual entry: update order status to RTO, mark inventory as \'In Transit Return\' pending physical receipt and then add back to source branch inventory, automatically initiate customer refund for digital payments or issue store credit for COD orders, and send an RTO notification to the customer explaining the refund or credit process.

**FR-LOG-11:** The system **SHALL** provide an RTO analytics dashboard showing: RTO rate by courier, by branch, and by reason; financial impact of RTO events (shipping costs lost, handling costs); and a customer RTO history view for flagging high-risk orders.

**3.5 Returns and Exchanges**

This module governs the return and exchange policy workflow, which is essential for building customer trust in footwear e-commerce given the inherent fit risk of online shoe purchasing.

**3.5.1 Return/Exchange Policy Configuration**

**FR-EXC-01:** The system **SHALL** allow administrators to configure the return and exchange policy with: exchange window in days (default: 7 days from delivery confirmation), eligible return reasons (Size does not fit, Damaged product, Wrong product received, Changed mind), product condition requirements, return shipping fee policy (customer pays or brand covers), and permitted refund methods (exchange for different size, exchange for different product, store credit, cash refund for digital payments only).

**3.5.2 Return/Exchange Initiation**

**FR-EXC-02:** The system **SHALL** allow customers to initiate a return or exchange directly from their order history page by selecting an eligible order and clicking \'Return/Exchange\'.

**FR-EXC-03:** The system **SHALL** present a return initiation form capturing: items to return (selectable from order line items), return reason with an optional text field for additional detail, preferred resolution type (Exchange Size, Exchange Product, Store Credit, Refund), and the specific exchange target if applicable.

**FR-EXC-04:** The system **SHALL** validate exchange eligibility at the point of submission, confirming: the order is within the exchange window, the product is not marked as a final-sale item, and the requested exchange size or replacement product is in stock.

**FR-EXC-05:** The system **SHALL** generate a return request record with status PENDING_APPROVAL upon successful submission, and send an acknowledgement to the customer.

**3.5.3 Return Approval and Processing**

**FR-EXC-06:** The system **SHALL** present a return request queue to Admin and Branch Managers showing: order number, customer name, items requested for return, stated reason, and request submission date.

**FR-EXC-07:** The system **SHALL** allow Admin to: approve a return request with instructions to the customer (return shipping address, packaging instructions), reject a return request with a documented reason communicated to the customer, or request additional information from the customer.

**FR-EXC-08:** The system **SHALL** upon return approval: send return shipping instructions to the customer, generate a pre-paid return shipping label if the brand is covering return shipping costs, and create a return tracking record.

**3.5.4 Return Receipt and Fulfilment**

**FR-EXC-09:** The system **SHALL** allow branch staff to mark a returned package as RECEIVED and initiate a physical item inspection upon arrival.

**FR-EXC-10:** The system **SHALL** allow staff to accept or reject individual returned items: accepted items meet condition requirements; rejected items are photographed and the customer is informed with photographic evidence.

**FR-EXC-11:** The system **SHALL** upon accepted return: process the customer\'s chosen resolution --- (a) Exchange: create a new outbound order for the replacement product, deduct from inventory, and generate a new tracking number; (b) Store Credit: create and issue a store credit voucher; (c) Refund: initiate refund via the original digital payment method.

**FR-EXC-12:** The system **SHALL** generate a formal credit note/store credit voucher containing: unique voucher code, customer name, original order number, credit amount, issue date, expiry date (configurable; default 6 months), and applicable terms and conditions.

**3.5.5 Store Credit Management**

**FR-EXC-13:** The system **SHALL** allow customers to view their complete store credit balance in their profile, including: total available credit, credit history (issued, redeemed, expired credits with dates), and individual credit expiry dates.

**FR-EXC-14:** The system **SHALL** allow customers to apply store credit at checkout. The system SHALL validate: the credit code is valid and active, the credit has not expired, the credit has not been previously redeemed, and the amount applied does not exceed the order total.

**3.6 Customer Management and CRM**

This module governs customer profiles, purchase history, size memory --- a key differentiator for footwear e-commerce --- and the loyalty programme.

**3.6.1 Customer Registration and Profile**

**FR-CRM-01:** The system **SHALL** allow customers to register with: email address (unique identifier for login), bcrypt-hashed password, full name, phone number, and newsletter subscription preference.

**FR-CRM-02:** The system **SHALL** maintain customer profiles containing: multiple shipping addresses with a default designation, default billing address, automatically inferred size preferences per style, and algorithmically derived style preferences based on browsing and purchase history.

**3.6.2 Size Memory**

**FR-CRM-03:** The system **SHALL** automatically record the purchased size for each product style (Oxford, Loafer, Sneaker, etc.) against the customer\'s profile following each order delivery.

**FR-CRM-04:** The system **SHALL** when a logged-in customer views a product detail page: display a \'Your Size\' recommendation based on prior purchases of the same style, pre-select the recommended size in the variant selector, and show a contextual fit note (e.g., \'Based on your Oxford in size 42, we recommend size 42 for this style\').

**FR-CRM-05:** The system **SHALL** allow customers to view and manage their complete size profile --- including saved sizes per style, custom size notes (e.g., \'I prefer a loose fit\'), and a default size setting for all styles.

**3.6.3 Order History**

**FR-CRM-06:** The system **SHALL** allow customers to view their complete order history with: order date, unique order number, current order status, itemised list of products (with images, variant details, and unit price), shipping address, tracking number with link to the carrier\'s tracking portal, order total, payment method, and a contextual Return/Exchange button if within the policy window.

**3.6.4 Loyalty Programme**

**FR-CRM-07:** The system **SHALL** support a points-based loyalty programme where customers earn points on every purchase (configurable accrual rate; e.g., 1 point per Rs. 100 spent), can redeem points for discounts on future purchases, and are subject to a configurable points expiry policy (default: 12 months). Tiered loyalty levels (Bronze, Silver, Gold) SHALL offer tier-specific benefits configurable by Admin.

**FR-CRM-08:** The system **SHALL** make loyalty points redeemable at both the online checkout and at physical branches via the Branch Management POS interface, with real-time balance synchronisation.

**3.7 Branch Management Portal**

This module provides a web-based interface for branch staff to manage orders, inventory, POS transactions, and returns at their respective Pasrur or Daska locations.

**3.7.1 Branch Dashboard**

**FR-BRN-01:** The system **SHALL** provide Branch Managers with a branch-specific dashboard displaying: today\'s orders pending fulfilment, ready-to-dispatch count, low-stock alerts for the branch, in-store sales for today (total value and number of transactions), and pending return requests to process.

**3.7.2 Order Fulfilment**

**FR-BRN-02:** The system **SHALL** allow Branch Managers to view all orders assigned to their branch with filters for: status, date range, order type (Online vs. In-Store), and payment method.

**FR-BRN-03:** The system **SHALL** enable branch staff to: view full order details, print a picking list, print a packing slip, mark an order as Packed, generate an AWB via the courier API, print the 4×6 inch shipping label, and mark the order as \'Handover to Courier\' with AWB number. Staff SHALL also be able to add internal fulfilment notes to any order.

**3.7.3 Stock Management**

**FR-BRN-04:** The system **SHALL** allow Branch Managers to view current stock levels for their branch, searchable by product name, SKU, or barcode scan, with filters for category, size, and color.

**FR-BRN-05:** The system **SHALL** support USB/Bluetooth barcode scanners for: stock audits (scan barcode to record physical count), receiving new stock, order picking verification (scan barcode to confirm correct item is being packed), and return processing (scan barcode to identify the returned item).

**FR-BRN-06:** The system **SHALL** allow Branch Managers to perform stock adjustments with a mandatory reason code: Damage Write-Off, Inventory Correction (count discrepancy), Sample Removal, or Return to Vendor.

**3.7.4 In-Store Point of Sale (POS)**

**FR-BRN-07:** The system **SHALL** provide an in-store POS interface for recording sales at physical branches, tightly integrated with the online inventory and customer profile systems.

**FR-BRN-08:** The system **SHALL** allow POS staff to: search for products by name, SKU, or barcode scan; add items to the POS cart with full variant selection; apply customer loyalty discounts and redeem loyalty points; apply store credit vouchers; calculate totals; record payment (Cash, Card, JazzCash/EasyPaisa); generate a thermal receipt; and automatically decrement inventory from the branch.

**FR-BRN-09:** The system **SHALL** create order records in the system of type IN_STORE for every POS transaction, linking each sale to the branch for inventory, revenue, and audit reporting.

**3.7.5 Return Processing at Branch**

**FR-BRN-10:** The system **SHALL** allow Branch Managers to process online returns: scan the return request code, verify returned items against the approved return request, inspect condition, and process the approved resolution (exchange or store credit).

**FR-BRN-11:** The system **SHALL** allow staff to process walk-in in-store returns by: looking up the original order by phone number or order number, validating return eligibility (within window and product condition), processing the refund or exchange, and triggering inventory restock.

**3.7.6 Thermal Printer Integration**

**FR-BRN-12:** The system **SHALL** support printing of 4×6 inch shipping labels from the browser-based Branch Portal to thermal printers (Zebra, Brother) without requiring additional software installation --- implemented via the browser\'s native print API with a label-optimised CSS print stylesheet.

**FR-BRN-13:** The system **SHALL** support printing of in-store POS receipts on 80mm thermal receipt printers.

**3.8 Customer Dashboard and Self-Service Functions**

**3.8.1 Dashboard Overview**

**FR-CUS-01:** The system **SHALL** provide logged-in customers with a dashboard showing: the three most recent orders with status badges, store credit balance with a link to credit history, loyalty points balance with tier status, wishlist item count, and a personalised \'Recommended for You\' product carousel.

**3.8.2 Address Management**

**FR-CUS-02:** The system **SHALL** allow customers to manage multiple shipping addresses: add new, edit existing, delete, and designate a default delivery address.

**3.8.3 Wishlist**

**FR-CUS-03:** The system **SHALL** allow customers to maintain a wishlist: add products from PLP or PDP, view the wishlist with images and prices, move items directly to cart, and remove items. A wishlist sharing link MAY be supported for future gifting features.

**3.8.4 Account Settings**

**FR-CUS-04:** The system **SHALL** allow customers to: update profile information (name, email, phone number), change password with current-password verification, manage newsletter subscription preferences, and view saved payment method tokens (card and wallet, via tokenisation --- no raw card data stored).

**3.8.5 Product Reviews**

**FR-CUS-05:** The system **SHALL** allow customers to submit reviews only for products they have purchased and received: 1--5 star rating, text review, and optional product photo upload. Reviews SHALL be held for Admin moderation before appearing on the product detail page.

**3.9 Antigravity Development Requirements**

This module defines requirements specific to development within the Google Antigravity agentic development platform, governing how autonomous AI agents orchestrate, build, verify, and maintain the codebase.

**3.9.1 Agent Orchestration**

**FR-ANT-01:** The system **SHALL** utilise the Antigravity Agent Manager to spawn multiple agents working asynchronously on separate feature domains: inventory sync logic, payment gateway integration, courier API integrations, frontend UI components, and Prisma schema migrations.

**FR-ANT-02:** The system **SHALL** assign agent tasks with clear boundaries, explicit acceptance criteria, and documented inter-task dependencies captured in agent task manifests committed to the repository.

**3.9.2 Artifact-Driven Verification**

**FR-ANT-03:** The system **SHALL** produce an Artifact for every developed feature containing: a structured task list with acceptance criteria, an implementation plan with technical approach, a verification report with test results, and a code review checklist.

**FR-ANT-04:** The system **SHALL** store all Artifacts in the repository to enable human developers to audit how agents handled complex scenarios such as multi-location stock calculations and matrix product SKU logic.

**3.9.3 Browser-Based End-to-End Testing**

**FR-ANT-05:** The system **SHALL** utilise the Antigravity integrated Browser Agent to perform automated end-to-end UI testing simulating: (a) a Daska customer adding shoes to cart and completing a COD checkout, (b) a Pasrur Branch Manager processing an order and printing a shipping label, (c) a customer initiating a return for size exchange, and (d) an Admin configuring a new product with a full variant matrix.

**FR-ANT-06:** The system **SHALL** capture browser test executions as replayable recordings for regression testing on each deployment.

**3.9.4 Automated Debugging and Maintenance**

**FR-ANT-07:** The system **SHALL** instruct agents to respond to external API breaking changes (e.g., a PostEx API version change) by: automatically identifying the breakage via monitoring alerts, analysing the API diff to propose targeted code fixes, verifying the fix across the codebase with unit and integration tests, and generating a pull request for human review before merge.

**FR-ANT-08:** The system **SHALL** maintain an Agent Log of all automated interventions --- including the trigger event, proposed fix, tests run, and outcome --- for audit, debugging, and continuous improvement purposes.

  -----------------------------------------------------------------------
  **4. EXTERNAL INTERFACE REQUIREMENTS**

  -----------------------------------------------------------------------

**4.1 User Interfaces**

**IF-UI-01:** The system **SHALL** utilise a clean, premium aesthetic with high-contrast typography and minimalist navigation, conveying the Executive Mochi brand as a luxury footwear label. Design tokens (color palette, typography scale, spacing) SHALL be defined as Tailwind CSS theme extensions.

**IF-UI-02:** The system **SHALL** be fully responsive, adapting layouts fluidly for desktop (1280px+), tablet (768--1279px), and mobile (320--767px) screen sizes.

**IF-UI-03:** The system **SHALL** implement mobile navigation as a fixed bottom-bar menu (Home, Search, Cart, Profile) to facilitate one-handed smartphone usage.

**IF-UI-04:** The system **SHALL** present the Product Listing Page with advanced inline filtering panels for size, color, price range, occasion, and In-Stock at Nearest Branch.

**IF-UI-05:** The system **SHALL** present the Product Detail Page with: high-resolution Deep Zoom imagery, 360-degree video player, variant selection controls with visual indicators of stock availability, a sizing guide trigger, \'Add to Cart\' and \'Add to Wishlist\' actions, and approved customer reviews with ratings.

**IF-UI-06:** The system **SHALL** provide immediate, clear visual feedback on all user actions, including skeleton loading states for asynchronous operations, toast notifications for success and error events, and descriptive inline validation messages for form inputs.

**IF-UI-07:** The system **SHALL** render role-based navigation menus that dynamically surface only the sections accessible to the currently authenticated user\'s role, with no dead-end links to unauthorised areas.

**4.2 Hardware Interfaces**

**IF-HW-01:** The system **SHALL** support standard USB and Bluetooth barcode scanners in the Branch Management Portal for rapid stock audits, order dispatch verification, and return processing. Scanners shall function as keyboard input devices; no proprietary drivers are required.

**IF-HW-02:** The system **SHALL** support printing of 4×6 inch shipping labels to thermal printers (Zebra ZD series, Brother QL series) from the browser-based portal using the Web Print API and label-optimised print stylesheets.

**IF-HW-03:** The system **SHALL** support 80mm thermal receipt printing for in-store POS transactions.

**4.3 Software Interfaces**

  -------------- ----------------------------- ---------------------------------------------------------------------------------------------------
  **Ref**        **System**                    **Integration Scope**

  **IF-SW-01**   **Safepay / PayFast**         Card and wallet transactions; PCI-DSS compliant tokenisation; webhook-based payment confirmation.

  **IF-SW-02**   **JazzCash Business API**     Mobile wallet payment initiation and confirmation; transaction status polling.

  **IF-SW-03**   **Raast Payment System**      Instant bank-to-bank transfers; real-time settlement notifications.

  **IF-SW-04**   **Leopards Courier API**      AWB generation, tracking status polling, and label data retrieval.

  **IF-SW-05**   **PostEx API**                AWB generation, upfront COD settlement data, and tracking webhooks.

  **IF-SW-06**   **Trax Courier API**          AWB generation, real-time tracking webhooks, and merchant portal integration.

  **IF-SW-07**   **Pakistan Post API**         Tracking status polling only (AWB may require manual entry).

  **IF-SW-08**   **SMS/WhatsApp Gateway**      Transaction alerts, order verification codes, and shipping notifications via Sonic/Swyft/Twilio.

  **IF-SW-09**   **Prisma ORM + PostgreSQL**   Type-safe database access for all models; transaction management via Prisma \$transaction API.

  **IF-SW-10**   **Google Cloud Storage**      Pre-signed URL uploads for product images, 360-degree videos, and generated PDFs.

  **IF-SW-11**   **pdf-lib**                   Server-side PDF generation for shipping labels, packing slips, invoices, and credit vouchers.

  **IF-SW-12**   **NextAuth.js**               JWT session management; Credentials Provider; role-based session claims.
  -------------- ----------------------------- ---------------------------------------------------------------------------------------------------

**4.4 Communications Interfaces**

**IF-COM-01:** The system **SHALL** conduct all client-server communication exclusively over HTTPS with TLS 1.2 or higher, ensuring data confidentiality and integrity in transit.

**IF-COM-02:** The system **SHALL** use the tRPC protocol for all application API communication, providing end-to-end TypeScript type safety between the Next.js client and server layers.

**IF-COM-03:** The system **SHALL** implement courier and payment gateway webhook receivers as secure, authenticated endpoints that validate incoming request signatures before processing any payload.

**IF-COM-04:** Real-time order status updates MAY be implemented using WebSocket connections or Server-Sent Events in future implementation phases, once the baseline webhook-based system is stable and load-tested.

  -----------------------------------------------------------------------
  **5. NON-FUNCTIONAL REQUIREMENTS**

  -----------------------------------------------------------------------

**5.1 Performance Requirements**

  ----------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Req ID**        **Requirement**

  **NFR-PERF-01**   Page Load Time: The initial landing page SHALL load within 3 seconds on a standard 3G/4G mobile connection in Pakistan, measured using Google Lighthouse with a throttled connection simulation.

  **NFR-PERF-02**   Concurrency: The system SHALL support at least 1,000 simultaneous users without degradation in response time, with particular emphasis on peak sale events (Eid, Black Friday, Harness Day).

  **NFR-PERF-03**   API Latency: Internal API response times for inventory availability checks SHALL be under 500ms p95, ensuring a snappy experience for both store staff using POS and customers checking stock.

  **NFR-PERF-04**   Checkout Performance: The checkout flow SHALL complete order placement within 10 seconds from \'Proceed to Checkout\' to Order Confirmation screen.

  **NFR-PERF-05**   Image Delivery: Product images SHALL be served in WebP format with responsive sizes generated at build time; lazy loading SHALL be implemented for all off-screen images.
  ----------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5.2 Security Requirements**

**NFR-SEC-01:** Data Encryption: All sensitive data including customer addresses, transaction history, and payment information SHALL be encrypted at rest (database-level encryption) and in transit via TLS 1.2+.

**NFR-SEC-02:** PCI-DSS Compliance: The system SHALL comply with PCI-DSS for all card transactions. Card data SHALL never be stored on Executive Mochi servers; tokenisation SHALL be handled exclusively by payment gateways.

**NFR-SEC-03:** Account Lockout: The system SHALL implement a lockout policy after five consecutive failed login attempts, locking the account for 15 minutes and sending an email alert to the account owner.

**NFR-SEC-04:** Role-Based Access Control: Access to financial reports, inventory adjustment logs, and system configuration SHALL be strictly restricted to the Admin role. tRPC procedures SHALL enforce role checks server-side on every request.

**NFR-SEC-05:** Password Storage: All user passwords SHALL be stored exclusively as bcrypt hashes with a minimum cost factor of 10. Plain-text passwords SHALL never be persisted, logged, or transmitted.

**NFR-SEC-06:** Input Validation: All user-supplied input SHALL be validated and sanitised on the server side using Zod schemas prior to any database interaction, to prevent SQL injection, XSS, and related injection attacks.

**NFR-SEC-07:** API Authentication: All tRPC procedures and API endpoints SHALL require valid JWT authentication except for explicitly designated public-facing catalog endpoints. JWT tokens SHALL be validated on every request.

**NFR-SEC-08:** Environment Variable Security: All API keys, database credentials, and secrets SHALL be stored as environment variables, never committed to source control. A .env.example file SHALL document required variables without values.

**5.3 Usability Requirements**

**NFR-USA-01:** Checkout Flow Brevity: The complete checkout flow SHALL be completable in no more than 4 steps from the shopping cart page to the order confirmation screen.

**NFR-USA-02:** Localised Sizing: The system SHALL default to UK/Pakistan sizing throughout all interfaces, with a clear toggle to convert to US or EU sizes on product detail pages and the sizing guide.

**NFR-USA-03:** Keyboard Navigation: All administrative interfaces (Admin Panel, Branch Portal) SHALL be fully navigable via keyboard, supporting fast data entry workflows for branch managers.

**NFR-USA-04:** Mobile Optimisation: All interactive elements SHALL have a minimum tap target size of 44×44 pixels per Apple HIG and Google Material Design guidelines.

**NFR-USA-05:** Error Communication: Error messages SHALL be clear, specific, and actionable --- describing what went wrong and, where applicable, indicating the corrective action the user should take.

**5.4 Reliability Requirements**

**NFR-REL-01:** Availability: The system SHOULD target a minimum availability of 99.5% uptime measured monthly, excluding scheduled maintenance windows announced with at least 24 hours\' notice.

**NFR-REL-02:** Graceful Degradation: The system SHALL handle courier API failures gracefully. If a courier API is unavailable, orders SHALL still be accepted and fulfillment SHALL proceed via manual AWB entry with a clear fallback workflow.

**NFR-REL-03:** Transactional Integrity: All multi-step database operations (order creation with inventory decrement, inter-branch transfers, return processing) SHALL be executed within a single Prisma \$transaction to ensure atomicity and prevent partial state.

**NFR-REL-04:** Backup: Automated, tested database backups SHALL be performed at minimum daily, retained for a minimum of 30 days, and stored in a geographically separate GCS bucket from the primary database.

**5.5 Maintainability Requirements**

**NFR-MNT-01:** Coding Standards: The codebase SHALL adhere to a defined ESLint configuration with TypeScript strict mode, enforced via pre-commit hooks using Husky and lint-staged.

**NFR-MNT-02:** Documentation: All non-trivial functions, tRPC procedures, and React components SHALL include JSDoc comments describing their purpose, parameters, and return values.

**NFR-MNT-03:** Modular Architecture: The system SHALL follow a modular structure with concerns separated by tRPC router module, Next.js page/component, and Prisma data model. No cross-module direct database calls outside of designated tRPC procedures are permitted.

**NFR-MNT-04:** Testing: Automated unit and integration tests SHOULD be implemented using Vitest, targeting a minimum of 70% code coverage for critical business logic (inventory synchronisation, order management, payment processing).

**5.6 Scalability Requirements**

**NFR-SCA-01:** Horizontal Scaling: The application architecture SHOULD support horizontal scaling of the Next.js serverless function tier behind a load balancer, enabling multiple instances to handle peak traffic without configuration changes.

**NFR-SCA-02:** Database Scalability: The Prisma schema SHALL be designed to accommodate substantial growth --- from 500 to 5,000+ active SKUs, from 2 to 50+ branches, and from hundreds to tens of thousands of daily orders --- without requiring schema redesign.

**NFR-SCA-03:** Multi-Branch Architecture: Adding a new branch SHALL require only a new Branch record via the Admin portal. No code changes or schema migrations SHALL be required to onboard a new physical location.

**NFR-SCA-04:** Containerisation: The system SHOULD be containerised using Docker with a docker-compose configuration for local development and a Kubernetes-compatible deployment manifest for production scaling.

**5.7 Accessibility Requirements**

**NFR-ACC-01:** WCAG Compliance: The customer-facing storefront and all administrative interfaces SHOULD conform to WCAG 2.1 Level AA standards to the greatest practicable extent.

**NFR-ACC-02:** Keyboard Navigation: All interactive UI elements SHALL be fully navigable and operable using a standard keyboard, with visible focus indicators at all times.

**NFR-ACC-03:** Alternative Text: All non-decorative images, icons, and product images SHALL include descriptive alt attributes for screen reader compatibility.

**NFR-ACC-04:** Colour Contrast: All foreground text and background colour pairings SHALL meet a minimum contrast ratio of 4.5:1 for normal-sized text and 3:1 for large text, as defined by WCAG 2.1 Success Criterion 1.4.3.

  -----------------------------------------------------------------------
  **6. DATA REQUIREMENTS AND SCHEMA**

  -----------------------------------------------------------------------

**6.1 Data Requirements --- Prisma Schema**

The Executive Mochi platform\'s data architecture is defined by the Prisma schema below. This schema serves as the ground-truth data model; all application code and database migrations SHALL conform to these definitions. Any schema change requires a formal SRS revision.

**6.1.1 Core Entity Models**

**User Model**

> model User {
>
> id String \@id \@default(cuid())
>
> email String \@unique
>
> password String // bcrypt hashed
>
> name String
>
> phone String?
>
> role UserRole \@default(CUSTOMER)
>
> isActive Boolean \@default(true)
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> customerProfile Customer?
>
> branchManager BranchManager?
>
> orders Order\[\]
>
> cartItems CartItem\[\]
>
> wishlistItems WishlistItem\[\]
>
> returnRequests ReturnRequest\[\]
>
> stockAdjustments StockAdjustment\[\]
>
> @@map(\"users\")
>
> }
>
> enum UserRole {
>
> CUSTOMER
>
> BRANCH_MANAGER
>
> ADMIN
>
> WAREHOUSE_STAFF
>
> }

**Branch Model**

> model Branch {
>
> id String \@id \@default(cuid())
>
> name String // \"Pasrur Branch\", \"Daska Branch\"
>
> city String
>
> address String
>
> landmark String?
>
> phone String
>
> managerName String
>
> operatingHours String?
>
> isActive Boolean \@default(true)
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> branchManager BranchManager?
>
> inventory Inventory\[\]
>
> orders Order\[\]
>
> stockTransfersOut StockTransfer\[\] \@relation(\"SourceBranch\")
>
> stockTransfersIn StockTransfer\[\] \@relation(\"DestinationBranch\")
>
> @@map(\"branches\")
>
> }
>
> model BranchManager {
>
> id String \@id \@default(cuid())
>
> userId String \@unique
>
> branchId String
>
> user User \@relation(fields: \[userId\], references: \[id\])
>
> branch Branch \@relation(fields: \[branchId\], references: \[id\])
>
> @@map(\"branch_managers\")
>
> }

**Customer Model**

> model Customer {
>
> id String \@id \@default(cuid())
>
> userId String \@unique
>
> dateOfBirth DateTime?
>
> newsletterOptIn Boolean \@default(false)
>
> loyaltyPoints Int \@default(0)
>
> loyaltyTier LoyaltyTier \@default(BRONZE)
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> user User \@relation(fields: \[userId\], references: \[id\])
>
> addresses Address\[\]
>
> orders Order\[\]
>
> cartItems CartItem\[\]
>
> wishlistItems WishlistItem\[\]
>
> reviews Review\[\]
>
> returnRequests ReturnRequest\[\]
>
> sizePreferences SizePreference\[\]
>
> storeCredits StoreCredit\[\]
>
> @@map(\"customers\")
>
> }
>
> enum LoyaltyTier { BRONZE SILVER GOLD }

**6.1.2 Product Models**

**Product and ProductVariant Models**

> model Product {
>
> id String \@id \@default(cuid())
>
> name String \@unique
>
> slug String \@unique
>
> description String \@db.Text
>
> basePrice Decimal \@db.Decimal(10, 2)
>
> category ProductCategory
>
> occasion Occasion\[\]
>
> style Style
>
> leatherType LeatherType
>
> manufacturingCity String
>
> metaTitle String?
>
> metaDescription String?
>
> isActive Boolean \@default(true)
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> variants ProductVariant\[\]
>
> images ProductImage\[\]
>
> reviews Review\[\]
>
> wishlistItems WishlistItem\[\]
>
> @@map(\"products\")
>
> }
>
> model ProductVariant {
>
> id String \@id \@default(cuid())
>
> productId String
>
> sku String \@unique
>
> sizeUK String
>
> sizeUS String
>
> sizeEU String
>
> sizeCM String
>
> color String
>
> colorHex String
>
> width Width \@default(STANDARD)
>
> priceDelta Decimal \@db.Decimal(10, 2) \@default(0)
>
> isActive Boolean \@default(true)
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> product Product \@relation(fields: \[productId\], references: \[id\])
>
> inventory Inventory\[\]
>
> cartItems CartItem\[\]
>
> orderItems OrderItem\[\]
>
> transactions InventoryTransaction\[\]
>
> @@map(\"product_variants\")
>
> }

**6.1.3 Inventory Models**

> model Inventory {
>
> id String \@id \@default(cuid())
>
> branchId String
>
> variantId String
>
> quantity Int \@default(0)
>
> reserved Int \@default(0)
>
> lowStockThreshold Int \@default(5)
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> branch Branch \@relation(fields: \[branchId\], references: \[id\])
>
> variant ProductVariant \@relation(fields: \[variantId\], references: \[id\])
>
> @@unique(\[branchId, variantId\])
>
> @@map(\"inventory\")
>
> }
>
> model InventoryTransaction {
>
> id String \@id \@default(cuid())
>
> variantId String
>
> branchId String
>
> quantity Int // positive = increment, negative = decrement
>
> type InventoryTransactionType
>
> referenceId String // orderId, transferId, returnId
>
> createdAt DateTime \@default(now())
>
> userId String
>
> variant ProductVariant \@relation(fields: \[variantId\], references: \[id\])
>
> @@map(\"inventory_transactions\")
>
> }
>
> model StockTransfer {
>
> id String \@id \@default(cuid())
>
> transferNumber String \@unique
>
> sourceBranchId String
>
> destBranchId String
>
> status TransferStatus \@default(PENDING)
>
> reason String
>
> transferDate DateTime
>
> dispatchedAt DateTime?
>
> receivedAt DateTime?
>
> trackingNumber String?
>
> createdAt DateTime \@default(now())
>
> initiatedBy String
>
> sourceBranch Branch \@relation(\"SourceBranch\", fields: \[sourceBranchId\], references: \[id\])
>
> destBranch Branch \@relation(\"DestinationBranch\", fields: \[destBranchId\], references: \[id\])
>
> items StockTransferItem\[\]
>
> @@map(\"stock_transfers\")
>
> }

**6.1.4 Order Models**

> model Order {
>
> id String \@id \@default(cuid())
>
> orderNumber String \@unique
>
> userId String
>
> customerId String?
>
> branchId String
>
> status OrderStatus \@default(PENDING)
>
> orderType String \@default(\"ONLINE\") // ONLINE \| IN_STORE
>
> totalAmount Decimal \@db.Decimal(10, 2)
>
> shippingCost Decimal \@db.Decimal(10, 2)
>
> discountAmount Decimal \@db.Decimal(10, 2) \@default(0)
>
> paymentMethod PaymentMethod
>
> paymentStatus PaymentStatus \@default(UNPAID)
>
> courierService CourierService?
>
> awbNumber String?
>
> trackingNumber String?
>
> notes String?
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> // Relations
>
> user User \@relation(fields: \[userId\], references: \[id\])
>
> branch Branch \@relation(fields: \[branchId\], references: \[id\])
>
> items OrderItem\[\]
>
> shippingAddress ShippingAddress?
>
> returnRequests ReturnRequest\[\]
>
> reviews Review\[\]
>
> @@map(\"orders\")
>
> }

**6.1.5 Returns and Store Credit Models**

> model ReturnRequest {
>
> id String \@id \@default(cuid())
>
> returnNumber String \@unique
>
> orderId String
>
> customerId String
>
> status ReturnStatus \@default(PENDING)
>
> reason ReturnReason
>
> resolution ReturnResolution
>
> notes String? \@db.Text
>
> createdAt DateTime \@default(now())
>
> updatedAt DateTime \@updatedAt
>
> order Order \@relation(fields: \[orderId\], references: \[id\])
>
> customer Customer \@relation(fields: \[customerId\], references: \[id\])
>
> items ReturnItem\[\]
>
> storeCredit StoreCredit?
>
> @@map(\"return_requests\")
>
> }
>
> model StoreCredit {
>
> id String \@id \@default(cuid())
>
> customerId String
>
> voucherCode String \@unique
>
> amount Decimal \@db.Decimal(10, 2)
>
> remaining Decimal \@db.Decimal(10, 2)
>
> issuedFrom String
>
> issuedAt DateTime \@default(now())
>
> expiresAt DateTime
>
> status CreditStatus \@default(ACTIVE)
>
> redeemedAt DateTime?
>
> redeemedOrderId String?
>
> customer Customer \@relation(fields: \[customerId\], references: \[id\])
>
> @@map(\"store_credits\")
>
> }

**6.2 Data Integrity Requirements**

**DR-01:** Foreign Key Constraints --- Data integrity SHALL be enforced at the database level through Prisma-managed foreign key constraints. Deletion of parent records SHALL be RESTRICT or CASCADE as appropriate for the specific relationship.

**DR-02:** Unique Constraints --- Unique constraints SHALL be enforced on: user email, product name and slug, ProductVariant SKU, order number, transfer number, return number, store credit voucher code, and CartItem per customer per variant (single entry).

**DR-03:** Application-Level Validation --- All tRPC mutation procedures SHALL implement Zod schema validation as a secondary integrity layer before any database write operation.

**DR-04:** Transaction Atomicity --- All multi-step operations involving multiple related database records SHALL be executed within a single database transaction using Prisma\'s \$transaction API.

**DR-05:** Inventory Consistency --- All inventory changes SHALL be logged in the InventoryTransaction model and SHALL be performed atomically with the source transaction (order, transfer, or return).

**6.3 Enumerations and Standards**

The following enumerations are defined in the Prisma schema and SHALL be used consistently across all application code, API responses, and database records:

  ------------------------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Enumeration**                **Values**

  **UserRole**                   CUSTOMER \| BRANCH_MANAGER \| ADMIN \| WAREHOUSE_STAFF

  **LoyaltyTier**                BRONZE \| SILVER \| GOLD

  **ProductCategory**            MEN \| WOMEN \| KIDS

  **Occasion**                   ETHNIC \| WEDDING \| SPORTS \| FORMAL \| CASUAL

  **Style**                      LOAFERS \| OXFORD \| MOCCASINS \| PESHAWARI \| SANDALS \| SNEAKERS

  **LeatherType**                CALF_SKIN \| GOAT_LEATHER \| SUEDE \| NUBUCK \| PREMIUM_SYNTHETIC

  **Width**                      STANDARD \| WIDE \| EXTRA_WIDE

  **OrderStatus**                PENDING \| PENDING_VERIFICATION \| VERIFIED \| PROCESSING \| PACKED \| SHIPPED \| OUT_FOR_DELIVERY \| DELIVERED \| CANCELLED \| CANCELLED_VERIFICATION_FAILED \| RTO \| RETURNED

  **PaymentMethod**              COD \| RAAST \| JAZZCASH \| EASYPAISA \| CARD \| STORE_CREDIT \| LOYALTY_POINTS

  **PaymentStatus**              UNPAID \| PAID_DIGITAL \| COD_PENDING_COLLECTION \| COD_SETTLED_BY_COURIER \| REFUNDED \| PARTIAL_REFUND

  **CourierService**             LEOPARDS \| POSTEX \| TRAX \| PAKISTAN_POST

  **ReturnStatus**               PENDING \| APPROVED \| REJECTED \| RETURN_SHIPPED \| RECEIVED \| INSPECTING \| COMPLETED \| CANCELLED

  **ReturnReason**               SIZE_DOES_NOT_FIT \| DAMAGED \| WRONG_PRODUCT \| CHANGED_MIND \| QUALITY_ISSUE

  **ReturnResolution**           EXCHANGE_SIZE \| EXCHANGE_PRODUCT \| STORE_CREDIT \| REFUND

  **CreditStatus**               ACTIVE \| REDEEMED \| EXPIRED

  **TransferStatus**             PENDING \| IN_TRANSIT \| RECEIVED \| REJECTED

  **InventoryTransactionType**   SALE \| TRANSFER_OUT \| TRANSFER_IN \| RETURN \| ADJUSTMENT \| RESTOCK \| DAMAGE_WRITE_OFF
  ------------------------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **7. APPENDICES**

  -----------------------------------------------------------------------

**7.1 Glossary**

  --------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**                          **Definition**

  **Antigravity**                   An agentic development IDE by Google that uses autonomous AI agents to plan, code, and test applications across the editor, terminal, and browser environment.

  **AWB (Airway Bill)**             A document that accompanies goods shipped by courier, containing tracking information, sender/receiver details, and package specifications.

  **COD (Cash on Delivery)**        A payment method where the customer pays the courier at the time of delivery --- the dominant payment method in Pakistan, accounting for over 70% of e-commerce transactions.

  **Dark Store**                    A physical retail location that also functions as a fulfillment center for online orders; Executive Mochi\'s Pasrur and Daska branches operate as dark stores.

  **Digital Handshake**             The four-stage inter-branch stock transfer workflow (Initiate → Dispatch → Receive/Reject) that ensures inventory accuracy without over-counting or under-counting stock in transit.

  **Matrix Product**                A product type allowing multiple attribute-driven variations (Size, Color, Width) under a single parent style entry, each generating a unique SKU.

  **Raast**                         Pakistan\'s national instant payment system, operated by the State Bank of Pakistan, facilitating real-time bank-to-bank transfers at zero cost.

  **RTO (Return to Origin)**        A scenario where a parcel is not accepted by the customer upon delivery and is returned by the courier to the seller\'s fulfillment branch --- a significant operational cost in Pakistani e-commerce.

  **SKU (Stock Keeping Unit)**      A unique alphanumeric identifier for every distinct variant of a shoe (e.g., EXEC-OXF-BLK-42-STD).

  **T3 Stack**                      A full-stack TypeScript web development paradigm combining Next.js, tRPC, Prisma, and NextAuth.js for type-safe, end-to-end application development.

  **3PL (Third-Party Logistics)**   External courier and fulfillment partners engaged by Executive Mochi for last-mile delivery (Leopards, PostEx, Trax, Pakistan Post).
  --------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**7.2 Courier Partnership Reference**

The following table summarises Executive Mochi\'s courier partnerships and their strategic use cases:

  ---------------------- -------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------- ---------------------------------
  **Courier**            **Strengths**                                                                                                  **Primary Use Case**                                                                                      **API Capability**

  **Leopards Courier**   Massive nationwide network; reliable Overnight Express service; established brand trust.                       Primary partner for national delivery from Daska and Pasrur to all major cities.                          AWB + Tracking

  **PostEx**             Innovator in Upfront COD Settlements; holds \~70% share of Pakistani COD e-commerce market; fast remittance.   Maintain brand liquidity by receiving cash settlements before customer delivery confirmation.             AWB + COD Settlement + Tracking

  **Trax Courier**       Tech-driven operations; excellent real-time tracking portal; strong merchant tools and API quality.            Secondary partner for tech-savvy urban customers who demand real-time tracking visibility.                AWB + Real-time Tracking

  **Pakistan Post**      Deepest geographical reach into rural and remote areas; lowest cost per shipment.                              Fulfilling orders to remote areas where private couriers have no coverage or charge premium surcharges.   Tracking only
  ---------------------- -------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------- ---------------------------------

**7.3 Order Status Lifecycle Diagram**

The following table maps every possible order status transition, documenting the trigger event and the resulting status change for clarity during implementation and QA:

  ------------------------- ----------------------------------- -----------------------------------------------------------
  **From Status**           **To Status**                       **Trigger Event**

  (New Order)               **PENDING**                         Customer completes checkout (digital payment)

  (New Order)               **PENDING_VERIFICATION**            Customer completes COD checkout --- awaiting confirmation

  PENDING_VERIFICATION      **VERIFIED**                        Customer confirms order via WhatsApp/SMS link

  PENDING_VERIFICATION      **CANCELLED_VERIFICATION_FAILED**   24-hour verification window expires without confirmation

  PENDING / VERIFIED        **PROCESSING**                      Branch Manager claims order for fulfilment

  PROCESSING                **PACKED**                          Branch staff marks order as packed, ready for handover

  PACKED                    **SHIPPED**                         Branch staff logs courier handover with AWB number

  SHIPPED                   **OUT_FOR_DELIVERY**                Courier API webhook: item out for delivery

  OUT_FOR_DELIVERY          **DELIVERED**                       Courier API webhook: successful delivery confirmed

  OUT_FOR_DELIVERY          **RTO**                             Courier API webhook: failed delivery --- return to origin

  Any pre-dispatch status   **CANCELLED**                       Admin or customer cancellation before dispatch

  DELIVERED                 **RETURNED**                        Return request approved, item physically received
  ------------------------- ----------------------------------- -----------------------------------------------------------

**--- End of Document ---**

*Executive Mochi SRS v1.0 \| executivemochi.pk \| April 1, 2026*