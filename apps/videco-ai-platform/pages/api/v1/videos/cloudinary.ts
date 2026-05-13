import type { NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import multiparty from "multiparty";

type ResponseData = {
    result: any;
};

const secretKey = process.env.VIDECO_SECRET_KEY;

export const config = {
    api: {
        bodyParser: false, // Disable body parsing for this route
    },
};

export default async function handler(
    req: any,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();
    const form = new multiparty.Form();
    //verifyToken(req, res, async () => {
    if (req.method === "POST") {
        const passThroughId = uuidv4() + Date.now();
        try {
            // Configuration
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
                api_key: process.env.CLOUDINARY_API_KEY!,
                api_secret: process.env.CLOUDINARY_API_SECRET!,
            });

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return new Response("Error parsing form data", {
                        status: 500,
                    });
                }

                // Get the file from the form data
                const filePath = files.file[0].path;

                try {
                    // Upload the video file to Cloudinary
                    const result = (await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_large(
                            filePath,
                            { resource_type: "video", chunk_size: 6000000 },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            },
                        );
                    })) as any;
                    // Remove the file from the file system after upload
                    fs.unlinkSync(filePath);
                    if (fields?.video_id) {
                        await supabase
                            .from("videos")
                            .update({
                                training_audio: result.secure_url,
                            })
                            .eq("user_id", fields?.user_id?.[0])
                            .eq("id", fields?.video_id?.[0])
                            .select();
                    }

                    // Send Cloudinary response back to the client
                    res.status(200).json({
                        result: result,
                    });
                } catch (uploadError) {
                    console.error("Upload error:", uploadError);
                    return new Response("Failed to upload to Cloudinary", {
                        status: 500,
                    });
                }
            });
        } catch (error) {
            console.log("error..", error);
            res.status(200).json({ result: [] });
        }
    } else {
        res.status(300).json({ result: "Not authorized!" });
    }
    //});
}
