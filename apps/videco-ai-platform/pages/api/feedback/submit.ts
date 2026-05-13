import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type ResponseData = {
    result: any;
};

const secretKey = process.env.FEEDBACK_SECRET_KEY;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();

    const insertLead = async () => {
        try {
            await supabase
                .from("feedback")
                .insert({
                    question: req.body.question,
                    answer: req.body.answer,
                    user_id: req.body.user_id,
                    video_id: req.body.video_id,
                    session_id: req.body.session_id,
                })
                .select("session_id")
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
