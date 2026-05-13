import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Spinner,
    Text,
    Link,
    Flex,
    Select,
    Button,
    useToast,
    Editable,
    EditableInput,
    EditablePreview,
    Input,
    useEditableControls,
    ButtonGroup,
    IconButton,
    Textarea,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { AudioRecorder } from "react-audio-voice-recorder";
import { createAIClone } from "src/services/api/createAIPreview";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheck,
    FiEdit2,
    FiInfo,
    FiMic,
} from "react-icons/fi";
import { useUserPlan } from "src/hooks/useUserPlan";
import { uploadVideosTocloudinaryDirectly } from "src/services/api/combineVideos";
import { createAIPreview } from "src/services/api/createAIPreview";
import { rem } from "polished";
import { UploadV2 } from "@components/features/editor-v2/upload/v2";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios";
import { blobUrlToBlob, videoTypes } from "src/utils/video";
import { reader, the_greeting, the_text } from "src/utils/voice";
import { MdDeleteOutline } from "react-icons/md";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { Templates } from "@components/features/ai-clone/templates";
import { NotAllowed } from "@components/features/ai-clone/not-allowed";
import { useWorkspaces } from "src/store/workspace";

const Create: React.FC = () => {
    const supabase = createClientComponentClient();
    const [plan, setPlan] = useState<any>();
    const [loading, setLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [jobsGenerated, setJobsGenerated] = useState(false);
    const { workspace } = useWorkspaces();
    const [campaignName, setCampaignName] = useState("");
    const [voiceID, setVoiceID] = useState<string>("");
    const [language, setLanguage] = useState("english");
    const [greeting, setGreeting] = useState("Hello");
    const [videoData, setVideoData] = useState<any>();
    const [aiCloneText, setAiCloneText] = useState<string>("");
    const [video, setVideo] = useState<any>();
    const [originalVideoPubId, setOriginalVideoPubId] = useState<string>("");
    const [voiceRecordingStarted, setVoiceRecordingStarted] =
        useState<boolean>(false);
    const [jobUpdateMessages, setJobUpdateMessages] = useState<any>(
        "Generating an AI preview for you",
    );
    const [readyToGenerate, setReadyToGenerate] = useState(false);
    const [csvCompleted, setCsvCompleted] = useState(false);
    const [voiceCloningEnabled, setVoiceCloningEnabled] = useState(true);

    const [userAudio, setUserAudio] = useState<any>();
    const [fullname, setFullname] = useState<any>("");
    const [background, setBackground] = useState<any>("website");
    const { getPlan } = useUserPlan();
    const [aiIntro, setAiIntro] = useState<any>();
    const [jobUpdates, setJobUpdates] = useState("pending");
    const [csvData, setCsvData] = useState<any>([]);
    const runningJobID = useRef(0);
    const session = useSession();
    const toast = useToast();
    const user = session?.user;

    const getScript = (text) => {
        setAiCloneText(text);
    };

    const getFullName = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`full_name, onboard_completed`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (data.full_name) {
                setFullname(data.full_name);
                setLoading(false);
            }
        } catch (error) {
            console.log(error);
        }
    }, [user, supabase]);

    const router = useRouter();
    const { getData } = useFetchTeamData();
    const { clearVideo } = useEditorStore();

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);

            setPlan(fetchPlan?.[0]);
        };
        plan();
    }, [user, supabase]);
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            getFullName();
            const data = await getData("videos", {
                col: "status",
                val: "deleted",
            });

            if (data) {
                setVideoData(data ?? []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        clearVideo();
    }, [user, supabase]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);

    useEffect(() => {
        // Subscribe to the `jobs` table for status changes.
        const subscription = supabase
            .channel("custom-all-channel")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "jobs",
                    filter: "status=eq.completed", // Status should be completed.
                },
                (payload) => {
                    if (payload.new.id === runningJobID.current) {
                        setJobUpdates(payload.new.status);
                        setJobUpdateMessages(
                            "Voice cloning is done. Peparing the audio player",
                        );
                    }
                },
            )
            .subscribe();

        // Cleanup subscription when component unmounts
        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);
    const addAudioElement = async (blob) => {
        const url = URL.createObjectURL(blob);
        setUserAudio(url);
        try {
            const result = await uploadVideosTocloudinaryDirectly(url);
            const startJob = await createAIPreview({
                audio: `https://res.cloudinary.com/dhd6m0fh3/video/upload/${result.data.public_id}.mp3`,
                video_id: router.query.id,
                language: language,
                userId: user.id,
                userName: fullname,
                email: user.email,
                greeting: the_greeting(language, greeting),
                text: the_text(language),
            });
            if (startJob) {
                runningJobID.current = startJob.data.job_id;
                setJobUpdateMessages(
                    "AI is generating your voice. This might take a few minutes. Hang on. Please don't close this window.",
                );
            }
        } catch (e) {
            setJobUpdateMessages(
                "Something went wrong with ai voice creation. Please refresh and try again.",
            );
        }
    };
    const getVoiceid = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`ai_voice_id`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (data.ai_voice_id) {
                setVoiceID(data.ai_voice_id);
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    }, [user, supabase]);
    const getPreviewAudioFromDB = async () => {
        try {
            const { data, error } = await supabase
                .from("videos")
                .select("ai_preview")
                .eq("id", router.query.id);
            if (data) {
                setAiIntro(data[0].ai_preview);
            }
        } catch (error) {
            console.log("error..", error);
            setJobUpdateMessages(
                "Could not find the final audio preview. Please refreish and try agian.",
            );
        }
    };
    const getVideoFromDB = async () => {
        try {
            const { data, error } = await supabase
                .from("videos")
                .select("id, url, preview, campaign_name")
                .eq("id", router.query.id);
            if (data) {
                setVideo(data[0]);
                setCampaignName(data[0]?.campaign_name);
                setOriginalVideoPubId(
                    data[0]?.url.split("/").pop().replace(".mp4", ""),
                );
            }
        } catch (error) {
            console.log("error..", error);
        }
    };
    useEffect(() => {
        if (jobUpdates === "completed") {
            getPreviewAudioFromDB();
            getVoiceid();
        }
    }, [jobUpdates]);
    useEffect(() => {
        if (router.query.id) {
            getVideoFromDB();
        }
    }, [router]);
    function EditableControls() {
        const {
            isEditing,
            getSubmitButtonProps,
            getCancelButtonProps,
            getEditButtonProps,
        } = useEditableControls();

        return isEditing ? (
            <>
                <ButtonGroup
                    justifyContent="center"
                    size="sm"
                    ml={2}
                    pos="relative"
                >
                    <IconButton
                        aria-label="Check"
                        icon={<CheckIcon />}
                        {...getSubmitButtonProps()}
                    />
                    <IconButton
                        aria-label="close"
                        icon={<CloseIcon />}
                        {...getCancelButtonProps()}
                    />
                </ButtonGroup>
            </>
        ) : (
            <Flex justifyContent="center" ml={2}>
                <IconButton
                    size="sm"
                    aria-label="edit"
                    bg="transparent"
                    icon={<FiEdit2 />}
                    {...getEditButtonProps()}
                />
            </Flex>
        );
    }

    const startUpload = async (url: string, size: any) => {
        const { error, data } = await supabase
            .from("videos")
            .update({
                user_id: user?.id,
                status: "draft",
                media_status: "in_progress",
                passthrough_id: "no",
                preview: `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${url
                    .split("/")
                    .pop()
                    .replace(".m3u8", ".gif")
                    .replace(".mov", ".gif")
                    .replace(".mp4", ".gif")
                    .replace(".webm", ".gif")}`,
                url: url,
                platform: "videco",
                type: videoTypes.clone,
                name: (Math.random() + 1).toString(36).substring(7),
                meta_data: { type: ".mp4" },
                workspace_id: workspace.id,
                size: size,
            })
            .eq("id", router.query.id)
            .select("id");
        getVideoFromDB();
        if (error) throw error;
    };
    const deleteVideoOnly = async () => {
        const { error, data } = await supabase
            .from("videos")
            .update({
                preview: "",
                url: "",
            })
            .eq("id", router.query.id)
            .select("id");
        setVideo(data);
        if (error) throw error;
    };
    const updateCampaignName = async (name: string) => {
        const { error, data } = await supabase
            .from("videos")
            .update({
                campaign_name: name,
            })
            .eq("id", router.query.id);
        if (error) throw error;
    };
    const saveVideo = async (file, type = "webm") => {
        setVideoLoading(true);
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
            setVideoLoading(false);
            startUpload(
                uploadedVideo.data.secure_url,
                new File([blobFile], "test").size / (1024 * 1024),
            );
        } catch (e) {
            console.log(e);
            setVideoLoading(false);
        }
    };

    const confirmScriptAndGenerate = async () => {
        setReadyToGenerate(true);
        setLoading(false);
        const startJob = await createAIClone({
            video_id: router.query.id,
            voice_id: voiceID,
            text: aiCloneText,
            video_url: video.url,
            ai_video_id: "test_id",
            language: language,
        });
        setJobsGenerated(true);
    };
    const continueToNextStep = async () => {
        setLoading(true);
        await confirmScriptAndGenerate();
        setLoading(false);
        router.push(
            `/videos/edit?id=${router.query.id}&preview=true&clone=true`,
        );
    };

    async function handleDownload() {
        const url =
            "https://res.cloudinary.com/dhd6m0fh3/video/upload/v1735901958/rd9i1bbccgmqa0uk4tsw.mp4";

        try {
            startUpload(url, "12");
        } catch (error) {
            console.error("Error downloading the video", error);
        }
    }

    return (
        <>
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    flexDirection="column"
                    height="full"
                    width="full"
                >
                    <Spinner size="xl" />
                    <Link mt={7} href="/auth/login">
                        Please Login
                    </Link>
                </Box>
            ) : (
                <Box>
                    <Box
                        zIndex={9}
                        pos="relative"
                        bg="#FCFCFC"
                        display="flex"
                        justifyContent="space-between"
                        py={3}
                        px={6}
                        boxShadow="md"
                    >
                        <Box
                            display="flex"
                            flexDir="column"
                            alignItems="flex-start"
                        >
                            <Text>
                                {campaignName && (
                                    <Editable
                                        textAlign="center"
                                        defaultValue={campaignName}
                                        fontSize="20"
                                        isPreviewFocusable={false}
                                        display="flex"
                                        alignItems={"center"}
                                        onSubmit={(value) => {
                                            updateCampaignName(value);
                                            setCampaignName(value);
                                        }}
                                        pos="relative"
                                    >
                                        <EditablePreview />
                                        {/* Here is the custom input */}
                                        <Input as={EditableInput} />
                                        <EditableControls />
                                    </Editable>
                                )}
                            </Text>
                            <Link
                                href="/videos"
                                display="flex"
                                color="#9C9F9F"
                                justifyContent="center"
                                fontSize="14px"
                                alignItems="center"
                            >
                                <FiArrowLeft
                                    style={{
                                        marginRight: "3px",
                                    }}
                                />
                                Dashboard
                            </Link>
                        </Box>
                        {/* Steps */}
                        <Box>
                            <Button
                                colorScheme="brand"
                                bg="#05405A"
                                fontSize={rem(16)}
                                border={0}
                                fontWeight="400"
                                rounded="full"
                            >
                                <Text
                                    bg="white"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    fontSize="12px"
                                    p={2}
                                    rounded="full"
                                    color="black"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    1
                                </Text>
                                Prepare files
                            </Button>
                            <Button
                                variant="outline"
                                fontSize={rem(16)}
                                ml={2}
                                border={0}
                                fontWeight="400"
                                onClick={() =>
                                    router.push(
                                        `?id=${router.query.id}&preview=true`,
                                    )
                                }
                                color="#9C9F9F"
                                rounded="full"
                            >
                                <Text
                                    bg="#9C9F9F"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    p={2}
                                    fontSize="12px"
                                    rounded="full"
                                    color="white"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    2
                                </Text>
                                Landing page
                            </Button>
                            <Button
                                variant="outline"
                                fontSize={rem(16)}
                                ml={2}
                                border={0}
                                fontWeight="400"
                                color="#9C9F9F"
                                rounded="full"
                                onClick={() =>
                                    router.push(
                                        `?id=${router.query.id}&aivideos=true`,
                                    )
                                }
                            >
                                <Text
                                    bg="#9C9F9F"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    p={2}
                                    fontSize="12px"
                                    rounded="full"
                                    color="white"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    3
                                </Text>
                                Share
                            </Button>
                        </Box>
                    </Box>
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="22px auto"
                        maxW="920px"
                        w="full"
                        px={10}
                        pt={6}
                        pb={12}
                        my={12}
                        sx={{
                            ".videcouploader": {
                                width: "full",
                                height: "full",
                                paddingY: "12",
                                bg: "#DDEAF1",
                                color: "black",
                            },
                        }}
                        bg="#FBFBFB"
                        border={
                            video && video.preview
                                ? "1px solid #DDEAF1"
                                : "2px solid #53ADD4"
                        }
                        rounded="3xl"
                    >
                        {video && video.preview ? (
                            <FiCheck
                                style={{
                                    position: "absolute",
                                    left: "-58px",
                                }}
                                color="#53ADD4"
                                size={50}
                            />
                        ) : (
                            <Box
                                pos="absolute"
                                color="#53ADD4"
                                left="-58"
                                fontSize="6xl"
                                fontWeight="bold"
                            >
                                1
                            </Box>
                        )}
                        <Text
                            fontSize="30"
                            fontWeight="semibold"
                            textAlign="left"
                            color="#05405A"
                            mt={6}
                        >
                            Upload or record your training video
                        </Text>
                        <Text fontSize="16" textAlign="left" mt={1} mb={3}>
                            Upload or record a video of you. at least 60 seconds
                            long. We will use this to train the AI. If you are
                            not sure about the format:
                            <Text
                                as="span"
                                fontWeight="bold"
                                textDecor="underline"
                                p={1}
                                fontSize="sm"
                                px={3}
                                rounded="md"
                                cursor="pointer"
                                onClick={handleDownload}
                            >
                                Use this example video
                            </Text>
                        </Text>
                        {video && video.preview ? (
                            <Box display="flex" alignItems="flex-start" mt={6}>
                                <video src={video.url} controls width={400} />
                                <MdDeleteOutline
                                    fill="#05405A"
                                    size={22}
                                    cursor="pointer"
                                    onClick={deleteVideoOnly}
                                />
                            </Box>
                        ) : (
                            <UploadV2
                                isReady={true}
                                id={router.query.id as string}
                                externalVideo={""}
                                isPorcessing={videoLoading}
                                saveScreenRecordingToCloud={""}
                            >
                                <Box
                                    width="full"
                                    mr={4}
                                    sx={{
                                        ".videcouploader": {
                                            maxWidth: "90%",
                                            minWidth: "100%",
                                            width: "90%",
                                            background: "#F7F9FA",
                                            borderColor: "#DDEAF1",
                                            flexDir: "column",
                                        },
                                        ".videcouploader span": {
                                            fontSize: "15px",
                                            marginTop: "6px",
                                        },
                                        ".videcouploader span.file-types": {
                                            paddingLeft: "15px",
                                        },
                                        ".videcouploader path": {
                                            fill: "#05405A",
                                        },
                                    }}
                                >
                                    <FileUploader
                                        maxSize={100}
                                        multiple={true}
                                        handleChange={(file) =>
                                            saveVideo(file, "mp4")
                                        }
                                        label="Upload from your computer"
                                        classes="videcouploader"
                                        name="file"
                                        types={["MP4", "MOV"]}
                                    />
                                </Box>
                            </UploadV2>
                        )}
                    </Box>
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="22px auto"
                        maxW="920px"
                        w="full"
                        bg="#FBFBFB"
                        px={6}
                        py={6}
                        mt={100}
                        border={
                            voiceRecordingStarted && !userAudio
                                ? "2px solid #53ADD4"
                                : "1px solid #DDEAF1"
                        }
                        rounded="3xl"
                    >
                        {aiIntro ? (
                            <FiCheck
                                style={{
                                    position: "absolute",
                                    left: "-58px",
                                }}
                                color="#588B8E"
                                size={50}
                            />
                        ) : (
                            <Box
                                pos="absolute"
                                left="-58"
                                color={
                                    voiceRecordingStarted && !userAudio
                                        ? "#53ADD4"
                                        : "#DDEAF1"
                                }
                                fontSize="6xl"
                                fontWeight="bold"
                            >
                                2
                            </Box>
                        )}
                        <Text
                            fontSize="30"
                            fontWeight="semibold"
                            textAlign="left"
                            color="#05405A"
                            bg="#FBFBFB"
                            as="span"
                            mt={16}
                        >
                            <Flex
                                justifyContent="space-between"
                                alignContent="center"
                                alignItems="center"
                                direction="row"
                            >
                                <Flex
                                    color={
                                        voiceCloningEnabled
                                            ? "#05405A"
                                            : "#DADADA"
                                    }
                                >
                                    Clone your voice{" "}
                                    <Text fontSize="12">New</Text>
                                </Flex>
                                {/* <Flex>
                                    <Text mr={2} fontSize="15">
                                        Enable
                                    </Text>
                                    <Switch
                                        colorScheme="brand"
                                        id="clone-voice"
                                        onChange={(e) => {
                                            setVoiceCloningEnabled(
                                                e.target.checked,
                                            );
                                            setVoiceRecordingStarted(false);
                                        }}
                                        defaultChecked={voiceCloningEnabled}
                                    />
                                </Flex> */}
                            </Flex>
                        </Text>
                        {voiceRecordingStarted && !userAudio ? (
                            <Box
                                bg="#F6FAFA"
                                py={2}
                                color="#05405A"
                                px={4}
                                rounded="md"
                                display="flex"
                                justifyContent="space-between"
                                alignContent="center"
                            >
                                <Text fontSize="16" textAlign="left">
                                    1. Select your language
                                </Text>
                                <FiArrowRight />
                                <Text fontSize="16" textAlign="left">
                                    2. Press record
                                </Text>
                                <FiArrowRight />
                                <Text fontSize="16" textAlign="left">
                                    3. Read the text
                                </Text>
                                <FiArrowRight />
                                <Text fontSize="16" textAlign="left">
                                    Record at least 15 seconds
                                </Text>
                            </Box>
                        ) : (
                            <Text
                                fontSize="16"
                                textAlign="left"
                                mt={1}
                                mb={3}
                                color={
                                    voiceCloningEnabled ? "#05405A" : "#9C9F9F"
                                }
                            >
                                {aiIntro ? (
                                    <>
                                        The voice cloning is complete. Our AI
                                        will generate greetings with your voice
                                        and place them at the beginning of each
                                        video within your campaigns.
                                    </>
                                ) : (
                                    <>
                                        You have not recorded your voice yet. In
                                        order to generate audio for the clone,
                                        we need to clone your voice first. Then
                                        you can write the script to generate the
                                        audio with your cloned voice
                                    </>
                                )}
                            </Text>
                        )}

                        {!voiceRecordingStarted && (
                            <Button
                                bg="#05405A"
                                color="white"
                                fontWeight="400"
                                leftIcon={<FiMic />}
                                colorScheme="brand"
                                _hover={{
                                    bg: "#4991A1",
                                }}
                                disabled={voiceCloningEnabled ? false : true}
                                onClick={() => setVoiceRecordingStarted(true)}
                            >
                                Continue with voice recording
                                {voiceCloningEnabled}
                            </Button>
                        )}
                        {voiceRecordingStarted && (
                            <>
                                <Flex>
                                    <Box
                                        mt="6"
                                        rounded="md"
                                        display="flex"
                                        justifyContent="center"
                                        flexDir="column"
                                        border={
                                            aiIntro ? 0 : "1px solid #05405A"
                                        }
                                        bg={aiIntro ? "#F6F6F6" : "transparent"}
                                        borderStyle="dashed"
                                        p={4}
                                        maxW={aiIntro ? "full" : 522}
                                        width="full"
                                        alignItems="center"
                                    >
                                        {!userAudio && (
                                            <>
                                                <Box
                                                    display="flex"
                                                    width="full"
                                                    mb={6}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    <Select
                                                        width="auto"
                                                        minW="auto"
                                                        margin="0 auto"
                                                        border={0}
                                                        defaultValue="english"
                                                        cursor="pointer"
                                                        onChange={(e) =>
                                                            setLanguage(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="english">
                                                            English
                                                        </option>
                                                        <option value="french">
                                                            French
                                                        </option>
                                                        <option value="spanish">
                                                            Spanish
                                                        </option>
                                                        <option value="german">
                                                            German
                                                        </option>
                                                        <option value="portuguese">
                                                            Portuguese
                                                        </option>
                                                        <option value="portuguese_br">
                                                            Portuguese
                                                            (Brazilian)
                                                        </option>
                                                        <option value="dutch">
                                                            Dutch
                                                        </option>
                                                        <option value="italian">
                                                            Italian
                                                        </option>
                                                        <option value="turkish">
                                                            Turkish
                                                        </option>
                                                        <option value="swedish">
                                                            Swedish
                                                        </option>
                                                        <option value="polish">
                                                            Polish
                                                        </option>
                                                        <option value="danish">
                                                            Danish
                                                        </option>
                                                        <option value="norwegian">
                                                            Norwegian
                                                        </option>
                                                    </Select>
                                                </Box>

                                                <Box mb={3}>
                                                    <Text fontSize={18}>
                                                        {reader(language)}
                                                    </Text>
                                                </Box>

                                                <Box
                                                    _hover={{
                                                        bg: "#53ADD4",
                                                    }}
                                                    sx={{
                                                        ".audio-recorder-mic ":
                                                            {
                                                                bg: "#6EC2D4",
                                                                order: 5,
                                                                rounded:
                                                                    "lg !important",
                                                                _hover: {
                                                                    bg: "#53ADD4",
                                                                },
                                                            },
                                                        ".audio-recorder-timer":
                                                            {
                                                                order: 1,
                                                            },
                                                        ".audio-recorder": {
                                                            bg: "#6EC2D4",
                                                        },
                                                        ".audio-recorder-visualizer":
                                                            {
                                                                order: 2,
                                                            },
                                                        ".audio-recorder-options":
                                                            {
                                                                order: 2,
                                                            },

                                                        ".audio-recorder-options[data-testid='ar_cancel']":
                                                            {
                                                                display: "none",
                                                            },
                                                    }}
                                                    rounded="full"
                                                >
                                                    <AudioRecorder
                                                        onRecordingComplete={
                                                            addAudioElement
                                                        }
                                                        audioTrackConstraints={{
                                                            noiseSuppression:
                                                                true,
                                                            echoCancellation:
                                                                true,
                                                        }}
                                                        showVisualizer={false}
                                                        downloadOnSavePress={
                                                            false
                                                        }
                                                        downloadFileExtension="mp3"
                                                    />
                                                </Box>
                                            </>
                                        )}
                                        {userAudio && (
                                            <Box
                                                textAlign="center"
                                                fontWeight="400"
                                                color="#05405A"
                                            >
                                                <Text fontSize="16px">
                                                    Your Voice:
                                                </Text>
                                                <audio
                                                    style={{
                                                        marginTop: "4px",
                                                        border: "1px solid",
                                                        borderRadius: "32px",
                                                    }}
                                                    src={userAudio}
                                                    controls
                                                ></audio>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box
                                        mt={8}
                                        ml={4}
                                        height={
                                            userAudio && !aiIntro
                                                ? "160"
                                                : "auto "
                                        }
                                        bg={
                                            (userAudio && !aiIntro) || aiIntro
                                                ? "#F7F9FA"
                                                : "transparent "
                                        }
                                        border={
                                            (userAudio && !aiIntro) || aiIntro
                                                ? "1px solid #4991A1"
                                                : "0"
                                        }
                                        rounded="md"
                                        pos="relative"
                                    >
                                        {userAudio && !aiIntro && (
                                            <Box
                                                mt={2}
                                                display="flex"
                                                textAlign="center"
                                                padding={4}
                                                flexDir="column"
                                                alignItems="center"
                                            >
                                                <Spinner mb={4} />
                                                <Text>{jobUpdateMessages}</Text>
                                            </Box>
                                        )}
                                        {aiIntro ? (
                                            <Flex p={5} flexDir="column">
                                                {aiIntro && (
                                                    <Box
                                                        textAlign="center"
                                                        fontWeight="400"
                                                        fontSize={14}
                                                        minW="400px"
                                                        color="#05405A"
                                                    >
                                                        <Text fontSize="16px">
                                                            AI Voice Preview:
                                                        </Text>
                                                        <audio
                                                            style={{
                                                                marginTop:
                                                                    "5px",
                                                                margin: "0 auto",
                                                            }}
                                                            src={aiIntro}
                                                            controls
                                                        ></audio>
                                                    </Box>
                                                )}
                                                <Box
                                                    p={0}
                                                    py={3}
                                                    mb="4"
                                                    color="black"
                                                    pos="absolute"
                                                    right={-6}
                                                    top={-2}
                                                    _hover={{
                                                        color: "#166183",
                                                    }}
                                                    width={20}
                                                    w="auto"
                                                    cursor="pointer"
                                                    onClick={() => {
                                                        setAiIntro("");
                                                        setUserAudio("");
                                                        router.reload();
                                                    }}
                                                >
                                                    <MdDeleteOutline
                                                        size="20"
                                                        style={{
                                                            marginLeft: "22px",
                                                        }}
                                                    />
                                                </Box>
                                            </Flex>
                                        ) : (
                                            <>
                                                {!userAudio && !aiIntro && (
                                                    <>
                                                        <Text
                                                            fontSize="16"
                                                            as="span"
                                                            display="flex"
                                                        >
                                                            <FiInfo
                                                                size={29}
                                                                style={{
                                                                    marginRight:
                                                                        "6px",
                                                                }}
                                                            />
                                                            Background noise,
                                                            echo and unclear
                                                            speech may influence
                                                            the quality.
                                                        </Text>
                                                        <Text
                                                            fontSize="16"
                                                            as="span"
                                                            mt={6}
                                                            display="flex"
                                                        >
                                                            <FiInfo
                                                                size={32}
                                                                style={{
                                                                    marginRight:
                                                                        "6px",
                                                                }}
                                                            />
                                                            The AI generated
                                                            greetings will be in
                                                            the language you
                                                            select for this
                                                            recording.
                                                        </Text>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Flex>
                            </>
                        )}
                    </Box>
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="22px auto"
                        maxW="920px"
                        w="full"
                        px={6}
                        py={6}
                        mt={100}
                        border={
                            !aiIntro && voiceCloningEnabled
                                ? "1px solid #DDEAF1"
                                : "2px solid #53ADD4"
                        }
                        rounded="3xl"
                        bg="#FBFBFB"
                    >
                        <Text
                            fontSize="30"
                            fontWeight="semibold"
                            textAlign="left"
                            color="#05405A"
                            pos="relative"
                            as="span"
                            display="block"
                        >
                            {csvCompleted ? (
                                <FiCheck
                                    style={{
                                        position: "absolute",
                                        left: "-78px",
                                        top: "0",
                                    }}
                                    color="#588B8E"
                                    size={50}
                                />
                            ) : (
                                <Box
                                    pos="absolute"
                                    left="-78"
                                    color={
                                        voiceRecordingStarted && !userAudio
                                            ? "#53ADD4"
                                            : "#DDEAF1"
                                    }
                                    fontSize="6xl"
                                    fontWeight="bold"
                                >
                                    3
                                </Box>
                            )}
                            Write a script
                        </Text>

                        <Templates getSelectedScript={getScript} />
                        {plan &&
                            plan?.plan_name === "lite" &&
                            videoData?.filter(
                                (video: any) => video.type === videoTypes.clone,
                            ).length > 1 && <NotAllowed />}
                        {plan &&
                            plan?.plan_name === "growth" &&
                            videoData?.filter(
                                (video: any) => video.type === videoTypes.clone,
                            ).length > 4 && <NotAllowed />}
                        {plan &&
                            plan?.plan_name === "scale" &&
                            videoData?.filter(
                                (video: any) => video.type === videoTypes.clone,
                            ).length > 9 && <NotAllowed />}
                        {plan &&
                            plan?.plan_name === "enterprise" &&
                            videoData?.filter(
                                (video: any) => video.type === videoTypes.clone,
                            ).length > 19 && <NotAllowed />}
                        <Box pos="relative">
                            <Textarea
                                placeholder="Type your script here"
                                onChange={(e) => setAiCloneText(e.target.value)}
                                border="1px solid"
                                minH="200px"
                                maxLength={650}
                                borderColor={
                                    aiCloneText.length === 650 ? "red" : "black"
                                }
                                value={aiCloneText}
                                bg="white"
                            />
                            <Text
                                textAlign="right"
                                fontSize="sm"
                                color={
                                    aiCloneText.length === 650 ? "red" : "black"
                                }
                            >
                                {aiCloneText.length}/650
                            </Text>
                        </Box>
                    </Box>
                    <Button
                        bg="white"
                        border="1px solid #05405A"
                        color="#05405A"
                        fontWeight="500"
                        _hover={{
                            bg: "#05405A",
                            color: "white",
                        }}
                        py={6}
                        width="400px"
                        margin="18px auto"
                        alignItems="center"
                        display="flex"
                        isDisabled={
                            !aiCloneText ||
                            (!aiIntro && voiceCloningEnabled) ||
                            !video
                        }
                        isLoading={loading}
                        onClick={() => continueToNextStep()}
                    >
                        Generate your clone{" "}
                        <FiArrowRight
                            style={{
                                marginLeft: "5px",
                            }}
                        />
                    </Button>
                </Box>
            )}
        </>
    );
};
export default Create;
