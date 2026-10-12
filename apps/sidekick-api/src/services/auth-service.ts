import { PrismaClient } from "@prisma/client";
import { IronSession } from "iron-session";
import { AuthUser } from "@nimble/shared";
import { SessionData } from "../config/session.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Revalidate the session identity against its existing database account.
   */
  async ensureUserExists(
    session: IronSession<SessionData>,
  ): Promise<AuthUser | null> {
    if (!session.user) {
      return null;
    }

    try {
      // Check if user exists in database by googleId (the unique identifier)
      const dbUser = await this.prisma.user.findUnique({
        where: { googleId: session.user.googleId },
      });

      if (!dbUser || dbUser.id !== session.user.id) {
        session.destroy();
        return null;
      }

      // Return the verified session user.
      return session.user;
    } catch (error) {
      console.error("[AuthService] Error ensuring user exists:", error);
      // A failed identity check must never grant access.
      return null;
    }
  }

  /**
   * Updates user login information
   */
  async updateUserLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginCount: { increment: 1 },
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      console.error("[AuthService] Error updating user login:", error);
    }
  }
}
