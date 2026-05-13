const { prisma } = require("@/lib/prisma");

const DEFAULT_CREDITS = 100;

const UserService = {
  async getCredits(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits || 0;
  },

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

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async getUserOrCreate(session) {
    if (!session?.user?.email) return null;
    
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          image: session.user.image || null,
          credits: DEFAULT_CREDITS,
        }
      });
    }
    
    return user;
  }
};

module.exports = { UserService };
