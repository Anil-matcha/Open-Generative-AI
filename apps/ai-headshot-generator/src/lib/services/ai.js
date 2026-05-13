const { prisma } = require("@/lib/prisma");
const { UserService } = require("./user");
const { getMuapiKey, config } = require("@higgsfield/api-config");

module.exports = {
  getCreditCost() {
    return 60;
  },

  async generate(userId, { image_url, category, aspect_ratio = "1:1" }) {
    const cost = this.getCreditCost();
    await UserService.deductCredits(userId, cost);

    const apiKey = getMuapiKey();

    const webhookUrl = `${config.api.supabase.url || "http://localhost:3000"}/api/webhook/muapi`;
    const submitUrl = `${config.api.muapi.baseUrl}/photo-pack?webhook=${encodeURIComponent(webhookUrl)}`;
    
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        image_url,
        category,
        aspect_ratio,
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) throw new Error("No request_id received from API");

    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      await creationModel.create({
        data: {
          userId,
          category,
          aspectRatio: aspect_ratio,
          requestId: request_id,
          status: "processing",
          isPack: true,
        }
      });
    }

    return { request_id };
  },

  async checkStatus(requestId, userId, metadata) {
    const creationModel = prisma.creation || prisma.Creation;
    if (!creationModel) return { status: "processing" };

    const creation = await creationModel.findUnique({
      where: { requestId }
    });

    if (!creation) {
      return { status: "processing" };
    }

    if (creation.status === "completed") {
      try {
        const urlData = JSON.parse(creation.imageUrl || "[]");
        return { status: "completed", imageUrl: urlData };
      } catch (e) {
        return { status: "completed", imageUrl: creation.imageUrl };
      }
    }

    if (creation.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
    }

    return { status: "processing" };
  }
};
