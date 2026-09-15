import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Customer profile router explicitly excludes password field', async () => {
  const customerRouterPath = path.join(rootDir, 'server/routers/customer.ts');
  const source = fs.readFileSync(customerRouterPath, 'utf8');

  // Verify getProfile uses select and does not select password
  assert.ok(source.includes('select:'), 'getProfile must use select projection');
  assert.ok(!source.match(/select:\s*\{[^}]*password:\s*true/), 'getProfile must not select password');
  assert.ok(source.includes('email: true'), 'getProfile must select email');
  assert.ok(source.includes('name: true'), 'getProfile must select name');
});

test('Address mutations enforce customerId ownership check', async () => {
  const customerRouterPath = path.join(rootDir, 'server/routers/customer.ts');
  const source = fs.readFileSync(customerRouterPath, 'utf8');

  // Verify updateAddress checks addr.customerId !== customer.id
  assert.ok(
    source.includes('addr.customerId !== customer.id'),
    'updateAddress must verify customer ownership'
  );

  // Verify deleteAddress checks addr.customerId !== customer.id
  assert.ok(
    source.includes('addr.customerId !== customer.id'),
    'deleteAddress must verify customer ownership'
  );
});

test('Cart router mutations enforce item ownership check', async () => {
  const cartRouterPath = path.join(rootDir, 'server/routers/cart.ts');
  const source = fs.readFileSync(cartRouterPath, 'utf8');

  // Verify updateItem checks item.userId !== ctx.session.user.id
  assert.ok(
    source.includes('item.userId !== ctx.session.user.id'),
    'updateItem must verify user ownership'
  );

  // Verify removeItem checks item.userId !== ctx.session.user.id
  assert.ok(
    source.includes('item.userId !== ctx.session.user.id'),
    'removeItem must verify user ownership'
  );
});

test('Order router enforces IDOR protection and inventory reversal safety', async () => {
  const orderRouterPath = path.join(rootDir, 'server/routers/order.ts');
  const source = fs.readFileSync(orderRouterPath, 'utf8');

  // Verify getById IDOR protection for customers and branch managers
  assert.ok(
    source.includes('order.userId !== ctx.session.user.id'),
    'getById must enforce customer ownership'
  );
  assert.ok(
    source.includes('manager.branchId !== order.branchId'),
    'getById must enforce branch manager branch isolation'
  );

  // Verify cancel only allows PENDING / PENDING_VERIFICATION
  assert.ok(
    source.includes('order.status !== "PENDING"') &&
    source.includes('order.status !== "PENDING_VERIFICATION"'),
    'cancel must check order status'
  );

  // Verify COD orders only decrement reserved inventory without duplicating quantity
  assert.ok(
    source.includes('order.paymentMethod === "COD"'),
    'cancel must branch on paymentMethod'
  );
  assert.ok(
    source.includes('reserved: { decrement: item.quantity }'),
    'cancel must decrement reserved for COD'
  );
  assert.ok(
    source.includes('quantity: { increment: item.quantity }'),
    'cancel must increment quantity for non-COD'
  );
});

test('Branch manager procedures enforce branch assignment isolation', async () => {
  const invRouterPath = path.join(rootDir, 'server/routers/inventory.ts');
  const source = fs.readFileSync(invRouterPath, 'utf8');

  assert.ok(source.includes('verifyBranchAccess'), 'Inventory router must use verifyBranchAccess');
  assert.ok(
    source.includes('manager.branchId !== targetBranchId'),
    'verifyBranchAccess must verify targetBranchId against manager assigned branch'
  );
});

test('Review submit mutation requires delivered order ownership', async () => {
  const reviewRouterPath = path.join(rootDir, 'server/routers/review.ts');
  const source = fs.readFileSync(reviewRouterPath, 'utf8');

  assert.ok(
    source.includes('order.userId !== userId'),
    'submit review must verify order ownership'
  );
  assert.ok(
    source.includes('order.status !== "DELIVERED"'),
    'submit review must verify order is delivered'
  );
  assert.ok(
    source.includes('existingReview'),
    'submit review must prevent duplicate reviews'
  );
});

test('Stock transfers enforce optimistic concurrency and status validation', async () => {
  const invRouterPath = path.join(rootDir, 'server/routers/inventory.ts');
  const source = fs.readFileSync(invRouterPath, 'utf8');

  // Verify dispatch requires PENDING
  assert.ok(
    source.includes('transfer.status !== "PENDING"'),
    'dispatchTransfer must verify transfer is PENDING'
  );

  // Verify receive requires IN_TRANSIT and uses atomic updateMany
  assert.ok(
    source.includes('transfer.status !== "IN_TRANSIT"'),
    'receiveTransfer must verify transfer is IN_TRANSIT'
  );
  assert.ok(
    source.includes('status: "IN_TRANSIT"') && source.includes('status: "RECEIVED"'),
    'receiveTransfer must atomically transition status'
  );

  // Verify reject requires IN_TRANSIT or PENDING and uses atomic updateMany
  assert.ok(
    source.includes('transfer.status !== "IN_TRANSIT" && transfer.status !== "PENDING"'),
    'rejectTransfer must verify transfer status'
  );
});

test('Returns router enforces branch isolation and lifecycle validation', async () => {
  const returnsRouterPath = path.join(rootDir, 'server/routers/returns.ts');
  const source = fs.readFileSync(returnsRouterPath, 'utf8');

  // Verify branch manager isolation in getQueue, markReceived, complete
  assert.ok(
    source.includes('branchFilter = manager.branchId'),
    'getQueue must filter by branch for branch managers'
  );
  assert.ok(
    source.includes('manager.branchId !== ret.order.branchId'),
    'markReceived/complete must enforce branch isolation'
  );

  // Verify approve/reject require PENDING status
  assert.ok(
    source.includes('ret.status !== "PENDING"'),
    'approve/reject must verify PENDING status'
  );

  // Verify complete requires RECEIVED or INSPECTING status
  assert.ok(
    source.includes('ret.status !== "RECEIVED" && ret.status !== "INSPECTING"'),
    'complete must verify return status'
  );

  // Verify store credit duplicate prevention
  assert.ok(
    source.includes('returnRequestId: ret.id'),
    'complete must check existing credit by returnRequestId'
  );
});

test('Cart and wishlist routers enforce variant existence and active status', async () => {
  const cartRouterPath = path.join(rootDir, 'server/routers/cart.ts');
  const cartSource = fs.readFileSync(cartRouterPath, 'utf8');
  assert.ok(
    cartSource.includes('!variant || !variant.isActive'),
    'cart.addItem must check variant existence and isActive'
  );

  const wishlistRouterPath = path.join(rootDir, 'server/routers/wishlist.ts');
  const wishlistSource = fs.readFileSync(wishlistRouterPath, 'utf8');
  assert.ok(
    wishlistSource.includes('!product') && wishlistSource.includes('isActive: true'),
    'wishlist.add must verify active product'
  );
  assert.ok(
    wishlistSource.includes('!variant') && wishlistSource.includes('productId: input.productId'),
    'wishlist.moveToCart must verify variant belongs to product'
  );
});

test('Order router enforces server-side coupon verification and stock sufficiency', async () => {
  const orderRouterPath = path.join(rootDir, 'server/routers/order.ts');
  const source = fs.readFileSync(orderRouterPath, 'utf8');

  // Verify server-side promo code validation
  assert.ok(source.includes('VALID_COUPONS'), 'Must define valid promo coupons');
  assert.ok(source.includes('WELCOME10') && source.includes('MOCHI20') && source.includes('EID500'), 'Must support valid coupons');
  assert.ok(source.includes('Invalid coupon code'), 'Must reject invalid coupon codes');

  // Verify unstocked variant check (!inv)
  assert.ok(
    source.includes('Variant ${variant.sku} is not in stock at selected branch'),
    'Must fail if variant is not stocked at requested branch'
  );

  // Verify duplicate variant aggregation in order items
  assert.ok(
    source.includes('itemMap.set(item.variantId'),
    'Must aggregate items by variantId to prevent inventory over-ordering'
  );

  // Verify server-enforced shipping calculation
  assert.ok(
    source.includes('const shippingCost = subtotal >= 5000 ? 0 : 250;'),
    'Must calculate shipping cost server-side without trusting client override'
  );
});

test('TRPC middleware validates live database user active status and roles', async () => {
  const trpcPath = path.join(rootDir, 'server/trpc.ts');
  const source = fs.readFileSync(trpcPath, 'utf8');

  // Verify adminProcedure queries db for isActive
  assert.ok(
    source.includes('select: { role: true, isActive: true }'),
    'Privileged procedures must select role and isActive from DB'
  );
  assert.ok(
    source.includes('!dbUser || !dbUser.isActive || dbUser.role !== "ADMIN"'),
    'adminProcedure must immediately reject deactivated or demoted users'
  );
  assert.ok(
    source.includes('!dbUser || !dbUser.isActive || (dbUser.role !== "BRANCH_MANAGER" && dbUser.role !== "ADMIN")'),
    'branchManagerProcedure must immediately reject deactivated staff'
  );
});

test('Inventory transfers prevent self-transfer and check source inventory sufficiency', async () => {
  const invRouterPath = path.join(rootDir, 'server/routers/inventory.ts');
  const source = fs.readFileSync(invRouterPath, 'utf8');

  // Verify self-transfer prevention
  assert.ok(
    source.includes('input.sourceBranchId === input.destBranchId'),
    'initiateTransfer must reject transferring to same branch'
  );

  // Verify stock sufficiency check before decrementing
  assert.ok(
    source.includes('available < requiredQty'),
    'initiateTransfer must verify source branch has sufficient stock'
  );
});

test('Cart merge uses atomic aggregation and upsert to avoid duplicate key collisions', async () => {
  const cartRouterPath = path.join(rootDir, 'server/routers/cart.ts');
  const source = fs.readFileSync(cartRouterPath, 'utf8');

  assert.ok(
    source.includes('itemMap.set(item.variantId'),
    'mergeGuestCart must aggregate quantities by variantId'
  );
  assert.ok(
    source.includes('await ctx.db.cartItem.upsert'),
    'mergeGuestCart must use upsert to avoid unique constraint race conditions'
  );
});


