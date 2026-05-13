import type { NextApiRequest, NextApiResponse } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";

type ResponseData = {
    result: any;
};

const options = {
    method: "POST",
    url: "https://api.brevo.com/v3/smtp/email",
    headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_KEY!,
    },
    data: {
        sender: {
            name: "Malith from Videco",
            email: "no-reply@videco.io",
        },
        to: [{ email: "hello@videco.io", name: "Malith" }],
        templateId: 1,
    },
};
const secretKey = process.env.VIDECO_SECRET_KEY;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    const supabase = createClientComponentClient();

    const invitationUpdated = async () => {
        try {
            await supabase
                .from("feedback")
                .insert({
                    question: req.body.question,
                    answer: req.body.answer,
                    user_id: req.body.user_id,
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

        axios
            .request({
                ...options,
                data: {
                    ...options.data,
                    to: [{ email: req.body.email, name: req.body.name }],
                },
            })
            .then(function (response) {
                // const lead = await insertLead();
                console.log(response.data);
            })
            .catch(function (error) {
                console.error(error);
            });
        res.status(200).json({ result: "invite sent" });
    } else {
        res.status(300).json({ result: "Not authorized!" });
    }
}
