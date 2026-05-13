import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type ResponseData = {
    result: any;
};

const options = {
    method: "POST",
    url: "https://api.brevo.com/v3/contacts",
    headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_KEY,
    },
    data: {
        email: "hello@videco.io",
        attributes: { FNAME: "Malith", LNAME: "Gamage" },
        listIds: [20],
    },
};
const secretKey = process.env.BREVO_SECRET_KEY;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    if (req.method === "POST") {
        if (secretKey !== req.body.key) {
            res.status(300).json({ result: "Not authorized!" });
        }
        let listIds = [21];

        switch (req.body.plan_name) {
            case "light":
                listIds = [21];
                break;
            case "growth":
                listIds = [22];
                break;
            case "scale":
                listIds = [23];
                break;
            default:
                listIds = [21];
        }

        axios
            .request({
                ...options,
                data: {
                    email: req.body.user_email,
                    // attributes: [{ FNAME: req.body.user_email }],
                    listIds: listIds,
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
