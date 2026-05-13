import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import jwt from "jsonwebtoken";

type ResponseData = {
    result: any;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();
    const validateAPIKey = (str) => {
        const regex = /^api_.*_videco\.io$/;
        return regex.test(str);
    };

    if (req.method === "POST") {
        if (!req.body.api_key && !validateAPIKey(req.body.api_key)) {
            res.status(500).json({ error: "Not authorized!" } as any);
        }

        try {
            const user_id = await supabase
                .from("apikey")
                .select("user_id")
                .eq("key", req.body.api_key);
            // Create a payload with necessary user information
            const payload = { user_id: user_id.data[0].user_id };

            // Sign the token with the payload and secret key
            const token = jwt.sign(payload, req.body.api_key);

            if (!res.headersSent) {
                res.status(200).json({
                    token,
                } as any);
                res.end();
            }
        } catch (error) {
            console.log("error..", error);
            res.status(500).json({ error: "Not authorized!" } as any);
            res.end();
        }
    } else {
        res.status(300).json({ result: "Not authorized!" });
        res.end();
    }
}
