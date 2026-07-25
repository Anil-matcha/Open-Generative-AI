import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (type === 'image') {
      // Generate image using FLUX via Hugging Face Inference Providers
      const imageBlob = await client.textToImage({
        model: "black-forest-labs/FLUX.1-dev",
        inputs: prompt,
        parameters: { num_inference_steps: 25 }
      });

      // Convert blob to base64 response for the frontend
      const buffer = Buffer.from(await imageBlob.arrayBuffer());
      const base64Image = buffer.toString("base64");

      return Response.json({ success: true, data: `data:image/jpeg;base64,${base64Image}` });
    }

    return Response.json({ error: "Unsupported generation type" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
