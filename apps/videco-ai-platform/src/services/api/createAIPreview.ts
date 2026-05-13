import axios from "axios";

export const createAIPreview = async (data: any) => {
    return await axios
        .post("/api/v1/videos/create-intro", {
            ...data,
            key: process.env.VIDECO_SECRET_KEY,
        })
        .then((response) => response);
};

export const processAIVideos = async (data: any) => {
    return await axios
        .post("/api/v1/videos/process", {
            ...data,
            key: process.env.VIDECO_SECRET_KEY,
        })
        .then((response) => response);
};
export const processOnboardingVideo = async (data: any) => {
    return await axios
        .post("/api/v1/videos/onboarding", {
            ...data,
            key: process.env.VIDECO_SECRET_KEY,
        })
        .then((response) => response);
};
export const createAIClone = async (data: any) => {
    return await axios
        .post("/api/v1/videos/clone", {
            ...data,
            key: process.env.VIDECO_SECRET_KEY,
        })
        .then((response) => response);
};
