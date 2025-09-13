import { PrismaClient, User } from '@prisma/client';
import { IronSession } from 'iron-session';
import { SessionData } from '../config/session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  loginCount: number;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ensures a user exists in the database, creating them if necessary
   * Also updates the session with the correct user ID if needed
   */
  async ensureUserExists(session: IronSession<SessionData>): Promise<SessionUser | null> {
    if (!session.user) {
      return null;
    }

    try {
      // Check if user exists in database by ID
      let dbUser = await this.prisma.user.findUnique({
        where: { id: session.user.id }
      });

      // If user doesn't exist by ID, try to find by email
      if (!dbUser) {
        console.log(`[AuthService] User ${session.user.email} not found by ID, checking by email...`);
        
        dbUser = await this.prisma.user.findUnique({
          where: { email: session.user.email }
        });

        if (!dbUser) {
          // Create new user if not found
          console.log(`[AuthService] Creating new user ${session.user.email}`);
          dbUser = await this.createUser(session.user);
        } else {
          // Update the session with the correct user ID from database
          console.log(`[AuthService] Found user by email, updating session ID from ${session.user.id} to ${dbUser.id}`);
          session.user.id = dbUser.id;
          await session.save();
        }
      }

      // Return the session user (which now has the correct ID)
      return session.user;
    } catch (error) {
      console.error('[AuthService] Error ensuring user exists:', error);
      // Return the session user even if database check fails
      return session.user;
    }
  }

  /**
   * Creates a new user in the database
   */
  private async createUser(sessionUser: SessionUser): Promise<User> {
    return await this.prisma.user.create({
      data: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        picture: sessionUser.picture,
        googleId: sessionUser.id, // Using ID as googleId for backwards compatibility
        loginCount: sessionUser.loginCount || 1,
        lastLoginAt: new Date(),
      }
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
        }
      });
    } catch (error) {
      console.error('[AuthService] Error updating user login:', error);
    }
  }
}