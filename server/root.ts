import { createTRPCRouter } from "@/server/trpc";
import { productRouter } from "./routers/product";
import { branchRouter } from "./routers/branch";
import { inventoryRouter } from "./routers/inventory";
import { orderRouter } from "./routers/order";
import { cartRouter } from "./routers/cart";
import { customerRouter } from "./routers/customer";
import { wishlistRouter } from "./routers/wishlist";
import { returnsRouter } from "./routers/returns";
import { reviewRouter } from "./routers/review";
import { userRouter } from "./routers/user";
import { courierRouter } from "./routers/courier";

/**
 * Root tRPC Router — merges all sub-routers.
 * Adding a new domain: import router + add to this object.
 */
export const appRouter = createTRPCRouter({
  product: productRouter,
  branch: branchRouter,
  inventory: inventoryRouter,
  order: orderRouter,
  cart: cartRouter,
  customer: customerRouter,
  wishlist: wishlistRouter,
  returns: returnsRouter,
  review: reviewRouter,
  user: userRouter,
  courier: courierRouter,
});

export type AppRouter = typeof appRouter;
