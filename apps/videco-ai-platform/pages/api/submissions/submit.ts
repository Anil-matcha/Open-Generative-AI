import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type ResponseData = {
    result: any;
};

const secretKey = process.env.VIDECO_SECRET_KEY;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();

    const insertLead = async () => {
        try {
            await supabase
                .from("leads")
                .insert({
                    form_id: req.body.form_id,
                    form_name: req.body.form_name,
                    video_id: req.body.video_id,
                    user_id: req.body.user_id,
                    data: {
                        name: req.body.name,
                        email: req.body.email,
                        message: req.body.message,
                    },
                })
                .select()
                .then((res) => {
                    console.log("success..");
                });
        } catch (error) {
            console.log("error..", error);
        }
    };
    if (req.method === "POST") {
        if (secretKey !== req.body.key) {
            res.status(300).json({ result: "Not authorized!" });
        }
        const lead = await insertLead();
        res.status(200).json({ result: lead });
    } else {
        res.status(300).json({ result: "Not authorized!" });
    }
}
