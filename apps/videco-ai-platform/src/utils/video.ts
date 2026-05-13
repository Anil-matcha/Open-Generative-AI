export async function blobUrlToBlob(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return blob;
}

export const videoTypes = {
    video: "Video",
    campaign: "Personalized Campaign",
    clone: "AI Clone",
};
