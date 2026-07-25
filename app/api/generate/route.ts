import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { prompt, type, referenceImage } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (type === 'image') {
      // Facial Consistency Mode: Passing the reference image along with the prompt
      // to preserve identity, features, and core facial structure.
      const imageBlob = await client.imageToImage({
        model: "black-forest-labs/FLUX.1-dev",
        inputs: {
          prompt: `${prompt}, maintaining exact facial features, identity, and core facial structure of the reference subject`,
          image: referenceImage, // Base64 or URL of your reference image
        },
        parameters: { 
          strength: 0.75, // Adjusts pose/lighting while locking identity
          num_inference_steps: 28 
        }
      });

      const buffer = Buffer.from(await imageBlob.arrayBuffer());
      const base64Image = buffer.toString("base64");

      return Response.json({ success: true, data: `data:image/jpeg;base64,${base64Image}` });
    }

    return Response.json({ error: "Unsupported generation type for consistency mode" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
