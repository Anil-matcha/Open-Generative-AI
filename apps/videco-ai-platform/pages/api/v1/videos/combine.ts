// pages/api/combine.js
import { v2 as cloudinary } from "cloudinary";

// Configure your Cloudinary account
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { blobPublicId, newVideoPublicId, api_key } = req.body;

        try {
            // Combine videos using Cloudinary's video transformation
            const combinedResult = await cloudinary.url(`${blobPublicId}`, {
                resource_type: "video",
                transformation: [
                    {
                        flags: "splice",
                        overlay: `video:${newVideoPublicId}`,
                    },
                    { flags: "layer_apply" },
                ],
            });
            console.log("combinedResult", combinedResult);
            // Respond with the URL of the combined video
            res.status(200).json(combinedResult);
            // Respond with the URL of the combined video
            res.status(200).json(combinedResult);
        } catch (error) {
            console.error("Error combining videos:", error);
            res.status(500).json({ error: "Failed to combine videos" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
