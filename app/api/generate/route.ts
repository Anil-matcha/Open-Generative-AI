import { InferenceClient } from "@huggingface/inference";
import { toBufferFromPayload } from "../../../lib/binaryPayload";

const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt, type, orientation, length, referenceAsset } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Automatic Model & Dimension Selection based on your chosen parameters
    let selectedModel = "";
    let width = 1024;
    let height = 1024;

    // Handle Image Generation & Orientation mapping
    if (type === 'image') {
      selectedModel = "black-forest-labs/FLUX.1-dev";

      if (orientation === 'portrait') {
        width = 768;
        height = 1344;
      } else if (orientation === 'landscape') {
        width = 1344;
        height = 768;
      }

      const payload: any = {
        model: selectedModel,
        inputs: referenceAsset 
          ? { prompt: `${prompt}, maintaining exact identical facial features, body structure, skintone, and curves`, image: referenceAsset } 
          : prompt,
        parameters: { 
          width,
          height,
          num_inference_steps: 30,
          nologo: true,
          ...(referenceAsset ? { strength: 0.65 } : {}) 
        }
      };

      const imageBlob = referenceAsset 
        ? await client.imageToImage(payload) 
        : await client.textToImage(payload);

      const buffer = await toBufferFromPayload(imageBlob);
      return Response.json({ success: true, data: `data:image/jpeg;base64,${buffer.toString("base64")}` });
    }

    // Handle Video Generation & Length mapping
    if (type === 'video') {
      // Automatically map video length to the ideal model pipeline
      if (length === 'long') {
        selectedModel = "tencent/HunyuanVideo";
      } else {
        selectedModel = "ali-vilab/text-to-video-ms-1.7b";
      }

      const videoBlob = await client.request({
        model: selectedModel,
        inputs: referenceAsset 
          ? { prompt: `${prompt}, preserving identical face, features, figure, curves, and skintone`, video: referenceAsset }
          : prompt,
        parameters: {
          nologo: true,
          watermark: false,
        }
      });

      const buffer = await toBufferFromPayload(videoBlob);
      return Response.json({ success: true, data: `data:video/mp4;base64,${buffer.toString("base64")}` });
    }

    return Response.json({ error: "Invalid generation type selected" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
