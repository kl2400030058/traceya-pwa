import { mfaService } from "@/services/mfaservice"
import { auditLogService } from "@/services/auditlogservice"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

import { SessionStrategy } from "next-auth";

// Auth configuration options
export const authOptions = {
  providers: [],
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      return session;
    },
    async jwt({ token, user }: { token: JWT; user: any }) {
      return token;
    }
  }
};

export interface AuthState {
  isAuthenticated: boolean
  farmerId: string | null
  token: string | null
  userRole: "farmer" | "researcher" | "lab" | "processor" | "admin" | "court" | "super_admin" | "citizen" | null
  mfaVerified: boolean
}

export class AuthManager {
  private static instance: AuthManager
  protected authState: AuthState = {
    isAuthenticated: false,
    farmerId: null,
    token: null,
    userRole: null,
    mfaVerified: false
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  constructor() {
    this.loadAuthState()
  }

  // Get user ID
  getUserId(): string | null {
    return this.authState.farmerId;
  }

  // Verify MFA token
  async verifyMFA(token: string): Promise<boolean> {
    const userId = this.getFarmerId();
    if (!userId) return false;
    
    const verified = await mfaService.verifyToken(userId, token);
    
    if (verified) {
      this.authState.mfaVerified = true;
      this.saveAuthState();
      
      // Log successful MFA verification
      await auditLogService.logAction('mfa_verified', 'user', { 
        userId: userId,
        userRole: this.authState.userRole 
      });
    } else {
      // Log failed MFA attempt
      await auditLogService.logAction('mfa_failed', 'user', { 
        userId: userId,
        userRole: this.authState.userRole 
      });
    }
    
    return verified;
  }

  // Check if MFA is required but not verified
  requiresMFAVerification(): boolean {
    return this.authState.isAuthenticated && !this.authState.mfaVerified;
  }

  // Check if user is a super admin
  isSuperAdmin(): boolean {
    return this.authState.userRole === "super_admin";
  }

  // Check if user is a court admin
  isCourtAdmin(): boolean {
    return this.authState.userRole === "court";
  }

  // Check if user is a citizen
  isCitizen(): boolean {
    return this.authState.userRole === "citizen";
  }

  private loadAuthState(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("traceya_auth")
      if (stored) {
        try {
          this.authState = JSON.parse(stored)
        } catch (error) {
          console.error("Failed to parse stored auth state:", error)
          this.clearAuth()
        }
      }
    }
  }

  protected saveAuthState(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("traceya_auth", JSON.stringify(this.authState))
    }
  }

  async login(farmerId: string, otp: string, role: "farmer" | "researcher" | "lab" | "processor" | "admin" | "court" | "super_admin" | "citizen" = "farmer"): Promise<{ success: boolean; requiresMFA: boolean }> {
    // Import the validateOTP function from the otp module
    const { validateOTP } = await import("./otp")
    
    // Validate the OTP using our OTP validation function
    const isValid = validateOTP(farmerId, otp)
    
    // For backward compatibility, also accept hardcoded values
    const isLegacyValid = otp === "123456" || otp === farmerId.slice(-6)
    
    if (isValid || isLegacyValid) {
      const token = `token_${farmerId}_${Date.now()}`

      // Check if MFA is required for this user/role
      const requiresMFA = role === "admin" || role === "super_admin" || role === "court" || role === "lab";
      const hasMFA = await mfaService.isMfaEnabled(farmerId);
      
      this.authState = {
        isAuthenticated: true,
        farmerId,
        token,
        userRole: role,
        mfaVerified: !requiresMFA || !hasMFA // If MFA is not required or not set up, mark as verified
      }

      this.saveAuthState()

      // Update settings with farmerId
      const { db } = await import("./db")
      const settings = await db.settings.toArray()
      if (settings.length > 0) {
        await db.settings.update(settings[0].id!, { farmerId })
      }
      
      // Log the login action
      await auditLogService.logAction('login', 'user', { userId: farmerId, userRole: role, requiresMFA: requiresMFA && hasMFA });

      return { 
        success: true, 
        requiresMFA: requiresMFA && hasMFA 
      };
    }
    
    // Log failed login attempt
    await auditLogService.logAction('login_failed', 'user', { userId: farmerId });

    return { success: false, requiresMFA: false };
  }

  async logout(): Promise<void> {
    // Log the logout action before clearing state
    if (this.authState.isAuthenticated && this.authState.farmerId) {
      await auditLogService.logAction('logout', 'user', { 
        userId: this.authState.farmerId,
        userRole: this.authState.userRole 
      });
    }
    
    this.authState = {
      isAuthenticated: false,
      farmerId: null,
      token: null,
      userRole: null,
      mfaVerified: false
    }
    this.saveAuthState()
  }

  getAuthState(): AuthState {
    return { ...this.authState }
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.farmerId && this.authState.mfaVerified
  }

  isLoggedIn(): boolean {
    return this.authState.isAuthenticated
  }

  getFarmerId(): string | null {
    return this.authState.farmerId
  }

  getToken(): string | null {
    return this.authState.token
  }

  getUserRole(): "farmer" | "researcher" | "lab" | "processor" | "admin" | "court" | "super_admin" | "citizen" | null {
    return this.authState.userRole
  }
  
  isResearcher(): boolean {
    return this.authState.userRole === "researcher"
  }
  
  hasRole(role: string): boolean {
    return this.authState.userRole === role
  }
  
  isFarmer(): boolean {
    return this.authState.userRole === "farmer"
  }
  
  isLab(): boolean {
    return this.authState.userRole === "lab"
  }
  
  isProcessor(): boolean {
    return this.authState.userRole === "processor"
  }
  
  isAdmin(): boolean {
    return this.authState.userRole === "admin"
  }

  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    return {
      id: this.authState.farmerId,
      role: this.authState.userRole
    };
  }

  clearAuth(): void {
    this.logout()
    if (typeof window !== "undefined") {
      localStorage.removeItem("traceya_auth")
    }
  }
}

// Export the singleton instance
export const authManager = AuthManager.getInstance()

// Add method to get session for compatibility with next-auth
export async function getSession(request: Request) {
  // Return session based on authenticated user
  const user = authManager.getCurrentUser();
  if (!user) return null;
  
  return {
    user: {
      id: user.id,
      name: 'User',
      email: `${user.id}@example.com`,
      role: user.role
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}
