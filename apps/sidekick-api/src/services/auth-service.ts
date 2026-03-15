import { PrismaClient, User } from "@prisma/client";
import { IronSession } from "iron-session";
import { AuthUser } from "@nimble/shared";
import { SessionData } from "../config/session.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ensures a user exists in the database, creating them if necessary
   * Also updates the session with the correct user ID if needed
   */
  async ensureUserExists(
    session: IronSession<SessionData>,
  ): Promise<AuthUser | null> {
    if (!session.user) {
      return null;
    }

    try {
      // Check if user exists in database by googleId (the unique identifier)
      let dbUser = await this.prisma.user.findUnique({
        where: { googleId: session.user.googleId },
      });

      if (!dbUser) {
        // Create new user if not found
        console.log(
          `[AuthService] User with Google ID ${session.user.googleId} not found, creating new user ${session.user.email}`,
        );
        dbUser = await this.createUser(session.user);
      } else if (dbUser.id !== session.user.id) {
        // Update the session with the correct user ID from database if it doesn't match
        console.log(
          `[AuthService] Updating session ID from ${session.user.id} to ${dbUser.id}`,
        );
        session.user.id = dbUser.id;
        await session.save();
      }

      // Return the session user (which now has the correct ID)
      return session.user;
    } catch (error) {
      console.error("[AuthService] Error ensuring user exists:", error);
      // Return the session user even if database check fails
      return session.user;
    }
  }

  /**
   * Creates a new user in the database
   */
  private async createUser(sessionUser: AuthUser): Promise<User> {
    return await this.prisma.user.create({
      data: {
        googleId: sessionUser.googleId,
        email: sessionUser.email,
        name: sessionUser.name,
        picture: sessionUser.picture,
        loginCount: sessionUser.loginCount || 1,
        lastLoginAt: new Date(),
      },
    });
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
