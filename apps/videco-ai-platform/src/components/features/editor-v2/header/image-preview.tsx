import React, { use, useEffect, useState } from "react";
import { Box, Button, Image, Progress } from "@chakra-ui/react";
import { FaMagic } from "react-icons/fa";
import { useS3Upload } from "next-s3-upload";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";

interface VideoPreviewProps {
    src: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ src }) => {
    const { files, uploadToS3, FileInput, openFileDialog } = useS3Upload();
    const router = useRouter();
    const [preview, setPreview] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const supabase = createClientComponentClient();

    const fetchPreview = async () => {
        try {
            await supabase
                .from("videos")
                .select("preview, url")
                .eq("id", router.query.id)
                .then((res) => {
                    setPreview(res.data[0].preview);
                    setUrl(res.data[0].url);
                });
        } catch (error) {
            console.log("error..", error);
        }
    };
    useEffect(() => {
        fetchPreview();
    }, []);

    // called every time a file's `status` changes
    const handleChangeStatus = async (file) => {
        const uploadedData = await uploadToS3(file);
        setPreview(uploadedData.url);
        try {
            await supabase
                .from("videos")
                .update({
                    preview: uploadedData.url,
                })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    console.log("success..");
                });
        } catch (error) {
            console.log("error..", error);
        }
    };
    const handleRemove = async () => {
        setPreview("");
        try {
            await supabase
                .from("videos")
                .update({
                    preview: `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_200,l_play-3-xxl_wefrsh/fl_layer_apply/c_scale,h_400,e_loop/dl_200,vs_30/${url
                        .split("/")
                        .pop()
                        .replace(".m3u8", ".gif")
                        .replace(".mov", ".gif")
                        .replace(".mp4", ".gif")
                        .replace(".webm", ".gif")}`,
                })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    console.log("success..");
                });
        } catch (error) {
            console.log("error..", error);
        }
    };
    return (
        <Box
            width="full"
            height="auto"
            position="relative"
            mt={2}
            display="flex"
            flexDir="column"
            alignItems="center"
        >
            {/* <FileInput accept=".mp4" onChange={handleChangeStatus} /> */}
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px dashed #000000"
                mb={4}
                mt={4}
                w="full"
                flexDirection="column"
            >
                <FileInput accept=".jpg, .png" onChange={handleChangeStatus} />

                <Button
                    p={12}
                    w="full"
                    onClick={openFileDialog}
                    fontWeight="normal"
                    fontSize="large"
                    position="relative"
                    zIndex={1}
                >
                    {files.length > 0
                        ? preview
                            ? "Uploaded"
                            : "Uploading..."
                        : preview
                        ? "Change preview image"
                        : "Click to upload preview image"}
                </Button>

                <Box w="full" bg="transparent">
                    {files.map((file, index) => (
                        <div key={index}>
                            <Progress
                                w="full"
                                colorScheme="teal"
                                size="sm"
                                value={file.progress}
                                isIndeterminate={file.progress === 0}
                            />
                        </div>
                    ))}
                </Box>
            </Box>
            {preview && (
                <>
                    <Image
                        src={preview}
                        objectFit="cover"
                        width="full"
                        height="300px"
                    />
                    <Button
                        mt={2}
                        onClick={handleRemove}
                        float="left"
                        variant="ghost"
                        textDecor="underline"
                    >
                        Remove Preview Image
                    </Button>
                </>
            )}
        </Box>
    );
};
