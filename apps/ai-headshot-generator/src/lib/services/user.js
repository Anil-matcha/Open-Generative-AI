import { prisma } from "@/lib/prisma";

/**
 * Service to manage User data and Credits.
 */
export const UserService = {
  /**
   * Get user credits by ID
   */
  async getCredits(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits || 0;
  },

  /**
   * Add credits to a user
   */
  async addCredits(userId, amount) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });
  },

  /**
   * Deduct credits from a user
   */
  async deductCredits(userId, amount = 1) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < amount) {
      throw new Error("Insufficient credits");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });
  },

  /**
   * Find or create user by email (helper for non-OIDC flows if needed)
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }
};
