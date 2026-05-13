import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * Service to manage AI Headshot Studio generations using muapi.ai
 */
export const AIService = {
  /**
   * Defines the fixed cost for a professional photo pack
   */
  getCreditCost() {
    return 60;
  },

  /**
   * Execute a headshot generation quest using muapi.ai photo-pack
   */
  async generate(userId, { image_url, category, aspect_ratio = "1:1" }) {
    const cost = this.getCreditCost();
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.headshot.apiKey;
    if (!apiKey) throw new Error("HEADSHOT_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `${config.ai.headshot.endpoint}?webhook=${encodeURIComponent(webhookUrl)}`;
    
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

  /**
   * Check the status of a specific generation (Polling fallback)
   */
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
