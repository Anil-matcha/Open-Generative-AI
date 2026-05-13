import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { verifyToken } from "src/utils/apiAuth";

type ResponseData = {
    result: any;
};

const secretKey = process.env.VIDECO_SECRET_KEY;

export default async function handler(
    req: any,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();
    // verifyToken(req, res, async () => {
    const { data, type } = req.body;
    if (req.method === "POST") {
        if (type !== "video.asset.ready") {
            res.status(200).json({ result: "not-used" });
            res.end();
        }
        try {
            switch (type) {
                case "video.asset.ready": {
                    try {
                        await supabase
                            .from("videos")
                            .update({
                                url: `https://stream.mux.com/${data.playback_ids?.[0].id}.m3u8`,
                                status: "ready",
                                playback_id: data.playback_ids?.[0].id,
                            })
                            .eq("passthrough_id", data.passthrough)
                            .select()
                            .then((res) => {
                                console.log("success..", res);
                            });
                    } catch (error) {
                        console.log("error..", error);
                    }
                    break;
                }

                default:
                    res.status(200).json({ result: "not-used" });
                    res.end();
            }
            res.status(200).json({ result: "success" });
            res.end();
        } catch (error) {
            console.log("error..", error);
            res.status(200).json({ result: [] });
        }
    } else {
        res.status(300).json({ result: "Not authorized!" });
    }
    // });
}
