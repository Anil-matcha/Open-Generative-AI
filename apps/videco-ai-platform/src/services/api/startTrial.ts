import axios from "axios";

export const startTrial = async (api: string, data?: any) => {
    return await axios
        .post(api, {
            ...data,
            key: process.env.VIDECO_SECRET_KEY,
        })
        .then((response) => response);
};
