import {
    Box,
    Button,
    Heading,
    Text,
    useDisclosure,
    useSteps,
    useToast,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Divider,
} from "@chakra-ui/react";
import Pricing from "@components/common/pricing";
import Select from "react-select";
import { useSession } from "@supabase/auth-helpers-react";
import "ka-table/style.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useBrandKit } from "src/hooks/getBrandKit";
import { useUserPlan } from "src/hooks/useUserPlan";
import Image from "next/image";
import { StepGenerate } from "./steps/generate";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
    emailProvidersList,
    getEmailEmbedCode,
} from "src/utils/getEmailEmbedCode";
import {
    FiCopy,
    FiDownloadCloud,
    FiFacebook,
    FiLinkedin,
    FiMail,
    FiX,
} from "react-icons/fi";
import { SharingPreview } from "./sharing-preview";
import { rem } from "polished";
import { PiBrowser } from "react-icons/pi";
import { videoTypes } from "src/utils/video";
import { IoMdBrowsers } from "react-icons/io";
import ShareModal from "./share-modal";
import ShareModalVideo from "./share-modal-video";

type PagePreviewProps = {
    videoUrl: string;
    videoType: string;
    meta: any;
};
const steps = [
    { title: "Contacts", description: "Import your contact list" },
    { title: "Generate", description: "Generate your AI videos" },
    { title: "Share", description: "Share your AI videos" },
];

export const PageAiVideos: React.FC<PagePreviewProps> = ({
    videoUrl,
    videoType,
    meta,
}) => {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const toast = useToast();
    const [emailProvider, setEmailProvider] = useState<any>();
    const { getBrandKit } = useBrandKit();
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [brandKit, setBrandKit] = useState({
        primary_color: "#05405A",
        secondary_color: "#1A202C",
        primary_text_color: "#ffffff",
        secondary_text_color: "#ffffff",
    });
    const [plan, setPlan] = useState<any>();
    const secondaryButton = useDisclosure();
    const session = useSession();
    const [showPricing, setShowPricing] = useState<any>(false);
    const user = session?.user;
    const { getPlan } = useUserPlan();
    const { activeStep, setActiveStep } = useSteps({
        index: 0,
        count: steps.length,
    });
    const { isOpen, onOpen, onClose } = useDisclosure();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]);
        };
        plan();
        getBrandKit(user?.id).then((res) => {
            if (res?.[0]) {
                setBrandKit(res?.[0]);
            }
        });
    }, []);
    const createCSV = async () => {
        setLoading(true);
        try {
            const aiVideos = supabase
                .from("ai_videos")
                .select()
                .eq("og_video_id", router.query.id);
            const { data, error, status } = await aiVideos;
            const csvRows = [
                ["email", "fname", "lname", "website", "video", "preview_gif"], // Header row
                ...data.map((item) => {
                    // Extract the video ID from the URL
                    const videoId = item.url.match(
                        /l_video:([a-zA-Z0-9_-]+)/,
                    )?.[1];

                    // Construct the GIF URL
                    const previewGif = videoId
                        ? `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_200,fps_15,du_3,fl_lossy/e_loop/l_text:Arial_40_bold:Hi%20${encodeURIComponent(
                              item.contact.fname,
                          )},g_south,x_0,b_black,co_white,fl_layer_apply,y_10/${videoId}.gif`
                        : "";
                    return [
                        `"${item.contact.email}"`,
                        `"${item.contact.fname}"`,
                        `"${item.contact.lname}"`,
                        `"${item.contact.website}"`,
                        `"${item.url}"`,
                        `"${previewGif}"`,
                    ];
                }),
            ];

            // Convert rows to CSV string
            const csvContent = csvRows.map((row) => row.join(",")).join("\n");

            // Create Blob and trigger download
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            // Create a link element and simulate a click
            const a = document.createElement("a");
            a.href = url;
            a.download = "videco.csv";
            a.click();
            setLoading(false);
        } catch (error) {
            console.log(error);

            setLoading(false);
        }
    };
    const copyEmailToClipboard = (videoUrl: string) => {
        const gifUrl = `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${videoUrl
            .split("/")
            .pop()
            .replace(".mp4", ".gif")
            .replace(".mov", ".gif")
            .replace(".m3u8", ".gif")
            .replace(".webm", ".gif")}`;
        const container = document.createElement("div");

        container.innerHTML = `
            <div style="position: relative; display: inline-block; padding: 15px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/embed/${router.query.id}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>
        `;
        document.body.appendChild(container);

        // Copy the rendered content
        const range = document.createRange();
        range.selectNode(container);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");

        // Cleanup
        document.body.removeChild(container);
        selection.removeAllRanges();

        toast({
            title: "E-mail code copied.",
            description: "You can now paste the code into your e-mail.",
            status: "success",
            duration: 1000,
            isClosable: true,
        });
    };
    return (
        <Box
            bg="#ffffff"
            height="full"
            overflow="auto"
            mt={0}
            w="full"
            pt={82}
            display="flex"
            flexDir="column"
            alignItems="left"
        >
            {showPricing && (
                <Pricing hidePiricng={() => setShowPricing(false)} />
            )}

            {plan && plan.name !== "free" ? (
                <>
                    <Box
                        w="full"
                        m={0}
                        height="full"
                        p={0}
                        display="flex"
                        flexDirection="row"
                    >
                        <Box w="60%" pl={12}>
                            <Heading textAlign="left" mt={12} fontSize="28px">
                                {videoType === videoTypes.video ||
                                videoType === videoTypes.clone
                                    ? meta.title
                                    : "AI Videos"}
                            </Heading>
                            <Text mt={2} textAlign="left" w="3xl">
                                {videoType === videoTypes.video ||
                                videoType === videoTypes.clone
                                    ? meta.desc
                                    : "Your campaign is ready. Below is a list of all the prospects and the videos they will be sent. Double-check the results and start sharing your campaign."}
                            </Text>
                            <Modal
                                size="lg"
                                onClose={onClose}
                                isOpen={isOpen}
                                isCentered
                            >
                                <ModalOverlay />
                                <ModalContent>
                                    <ModalHeader>
                                        Share AI videos at scale
                                    </ModalHeader>
                                    <ModalCloseButton />
                                    <ModalBody>
                                        <Box>
                                            {videoUrl && (
                                                <Image
                                                    alt="Preview"
                                                    height={230}
                                                    width={500}
                                                    src={`https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${videoUrl
                                                        .split("/")
                                                        .pop()
                                                        .replace(".mp4", ".gif")
                                                        .replace(".mov", ".gif")
                                                        .replace(
                                                            ".m3u8",
                                                            ".gif",
                                                        )
                                                        .replace(
                                                            ".webm",
                                                            ".gif",
                                                        )}`}
                                                    placeholder="blur"
                                                    blurDataURL="https://videco.io/wp-content/uploads/2024/08/logotype-medium.png"
                                                    style={{
                                                        borderRadius: "12px",
                                                    }}
                                                />
                                            )}
                                            <Box mt={4}>
                                                <Select
                                                    placeholder="Select your email provider"
                                                    options={emailProvidersList()}
                                                    onChange={(e: any) =>
                                                        setEmailProvider(e)
                                                    }
                                                />
                                                {emailProvider && (
                                                    <>
                                                        <Button
                                                            mt={2}
                                                            mb={6}
                                                            leftIcon={
                                                                <FiCopy />
                                                            }
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    getEmailEmbedCode(
                                                                        `${process.env.NEXT_PUBLIC_SITE_URL}/embed/${router.query.id}`,
                                                                        `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${videoUrl
                                                                            .split(
                                                                                "/",
                                                                            )
                                                                            .pop()
                                                                            .replace(
                                                                                ".mp4",
                                                                                ".gif",
                                                                            )
                                                                            .replace(
                                                                                ".mov",
                                                                                ".gif",
                                                                            )
                                                                            .replace(
                                                                                ".m3u8",
                                                                                ".gif",
                                                                            )
                                                                            .replace(
                                                                                ".webm",
                                                                                ".gif",
                                                                            )}`,
                                                                        emailProvider.value,
                                                                    ),
                                                                );
                                                                toast({
                                                                    title: "Embed code copied.",
                                                                    description:
                                                                        "You can now paste the embed code into your email provider.",
                                                                    status: "success",
                                                                    duration: 1000,
                                                                    isClosable:
                                                                        true,
                                                                });
                                                            }}
                                                            textDecoration="none"
                                                            fontSize="16px"
                                                            fontWeight="semibold"
                                                            border="1px solid #055256"
                                                            color="black"
                                                            p={2}
                                                            width="100%"
                                                            float="right"
                                                            colorScheme="twitter"
                                                            variant="ghost"
                                                        >
                                                            Copy{" "}
                                                            {
                                                                emailProvider.label
                                                            }{" "}
                                                            code
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button onClick={onClose}>Close</Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>
                            {videoType === videoTypes.video ||
                            videoType === videoTypes.clone ? (
                                <SharingPreview
                                    id={router.query.id as string}
                                />
                            ) : (
                                <StepGenerate
                                    setIsOpen={onOpen}
                                    user={user.id}
                                />
                            )}
                        </Box>
                        <Divider ml={10} mr={3} orientation="vertical" />

                        <Box
                            ml={5}
                            // bg="#F6F6F6"
                            w="40%"
                            pl={2}
                            height="100vh"
                        >
                            <Heading textAlign="left" mt={10}>
                                {videoType === videoTypes.video ||
                                videoType === videoTypes.clone
                                    ? "Share Video"
                                    : "Share campaign"}
                            </Heading>
                            <Text mt={2} textAlign="left">
                                Choose one of the options to share your videos
                            </Text>
                            <Box mt={5}>
                                {videoType !== videoTypes.clone && videoUrl && (
                                    <Image
                                        alt="Preview"
                                        height={100}
                                        width={300}
                                        src={
                                            videoUrl &&
                                            !videoUrl.includes("videco.s3.") &&
                                            !videoUrl.includes("youtube")
                                                ? `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${videoUrl
                                                      .split("/")
                                                      .pop()
                                                      .replace(".mp4", ".gif")
                                                      .replace(".mov", ".gif")
                                                      .replace(".m3u8", ".gif")
                                                      .replace(
                                                          ".webm",
                                                          ".gif",
                                                      )}`
                                                : "/default_thumb.png"
                                        }
                                        placeholder="blur"
                                        blurDataURL="https://videco.io/wp-content/uploads/2024/08/logotype-medium.png"
                                        style={{
                                            borderRadius: "12px",
                                        }}
                                    />
                                )}
                            </Box>
                            {videoType === videoTypes.campaign && (
                                <>
                                    <Box
                                        mt={12}
                                        maxW="md"
                                        display="flex"
                                        flexDir="column"
                                    >
                                        <Text fontSize="lg" fontWeight="bold">
                                            Share Video at Scale
                                        </Text>
                                        <Text fontSize="md" pb={2}>
                                            Copy & Paste your video into
                                            platform
                                        </Text>
                                        <ShareModal
                                            videoId={router.query.id}
                                            ogURL={videoUrl}
                                        />
                                        {/* <Select
                                            placeholder="Select your email provider"
                                            options={emailProvidersList()}
                                            onChange={(e: any) =>
                                                setEmailProvider(e)
                                            }
                                        /> */}
                                        {emailProvider && (
                                            <>
                                                <Button
                                                    mt={2}
                                                    mb={2}
                                                    leftIcon={<FiCopy />}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            getEmailEmbedCode(
                                                                `${process.env.NEXT_PUBLIC_SITE_URL}/embed/${router.query.id}`,
                                                                `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${videoUrl
                                                                    .split("/")
                                                                    .pop()
                                                                    .replace(
                                                                        ".mp4",
                                                                        ".gif",
                                                                    )
                                                                    .replace(
                                                                        ".mov",
                                                                        ".gif",
                                                                    )
                                                                    .replace(
                                                                        ".m3u8",
                                                                        ".gif",
                                                                    )
                                                                    .replace(
                                                                        ".webm",
                                                                        ".gif",
                                                                    )}`,
                                                                emailProvider.value,
                                                            ),
                                                        );

                                                        toast({
                                                            title: "Embed code copied.",
                                                            description:
                                                                "You can now paste the embed code into your email provider.",
                                                            status: "success",
                                                            duration: 1000,
                                                            isClosable: true,
                                                        });
                                                    }}
                                                    textDecoration="none"
                                                    fontSize="16px"
                                                    fontWeight="semibold"
                                                    border="1px solid #055256"
                                                    color="black"
                                                    p={2}
                                                    width="100%"
                                                    float="right"
                                                    colorScheme="twitter"
                                                    variant="ghost"
                                                >
                                                    Copy {emailProvider.label}{" "}
                                                    code
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                    <Box
                                        display="flex"
                                        w="87%"
                                        alignItems="left"
                                        flexDir="column"
                                        mt={8}
                                        pr={10}
                                        fontSize="20px"
                                    >
                                        <Text fontSize="lg" fontWeight="bold">
                                            Download
                                        </Text>
                                        <Text fontSize="md" pb={2}>
                                            You can Import the downloaded CSV
                                            into your email platform
                                        </Text>
                                        <Button
                                            variant="videco"
                                            w="full"
                                            _hover={{
                                                bg: "#166183",
                                            }}
                                            onClick={createCSV}
                                            color="white"
                                            isLoading={loading}
                                        >
                                            <FiDownloadCloud />
                                            <Text fontWeight="bold" ml={2}>
                                                Download CSV
                                            </Text>
                                        </Button>
                                    </Box>
                                </>
                            )}
                            {(videoType === videoTypes.video ||
                                videoType === videoTypes.clone) && (
                                <Box mt={4}>
                                    <Box
                                        mt={14}
                                        display="flex"
                                        flexDir="column"
                                        maxW="md"
                                    >
                                        <ShareModalVideo
                                            videoId={router.query.id}
                                            ogURL={videoUrl}
                                        />
                                    </Box>
                                    <Box mt={1} display="flex" flexDir="column">
                                        <Text
                                            textAlign="left"
                                            display="flex"
                                            ml={3}
                                            as="span"
                                            alignItems="center"
                                        >
                                            <IoMdBrowsers
                                                style={{
                                                    marginRight: "7px",
                                                }}
                                            />
                                            Landing page
                                        </Text>
                                        <Button
                                            mt={2}
                                            mb={6}
                                            rounded="full"
                                            leftIcon={<FiCopy />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    `${process.env.NEXT_PUBLIC_SITE_URL}/embed/${router.query.id}`,
                                                );
                                                toast({
                                                    title: "Landing page link copied.",
                                                    description:
                                                        "You can now share this with anyone",
                                                    status: "success",
                                                    duration: 1000,
                                                    isClosable: true,
                                                });
                                            }}
                                            textDecoration="none"
                                            fontSize="14px"
                                            border="1px solid #055256"
                                            color="black"
                                            p={2}
                                            width="80%"
                                            float="right"
                                            colorScheme="twitter"
                                            variant="ghost"
                                        >
                                            Copy Video URL
                                        </Button>
                                    </Box>
                                    <Box mt={1} display="flex" flexDir="column">
                                        <Text
                                            textAlign="left"
                                            display="flex"
                                            ml={3}
                                            as="span"
                                            alignItems="center"
                                        >
                                            <PiBrowser
                                                style={{
                                                    marginRight: "7px",
                                                }}
                                            />
                                            Embed in website
                                        </Text>
                                        <Button
                                            mt={2}
                                            mb={6}
                                            rounded="full"
                                            leftIcon={<FiCopy />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    `<iframe src='https://app.videco.io/embed/${router.query.id}?method=embed' width='560' height='315' frameborder='0' allowfullscreen></iframe>`,
                                                );
                                                toast({
                                                    title: "Embed code copied.",
                                                    description:
                                                        "You can now paste the embed code into your website.",
                                                    status: "success",
                                                    duration: 1000,
                                                    isClosable: true,
                                                });
                                            }}
                                            textDecoration="none"
                                            fontSize="14px"
                                            border="1px solid #055256"
                                            color="black"
                                            p={2}
                                            width="80%"
                                            float="right"
                                            colorScheme="twitter"
                                            variant="ghost"
                                        >
                                            Copy website code
                                        </Button>
                                    </Box>
                                    <Box mt={1} display="flex" flexDir="column">
                                        <Text
                                            textAlign="left"
                                            display="flex"
                                            ml={3}
                                            as="span"
                                            alignItems="center"
                                        >
                                            <FiDownloadCloud
                                                style={{
                                                    marginRight: "7px",
                                                }}
                                            />
                                            Download
                                        </Text>
                                        <Button
                                            mt={2}
                                            mb={6}
                                            rounded="full"
                                            leftIcon={<FiCopy />}
                                            onClick={() => {
                                                window.open(videoUrl);
                                            }}
                                            textDecoration="none"
                                            fontSize="14px"
                                            border="1px solid #055256"
                                            color="black"
                                            p={2}
                                            width="80%"
                                            float="right"
                                            colorScheme="twitter"
                                            variant="ghost"
                                        >
                                            Download video
                                        </Button>
                                    </Box>
                                    <Text
                                        textAlign="left"
                                        fontWeight="bold"
                                        mt={3}
                                    >
                                        Share on social
                                    </Text>
                                    <Box display="flex" mt={2}>
                                        <Button
                                            textDecoration="none"
                                            border="1px solid #055256"
                                            width={rem(50)}
                                            h={rem(50)}
                                            rounded="full"
                                            onClick={() => {
                                                window.open(
                                                    `https://www.facebook.com/sharer/sharer.php?u=${videoUrl}`,
                                                );
                                            }}
                                            bg="#05405A"
                                            color={"#fff"}
                                            _hover={{
                                                color: "#000",
                                                background: "#fff",
                                            }}
                                        >
                                            <FiFacebook />
                                        </Button>

                                        <Button
                                            float="left"
                                            textDecoration="none"
                                            border="1px solid #055256"
                                            width={rem(50)}
                                            h={rem(50)}
                                            rounded="full"
                                            mx={6}
                                            color={"#fff"}
                                            _hover={{
                                                color: "#000",
                                                background: "#fff",
                                            }}
                                            p={2}
                                            onClick={() => {
                                                window.open(
                                                    `https://twitter.com/intent/tweet?text=+Check+out+my+video+on+videco.io+${videoUrl}`,
                                                );
                                            }}
                                            bg="#05405A"
                                        >
                                            <FiX />
                                        </Button>
                                        <Button
                                            width={rem(50)}
                                            h={rem(50)}
                                            rounded="full"
                                            textDecoration="none"
                                            border="1px solid #055256"
                                            color={"#fff"}
                                            p={2}
                                            _hover={{
                                                color: "#000",
                                                background: "#fff",
                                            }}
                                            onClick={() => {
                                                window.open(
                                                    `https://www.linkedin.com/shareArticle?mini=true&url=${videoUrl}`,
                                                );
                                            }}
                                            bg="#05405A"
                                            variant="solid"
                                        >
                                            <FiLinkedin />
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </>
            ) : (
                <Box w="2xl" textAlign="center">
                    <Text
                        mb={4}
                        mt={14}
                        fontSize="26"
                        textAlign="center"
                        fontWeight="medium"
                    >
                        Upgrade to Grwoth and enjoy benifits of AI Videos
                    </Text>
                    <Button
                        onClick={() => (window.location.href = "/pricing")}
                        mb={3}
                        bg="#05405A"
                        color="white"
                        _hover={{
                            bg: "#3086AC",
                        }}
                    >
                        Upgrade now
                    </Button>
                    <iframe
                        style={{
                            borderRadius: "12px",
                        }}
                        width="100%"
                        height="315"
                        src="https://www.youtube.com/embed/HZsyAF2ZfYs?si=fmwjuVEHl0MwkkWR"
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </Box>
            )}
        </Box>
    );
};
