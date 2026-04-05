import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "BRANCH_MANAGER" | "WAREHOUSE_STAFF" | "CUSTOMER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "BRANCH_MANAGER" | "WAREHOUSE_STAFF" | "CUSTOMER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "ADMIN" | "BRANCH_MANAGER" | "WAREHOUSE_STAFF" | "CUSTOMER";
  }
}
