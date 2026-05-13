export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string;
};

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "500mb", // Set desired value here
        },
    },
};
export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    res.status(200).json({ message: "Hello from Next.js!" });
}
