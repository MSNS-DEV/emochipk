'use client';

import { useSession, signOut } from 'next-auth/react';
import { createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: 'ADMIN' | 'BRANCH_MANAGER' | 'WAREHOUSE_STAFF' | 'CUSTOMER';
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: string | string[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * NextAuth-backed AuthProvider.
 * Replaces the old mock-data implementation with real session data.
 * Wraps components that need access to user role/identity.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: !!user,
        hasRole,
        logout: () => signOut({ callbackUrl: '/login' }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
