import {
    Box,
    Button,
    Grid,
    GridItem,
    Input,
    Spinner,
    Text,
    useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "src/store/editor";
import { NewElements } from "./new-elements";
import { Header } from "./header";
import { Player } from "../player";
import { Upload } from "./upload";
import { FileUploader } from "react-drag-drop-files";
import ElementsLog from "../player/elements-log";
import { rem } from "polished";
import { PagePreview } from "./page-preview";
import axios from "axios";
import { PageAiVideos } from "./page-aivideos";
import { blobUrlToBlob } from "src/utils/video";
import { useWorkspaces } from "src/store/workspace";
import { PageInsights } from "./page-insights";

export const Editor: React.FC = () => {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [videoUrl, setVideoUrl] = useState("");
    const [campaignName, setCampaignName] = useState<any>("");
    const [videoType, setVideoType] = useState("");
    const [videoId, setVideoId] = useState("");
    const { workspace } = useWorkspaces();
    const [mediaStatus, setMediaStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [pagePreview, setPagePreview] = useState(!!router.query.preview);
    const [pageInsights, setPageInsights] = useState(!!router.query.insights);
    const [pageAiVideos, setPageAiVideos] = useState(!!router.query.aivideos);
    const [videoOnboardReady, setVideoOnboardReady] = useState({
        ready: false,
        url: "",
        platform: "videco",
        passthrough_id: "",
        name: "",
        size: 0,
    });
    const [playing, setPlaying] = useState(false);
    const [settingsActive, setSettingsActive] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeElement, setActiveElement] = useState(null);
    const [duration, setDuration] = useState(0);
    const {
        setVideo,
        setVideoMeta,
        meta,
        setInteractiveElements,
        setInteractiveElementsFromDB,
        video,
        interactiveElements,
    } = useEditorStore();
    const [settingsDuration, setSettingsDuration] = useState(0);
    const [activeTimeLineValue, setActiveTimeLineValue] = useState(3);
    const handleSetSettingsDuration = (value) =>
        setSettingsDuration(settingsDuration);

    const session = useSession();
    const toast = useToast();
    const user = session?.user;

    useEffect(() => {
        window.usetifulTags = { userId: user?.id };

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.usetiful.com/dist/usetiful.js";
        script.setAttribute("id", "usetifulScript");
        script.dataset.token = process.env.NEXT_PUBLIC_USETIFUL_TOKEN;
        document.head.appendChild(script);

        return () => {
            // Cleanup script when component unmounts
            document.head.removeChild(script);
        };
    }, [user]);

    const getVideoByID = useCallback(async () => {
        setLoading(true);
        await supabase
            .from("videos")
            .select(
                "url, name, elements, type, media_status, embed_code, campaign_name, password_protection, meta_data, endCTAlink, remove_logo, endCTAtitle, endCTAtext, brand, secondary_link, desc, primary_link, primary_text, secondary_text, platform, preview",
            )
            .match({ id: router.query.id })
            .then((res) => {
                setVideoUrl(res.data?.[0].url);
                setCampaignName(res.data?.[0].campaign_name);
                setVideoType(res.data?.[0].type);
                setMediaStatus(res.data?.[0].media_status);
                setVideoMeta({
                    title: res.data?.[0].name,
                    desc: res.data?.[0].desc,
                    embed_code: res.data?.[0].embed_code,
                    platform: res.data?.[0].platform,
                    secondary_link: res.data?.[0]?.secondary_link,
                    primary_link: res.data?.[0]?.primary_link,
                    primary_text: res.data?.[0]?.primary_text,
                    preview: res.data?.[0]?.preview,
                    secondary_text: res.data?.[0]?.secondary_text,
                    password_protection: res.data?.[0]?.password_protection,
                    remove_logo: res.data?.[0]?.remove_logo,
                    player: {
                        bg: res.data?.[0].meta_data?.player?.bg,
                        color: res.data?.[0].meta_data?.player?.color,
                    },
                    endCTAlink: res.data?.[0]?.endCTAlink,
                    endCTAtitle: res.data?.[0]?.endCTAtitle,
                    endCTAtext: res.data?.[0]?.endCTAtext,
                });
                res.data?.[0].elements?.length > 0 &&
                    setInteractiveElementsFromDB(res.data?.[0].elements);
                setLoading(false);
            });
        setLoading(false);
    }, []);

    useEffect(() => {
        if (router.query.preview) {
            setPagePreview(true);
            setPageInsights(false);
        } else if (router.query.aivideos === "true") {
            setPageAiVideos(true);
            setPagePreview(false);
            setPageInsights(false);
        } else if (router.query.insights === "true") {
            setPageAiVideos(false);
            setPagePreview(false);
            setPageInsights(true);
        } else {
            setPageAiVideos(false);
            setPagePreview(false);
            setPageInsights(false);
        }
    }, [router.query.id, router.query.preview, router.query.aivideos]);
    // Adding a new element by type
    const addANewElement = async ({
        type,
    }: {
        type: "link" | "endcta" | "questions" | "form" | "calendar";
    }) => {
        setSettingsActive(!settingsActive);
        let newElement: any = {
            id: uuidv4(),
            name: "Button",
            type: type,
            url: "https://videco.io",
            pos: activeTimeLineValue,
            butonPosition: "top-left",
            time: playerRef.current?.getCurrentTime().toFixed(2),
            endTime: (Number(playerRef.current?.getCurrentTime()) + 5).toFixed(
                2,
            ),
        };

        if (type === "form") {
            newElement = {
                id: uuidv4(),
                user_id: user?.id,
                name: "Add your form title here",
                type: type,
                url: "add your hubspot form url here",
                form_submit_text: "Submit",
                form_enable_name: true,
                form_enable_email: true,
                form_enable_message: true,
                pos: activeTimeLineValue,
                time: playerRef.current?.getCurrentTime().toFixed(2),
                endTime: (
                    Number(playerRef.current?.getCurrentTime()) + 5
                ).toFixed(2),
            };
        }
        if (type === "calendar") {
            newElement = {
                id: uuidv4(),
                user_id: user?.id,
                type: type,
                url: "",
                pos: activeTimeLineValue,
                time: playerRef.current?.getCurrentTime().toFixed(2),
                endTime: (
                    Number(playerRef.current?.getCurrentTime()) + 5
                ).toFixed(2),
            };
        }
        if (type === "questions") {
            newElement = {
                id: uuidv4(),
                user_id: user?.id,
                name: "How are you today?",
                type: type,
                answers: "Good,Bad,Ok",
                answer_placeholder: "What's your email address?",
                answer_type: "list",
                pos: activeTimeLineValue,
                time: playerRef.current?.getCurrentTime().toFixed(2),
                endTime: (
                    Number(playerRef.current?.getCurrentTime()) + 5
                ).toFixed(2),
            };
        }

        //Updating the local state with the new element
        setInteractiveElements(
            interactiveElements.length > 0
                ? [...interactiveElements, newElement]
                : [newElement],
        );

        if (interactiveElements.length === 0) {
            setActiveElement(newElement);
        }

        setSettingsOpen(!settingsOpen);
    };

    const toggleSettingsWindow = (element: any) => {
        setActiveElement(element);
        setSettingsOpen(!settingsOpen);
    };
    const saveTimeLineValue = (value: number) => {
        setActiveTimeLineValue(value);
    };

    useEffect(() => {
        getVideoByID();
    }, [router.query]);

    //Updating the db when a new element added or updated
    useEffect(() => {
        if (interactiveElements?.length === 0) return;
        const updateDb = async () => {
            try {
                await supabase
                    .from("videos")
                    .update({
                        elements: interactiveElements,
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
        updateDb();
    }, [interactiveElements]);

    const saveScreenRecordingToCloud = async (file, type = "webm") => {
        setLoading(true);
        const url = "https://api.cloudinary.com/v1_1/dhd6m0fh3/video/upload";
        const blobFile = await blobUrlToBlob(file);
        // Create a FormData object and append the file and api_key
        const formData = new FormData();
        if (type === "mp4") {
            formData.append(
                "file",
                file[0],
                `${user.id}-${Date.now()}-screen-record.mp4`,
            );
        } else {
            formData.append(
                "file",
                new File(
                    [blobFile],
                    `${user.id}-${Date.now()}-screen-record.webm`,
                    {
                        type: "video/webm",
                    },
                ),
                `${user.id}-${Date.now()}-screen-record.webm`,
            ); // Append the video file
        }
        formData.append("upload_preset", "videco");

        try {
            const uploadedVideo: any = await axios.post(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setLoading(false);
            if (router.query.id) {
                const theVideoId = router.query.id
                    ? router.query.id.toString()
                    : "";
                setVideoId(theVideoId);
            } else {
                startUpload("rand");
            }

            setVideoOnboardReady({
                ready: true,
                platform: "videco",
                url: uploadedVideo.data.secure_url,
                passthrough_id: "",
                name: "",
                size: new File([blobFile], "test").size / (1024 * 1024),
            });
        } catch (e) {
            console.log(e);
        }
    };

    const startEditing = async (e) => {
        e.preventDefault();
        const { error, data } = await supabase
            .from("videos")
            .update({
                user_id: user?.id,
                status: "draft",
                url: videoOnboardReady.url,
                preview: `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${videoOnboardReady.url
                    .split("/")
                    .pop()
                    .replace(".m3u8", ".gif")
                    .replace(".mov", ".gif")
                    .replace(".mp4", ".gif")
                    .replace(".webm", ".gif")}`,
                platform: videoOnboardReady?.platform ?? "videco",
                name: videoOnboardReady.name,
                meta_data: { type: ".mp4" },
                workspace_id: workspace.id,
                size: videoOnboardReady.size ?? 0,
            })
            .eq("id", videoId)
            .select("id, url");
        if (data?.[0].id) {
            if (router.query.id && router.query.varient) {
                window.location.href = `/campaign/steps/start?id=${router.query.id}`;
            } else {
                window.location.href = `/videos/edit?id=${data[0].id}&preview=true`;
            }
        }
        if (error) throw error;
    };
    const startEditingExternalVideo = async (e) => {
        e.preventDefault();
        const { error, data } = await supabase
            .from("videos")
            .insert({
                user_id: user?.id,
                status: "draft",
                url: videoOnboardReady?.url,
                passthrough_id: videoOnboardReady?.passthrough_id ?? "",
                platform: videoOnboardReady?.platform ?? "videco",
                name: videoOnboardReady.name,
                meta_data: { type: ".mp4" },
                workspace_id: workspace.id,
                size: videoOnboardReady.size ?? 0,
            })
            .select("id, url");
        if (data?.[0].id) {
            window.location.href = `/videos/edit?id=${data[0].id}`;
        }
        if (error) throw error;
    };
    useEffect(() => {
        const taskListener = supabase
            .channel("public:data")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "videos" },
                (payload) => {
                    if (
                        payload.new.id === Number(router.query.id) &&
                        payload.new.url !== ""
                    ) {
                        !videoUrl && setVideoUrl(payload.new.url);
                    }
                },
            )
            .subscribe();

        return () => {
            // Wrap the async call in a synchronous function
            const unsubscribe = async () => {
                await taskListener.unsubscribe();
            };
            unsubscribe();
        };
    }, []);
    const startUpload = async (passthrough_id: any) => {
        const { error, data } = await supabase
            .from("videos")
            .insert({
                user_id: user?.id,
                status: "draft",
                media_status: "in_progress",
                passthrough_id: passthrough_id,
                url: videoOnboardReady?.url,
                platform: videoOnboardReady.platform,
                name: videoOnboardReady.name,
                meta_data: { type: ".mp4" },
                workspace_id: workspace.id,
                size: videoOnboardReady.size,
            })
            .select("id");
        if (data[0].id) {
            setVideoId(data[0].id);
        }
        if (error) throw error;
    };
    // Use url
    const externalVideo = async (url: string) => {
        if (url && url.length > 3) {
            setVideoOnboardReady({
                ready: true,
                platform: "external",
                passthrough_id: "",
                url: url,
                name: "",
                size: 0,
            });
        } else {
            console.log(`${url}, video failed...`);
        }
    };
    const playerRef = useRef(null);

    useEffect(() => {
        if (playerRef.current) {
            video.seek &&
                playerRef.current.seekTo(video.seek.toString(), "seconds");
        }
    }, [playerRef.current, video.seek]);

    const deleteVideoFromId = useCallback(async () => {
        try {
            await supabase
                .from("videos")
                .update({ status: "deleted" })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    toast({
                        title: "Deleted",
                        description: "Your video has been deleted",
                        status: "error",
                        duration: 1000,
                        isClosable: true,
                    });
                    setTimeout(() => {
                        router.push("/videos");
                    }, 1000);
                });
        } catch (error) {
            toast({
                title: "Something went wrong",
                description:
                    "Please contact our support. Something went wrong while deleting your video.",
                status: "warning",
                duration: 1000,
                isClosable: true,
            });
        }
    }, []);

    return (
        <>
            {pagePreview ? (
                <>
                    {videoUrl ? (
                        <>
                            <Header
                                activeItem="page"
                                campaignName={campaignName}
                                setCampaignName={setCampaignName}
                            />
                            <PagePreview
                                mediaStatus={mediaStatus}
                                videoUrl={videoUrl}
                            />
                        </>
                    ) : loading ? (
                        <Spinner color="green.500" />
                    ) : (
                        <Box
                            textAlign="center"
                            bg="#2f3133"
                            p={12}
                            color="white"
                            rounded="md"
                            border="1px"
                            maxW="900px"
                            margin="60px auto"
                        >
                            This campaign is incomplete. Would you like to
                            continue? <br />
                            <br />
                            <Text
                                cursor="pointer"
                                onClick={() =>
                                    router.push(
                                        `/campaign/steps/start?id=${router.query.id}`,
                                    )
                                }
                                textDecor="underline"
                            >
                                Click here to continue.
                            </Text>{" "}
                            <br />
                            Would you like to delete this?
                            <Text
                                cursor="pointer"
                                onClick={() => deleteVideoFromId()}
                                color="red"
                                textDecor="underline"
                            >
                                Click here to delete
                            </Text>{" "}
                        </Box>
                    )}
                </>
            ) : pageAiVideos ? (
                <>
                    <Header activeItem="aivideos" />
                    <PageAiVideos
                        videoUrl={videoUrl}
                        videoType={videoType}
                        meta={meta}
                    />
                </>
            ) : pageInsights ? (
                <>
                    <Header activeItem="insights" />
                    <PageInsights
                        videoUrl={videoUrl}
                        videoType={videoType}
                        meta={meta}
                    />
                </>
            ) : (
                <Grid
                    p={0}
                    m={0}
                    templateRows={
                        settingsOpen ? "repeat(1, 1fr)" : "repeat(1, 1fr)"
                    }
                    templateColumns={
                        settingsOpen ? "repeat(12, 1fr)" : "repeat(12, 1fr)"
                    }
                    bg="#E6E7EA"
                    height="auto"
                >
                    {!router.query.varient && videoUrl && (
                        <Header
                            campaignName={campaignName}
                            activeItem="editor"
                        />
                    )}
                    <GridItem
                        rowSpan={1}
                        colSpan={3}
                        bg="#E6E7EA"
                        display={["none", "none", "none", "block"]}
                    >
                        <Box
                            mt={rem(92)}
                            pos="relative"
                            zIndex={1}
                            maxW="328px"
                            bg="white"
                            rounded="lg"
                            ml={4}
                            p={3}
                            overflow="hidden"
                            height="84vh"
                        >
                            <ElementsLog />
                        </Box>
                    </GridItem>
                    <GridItem
                        rowSpan={1}
                        colSpan={[12, 12, 9, 9]}
                        bg="#E6E7EA"
                        maxW={"1200px"}
                        paddingTop="42px"
                        mr={4}
                    >
                        {!router.query.varient && videoUrl && (
                            <NewElements onSettingsActive={addANewElement} />
                        )}
                        {!router.query.varient && videoUrl ? (
                            <Box
                                justifyContent="flex-start"
                                display="flex"
                                mt={4}
                                height={"auto"}
                                rounded="28px"
                                width={"100%"}
                                border="8px solid white"
                                flexDirection="column"
                            >
                                <Player
                                    platform={meta.platform}
                                    elements={interactiveElements}
                                    videoUrl={videoUrl}
                                    width="100%"
                                    height="520px"
                                    isEditor={true}
                                    endCTA={
                                        {
                                            link: meta.endCTAlink,
                                            title: meta.endCTAtitle,
                                            text: meta.endCTAtext,
                                        } as any
                                    }
                                    preview={
                                        videoUrl &&
                                        !videoUrl.includes("videco.s3.") &&
                                        !videoUrl.includes("youtube")
                                            ? `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${videoUrl
                                                  .split("/")
                                                  .pop()
                                                  .replace(".mp4", ".gif")
                                                  .replace(".mov", ".gif")
                                                  .replace(".m3u8", ".gif")
                                                  .replace(".webm", ".gif")}`
                                            : "/default_thumb.png"
                                    }
                                    playerRef={playerRef}
                                    videcoBrandingRemoved={
                                        meta.remove_logo ?? false
                                    }
                                    playing={playing}
                                    setDuration={setDuration}
                                    setPlaying={setPlaying}
                                    setVideo={setVideo}
                                />
                            </Box>
                        ) : (
                            <Upload
                                isReady={videoOnboardReady.ready}
                                externalVideo={externalVideo}
                                isPorcessing={loading}
                                saveScreenRecordingToCloud={
                                    saveScreenRecordingToCloud
                                }
                            >
                                {videoOnboardReady.ready ? (
                                    <Box>
                                        <form
                                            onSubmit={
                                                videoOnboardReady.platform ===
                                                "videco"
                                                    ? startEditing
                                                    : startEditingExternalVideo
                                            }
                                        >
                                            <Input
                                                onChange={(e) =>
                                                    setVideoOnboardReady({
                                                        ...videoOnboardReady,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Video Name"
                                                required
                                            />
                                            <Button
                                                w="full"
                                                p={6}
                                                type="submit"
                                                colorScheme="teal"
                                                variant="solid"
                                                my={3}
                                            >
                                                Continue
                                            </Button>
                                        </form>
                                    </Box>
                                ) : (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        rounded="md"
                                        mb={4}
                                        flexDirection="column"
                                    >
                                        <Box
                                            w="full"
                                            sx={{
                                                ".videcouploader": {
                                                    maxW: "100%",
                                                    height: "180px",
                                                },
                                            }}
                                        >
                                            <FileUploader
                                                maxSize={100}
                                                multiple={true}
                                                handleChange={(file) =>
                                                    saveScreenRecordingToCloud(
                                                        file,
                                                        "mp4",
                                                    )
                                                }
                                                classes="videcouploader"
                                                name="file"
                                                types={["MP4", "MOV"]}
                                            />
                                            <Text
                                                fontSize="sm"
                                                textAlign="center"
                                                mt={2}
                                            >
                                                Max file size is 100MB{" "}
                                            </Text>
                                        </Box>
                                    </Box>
                                )}
                            </Upload>
                        )}
                    </GridItem>
                </Grid>
            )}
        </>
    );
};
