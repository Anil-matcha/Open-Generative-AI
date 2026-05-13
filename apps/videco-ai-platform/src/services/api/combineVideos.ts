import axios from "axios";

export const uploadVideosTocloudinary = (theFormData) => {
    try {
        return axios.post("/api/v1/videos/cloudinary", theFormData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    } catch (e) {
        console.log(e);
    }
};

async function blobUrlToBlob(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return blob;
}

export const uploadVideosTocloudinaryDirectly = async (file: any) => {
    const url = "https://api.cloudinary.com/v1_1/dhd6m0fh3/video/upload";
    const blobFile = await blobUrlToBlob(file);
    // Create a FormData object and append the file and api_key
    const formData = new FormData();
    formData.append("file", new File([blobFile], `noname`)); // Append the video file
    formData.append("upload_preset", "videco");

    try {
        const uploadedVideo: any = await axios.post(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return uploadedVideo;
    } catch (e) {
        console.log(e);
    }
};
