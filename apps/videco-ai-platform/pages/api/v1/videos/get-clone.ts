import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";

const supabase = createClientComponentClient();
export default async function handler(req, res) {
    if (req.method === "POST") {
        let cloneData = null;
        let uploadData = null;
        const getVideo = await supabase
            .from("videos")
            .select("ai_preview, media_status, url")
            .eq("id", req.body.id);

        if (getVideo.data?.[0].media_status === "in_progress") {
            const sync_options = {
                method: "GET",
                url: `https://api.sync.so/v2/generate/${getVideo.data?.[0].ai_preview}`,
                headers: {
                    "x-api-key": process.env.SYNC_API_KEY!,
                    "Content-Type": "application/json",
                },
            };
            cloneData = await axios(sync_options);
            if (cloneData.data?.outputUrl && !cloneData.data?.error) {
                uploadData = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_large(
                        cloneData.data?.outputUrl,
                        { resource_type: "video", chunk_size: 6000000 },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        },
                    );
                });
                if (uploadData.playback_url) {
                    const { data, error } = await supabase
                        .from("videos")
                        .update({
                            url: uploadData.playback_url,
                            media_status: "ready",
                        })
                        .eq("id", req.body.id)
                        .select("ai_preview, media_status, url");
                    if (error) {
                        return res.status(500).json({ error: error });
                    } else {
                        return res.status(200).json({
                            status: data?.[0].media_status,
                            ai_preview: data?.[0].ai_preview,
                            url: data?.[0].url,
                        });
                    }
                }
            }
        }

        return res.status(200).json({
            status: getVideo.data?.[0].media_status,
        });
    }

    // Return 405 for methods other than POST
    return res.status(405).json({ message: "Method Not Allowed" });
}
