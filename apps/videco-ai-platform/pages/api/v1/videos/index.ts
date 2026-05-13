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

    verifyToken(req, res, async () => {
        if (req.method === "POST") {
            try {
                const leads = await supabase
                    .from("leads")
                    .select("*")
                    .eq("user_id", req.user);
                if (!res.headersSent) {
                    res.status(200).json(leads.data as any);
                    res.end();
                }
            } catch (error) {
                console.log("error..", error);
                res.status(200).json({ result: [] });
            }
        } else {
            res.status(300).json({ result: "Not authorized!" });
        }
    });
}
