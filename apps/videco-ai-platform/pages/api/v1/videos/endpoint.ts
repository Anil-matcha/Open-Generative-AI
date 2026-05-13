import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
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

    verifyToken(req, res, async () => {
        if (req.method === "POST") {
            const passThroughId = uuidv4() + Date.now();
            try {
                axios
                    .post(
                        "https://api.mux.com/video/v1/uploads",
                        {
                            cors_origin: "*",
                            new_asset_settings: {
                                passthrough: passThroughId,
                                playback_policy: "public",
                                mp4_support: "standard",
                            },
                        },
                        {
                            headers: {
                                Authorization:
                                    "Basic " +
                                    Buffer.from(
                                        process.env.MUX_TOKEN_ID +
                                            ":" +
                                            process.env.MUX_TOKEN_SECRET,
                                    ).toString("base64"),
                            },
                        },
                    )
                    .then((response) => {
                        res.status(200).json({
                            result: response.data,
                        });
                        res.end();
                    });
            } catch (error) {
                console.log("error..", error);
                res.status(200).json({ result: [] });
            }
        } else {
            res.status(300).json({ result: "Not authorized!" });
        }
    });
}
