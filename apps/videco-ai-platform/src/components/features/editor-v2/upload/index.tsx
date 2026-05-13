import {
    Box,
    Link,
    Text,
    Image,
    Flex,
    Input,
    Heading,
    Highlight,
    Wrap,
    Alert,
    AlertIcon,
    Spinner,
    Button,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { createClient, ErrorResponse, Videos, Video } from "pexels";
import {
    FiCircle,
    FiSave,
    FiSearch,
    FiVideo,
    FiX,
    FiYoutube,
} from "react-icons/fi";
import { useRouter } from "next/router";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useSession } from "@supabase/auth-helpers-react";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import dynamic from "next/dynamic";
import Pricing from "@components/common/pricing";
import { Recorder } from "@components/features/recorder/recorder";
import { blobUrlToBlob } from "src/utils/video";

export const Upload: React.FC<UploadProps> = ({
    externalVideo,
    saveScreenRecordingToCloud,
    children,
    isReady,
    isPorcessing,
}) => {
    const [videoFiles, setVideoFiles] = React.useState<Video[]>([]);
    const router = useRouter();
    const session = useSession();
    const user = session?.user;
    const [showPricing, setShowPricing] = React.useState<any>(false);
    const [recodPreview, setRecodPreview] = React.useState<any>(false);
    const [recodData, setRecodData] = React.useState<any>();
    const [recodDataURL, setRecodDataURL] = React.useState<any>();
    const [confirmRecodPreview, setConfirmRecodPreview] =
        React.useState<any>(false);
    const [plan, setPlan] = React.useState<any>();
    const { getPlan } = useUserPlan();
    const { getData } = useFetchTeamData();
    const { type, varient } = router.query;

    const client = createClient(
        process.env.NEXT_PUBLIC_UPLOAD_CLIENT_KEY!,
    );

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, []);
    const searchVideo = (query: string) => {
        if (query === "" || query === undefined) {
            return null;
        }
        client?.videos
            .search({ query, per_page: 8 })
            .then((response: Videos | ErrorResponse) => {
                if ("videos" in response) {
                    setVideoFiles(response.videos);
                } else {
                    console.error(response.error);
                }
            });
    };

    const handleRecordFinish = async (data) => {
        setRecodPreview(true);
        saveScreenRecordingToCloud(data);
        const blobFile = await blobUrlToBlob(data);
        setRecodDataURL(URL.createObjectURL(blobFile));
        setRecodData(data);
    };

    React.useEffect(() => {
        client?.videos
            .popular({ per_page: 8 })
            .then((response: Videos | ErrorResponse) => {
                if ("videos" in response) {
                    setVideoFiles(response.videos);
                } else {
                    console.error(response.error);
                }
            });
    }, []);

    return (
        <Box>
            {showPricing ? (
                <Pricing
                    hidePiricng={() => {
                        window.location.href = "/videos";
                    }}
                />
            ) : (
                <>
                    <Box
                        pos="fixed"
                        w="full"
                        h="full"
                        bg="#a6a3a3"
                        zIndex={1}
                        top="0"
                        left="0"
                    />
                    <Box
                        p={5}
                        bg="white"
                        maxW={type === "record" && !isReady ? "6xl" : "2xl"}
                        marginTop="-12px"
                        zIndex={4}
                        rounded="md"
                        pos="absolute"
                        w="full"
                        left="50%"
                        top="50%"
                        transform="translate(-50%, -50%)"
                    >
                        <Box
                            float="right"
                            marginBottom="12px"
                            position="relative"
                            top={0}
                            right={-2}
                            marginTop="-4px"
                            cursor="pointer"
                        >
                            {varient ? (
                                <Link
                                    textDecor="underline"
                                    onClick={router.back}
                                >
                                    Go Back
                                </Link>
                            ) : (
                                <Link textDecor="underline" href="/videos">
                                    <FiX color="#494242" size="25" />
                                </Link>
                            )}
                        </Box>
                        {isPorcessing && (
                            <Box height="full" mb={5}>
                                <Alert rounded="md" status="info">
                                    <Spinner mr={3} />
                                    Your video is processing, please wait...
                                </Alert>
                            </Box>
                        )}
                        {type === "upload" && (
                            <>
                                <Text as="h3" mb={8} fontSize="2xl">
                                    <Heading
                                        lineHeight="normal"
                                        bg="white"
                                        mb={6}
                                        width="100%"
                                        rounded="md"
                                    >
                                        <Highlight query="your">
                                            {isReady
                                                ? "What's the name of your video?"
                                                : "Select a video to upload"}
                                        </Highlight>
                                    </Heading>
                                </Text>
                                {children}

                                {!varient && (
                                    <Box
                                        mt={4}
                                        display="flex"
                                        width="full"
                                        justifyContent="space-between"
                                    >
                                        <Link
                                            _hover={{
                                                cursor: "pointer",
                                                bg: "#6ff6ce",
                                            }}
                                            rounded="md"
                                            href="/videos/edit?type=record"
                                        >
                                            <Box
                                                border="1px solid #e6e4e4"
                                                px={6}
                                                py={6}
                                                rounded="md"
                                                alignItems="center"
                                                display="flex"
                                            >
                                                <FiVideo
                                                    style={{
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <Text>Record Screen</Text>
                                            </Box>
                                        </Link>
                                        <Link
                                            href="/videos/edit?type=stock"
                                            rounded="md"
                                            _hover={{
                                                cursor: "pointer",
                                                bg: "#e9ecec",
                                            }}
                                        >
                                            <Box
                                                border="1px solid #e6e4e4"
                                                px={6}
                                                py={6}
                                                rounded="md"
                                                alignItems="center"
                                                display="flex"
                                            >
                                                <FiSearch
                                                    style={{
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <Text>Stock Videos</Text>
                                            </Box>
                                        </Link>
                                        <Link
                                            href="/videos/edit?type=import"
                                            _hover={{
                                                cursor: "pointer",
                                                bg: "#f63131bb",
                                            }}
                                            rounded="md"
                                        >
                                            <Box
                                                border="1px solid #e6e4e4"
                                                px={6}
                                                py={6}
                                                rounded="md"
                                                alignItems="center"
                                                display="flex"
                                            >
                                                <FiYoutube
                                                    style={{
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <Text>Youtube</Text>
                                            </Box>
                                        </Link>
                                    </Box>
                                )}
                            </>
                        )}
                        {type === "record" && (
                            <>
                                {isReady && confirmRecodPreview ? (
                                    <>
                                        <Text as="h2" mb={5} fontSize="3xl">
                                            <Heading
                                                lineHeight="tall"
                                                bg="white"
                                                p={0}
                                                width="100%"
                                                rounded="md"
                                            >
                                                <Highlight
                                                    query="video"
                                                    styles={{
                                                        px: "2",
                                                        py: "1",
                                                        rounded: "full",
                                                        bg: "green.100",
                                                    }}
                                                >
                                                    What's the name of your
                                                    video?
                                                </Highlight>
                                            </Heading>
                                        </Text>
                                        {children}
                                    </>
                                ) : (
                                    <Box>
                                        {recodPreview ? (
                                            <Box>
                                                <Text fontSize="xl">
                                                    Are you happy with this?
                                                </Text>
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    <Button
                                                        my={2}
                                                        width="full"
                                                        colorScheme="brand"
                                                        onClick={() => {
                                                            setConfirmRecodPreview(
                                                                true,
                                                            );
                                                            setRecodPreview(
                                                                false,
                                                            );
                                                        }}
                                                    >
                                                        I am happy with this
                                                    </Button>{" "}
                                                    <Text px={2}>or </Text>
                                                    <Button
                                                        width="full"
                                                        onClick={() => {
                                                            setRecodPreview(
                                                                false,
                                                            );
                                                            setRecodData(false);
                                                        }}
                                                    >
                                                        I want to retry
                                                    </Button>
                                                </Box>
                                                <video
                                                    controls
                                                    width="full"
                                                    height="500px"
                                                    src={recodDataURL}
                                                ></video>
                                            </Box>
                                        ) : (
                                            <Recorder
                                                onFinish={(data) =>
                                                    handleRecordFinish(data)
                                                }
                                            />
                                        )}
                                        {!varient && (
                                            <Box mt={8}>
                                                <Text as="span">
                                                    Or try other options:{" "}
                                                    <Link
                                                        href="/videos/edit?type=upload"
                                                        ml={2}
                                                        textDecor="underline"
                                                    >
                                                        {" "}
                                                        Upload a video
                                                    </Link>
                                                    ,{" "}
                                                    <Link
                                                        href="/videos/edit?type=stock"
                                                        ml={2}
                                                        textDecor="underline"
                                                    >
                                                        {" "}
                                                        Stock Videos
                                                    </Link>
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </>
                        )}
                        {type === "import" && (
                            <>
                                {isReady ? (
                                    <>
                                        <Text as="h2" mb={5} fontSize="3xl">
                                            <Heading
                                                lineHeight="tall"
                                                bg="white"
                                                p={0}
                                                width="100%"
                                                rounded="md"
                                            >
                                                <Highlight
                                                    query="video"
                                                    styles={{
                                                        px: "2",
                                                        py: "1",
                                                        rounded: "full",
                                                        bg: "green.100",
                                                    }}
                                                >
                                                    What's the name of your
                                                    video?
                                                </Highlight>
                                            </Heading>
                                        </Text>
                                        {children}
                                    </>
                                ) : (
                                    <>
                                        <Text as="h2" mb={5} fontSize="3xl">
                                            <Heading
                                                lineHeight="tall"
                                                bg="white"
                                                p={0}
                                                width="100%"
                                                rounded="md"
                                            >
                                                <Highlight
                                                    query="other"
                                                    styles={{
                                                        px: "2",
                                                        py: "1",
                                                        rounded: "full",
                                                        bg: "green.100",
                                                    }}
                                                >
                                                    Import from other platforms
                                                </Highlight>
                                            </Heading>
                                        </Text>
                                        <Input
                                            placeholder="Paste a video link from one of the supported platforms"
                                            mt={4}
                                            onChange={(e) =>
                                                externalVideo(e.target.value)
                                            }
                                        />
                                        <Flex
                                            my={6}
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            <Box cursor="pointer">
                                                <Image
                                                    w={100}
                                                    src="/3rdparty/youtube.webp"
                                                    alt="Youtube"
                                                />
                                            </Box>
                                            <Box ml={12} cursor="pointer">
                                                <Image
                                                    w={100}
                                                    src="/3rdparty/vimeo.png"
                                                    alt="Vimeo"
                                                />
                                            </Box>
                                            <Box ml={12} cursor="pointer">
                                                <Image
                                                    w={100}
                                                    src="/3rdparty/facebook.jpeg"
                                                    alt="Vimeo"
                                                />
                                            </Box>
                                        </Flex>
                                    </>
                                )}
                            </>
                        )}
                        {type === "stock" && (
                            <>
                                {isReady ? (
                                    <>
                                        <Text as="h2" mb={5} fontSize="3xl">
                                            <Heading
                                                lineHeight="tall"
                                                bg="white"
                                                p={0}
                                                width="100%"
                                                rounded="md"
                                            >
                                                <Highlight
                                                    query="video"
                                                    styles={{
                                                        px: "2",
                                                        py: "1",
                                                        rounded: "full",
                                                        bg: "green.100",
                                                    }}
                                                >
                                                    What's the name of your
                                                    video?
                                                </Highlight>
                                            </Heading>
                                        </Text>
                                        {children}
                                    </>
                                ) : (
                                    <>
                                        <Text as="h2" mb={5} fontSize="3xl">
                                            <Heading
                                                lineHeight="tall"
                                                bg="white"
                                                p={0}
                                                width="100%"
                                                rounded="md"
                                            >
                                                <Highlight
                                                    query="Stock"
                                                    styles={{
                                                        px: "2",
                                                        py: "1",
                                                        rounded: "full",
                                                        bg: "green.100",
                                                    }}
                                                >
                                                    Use our vast library of
                                                    stock videos
                                                </Highlight>
                                            </Heading>
                                        </Text>
                                        <form>
                                            <Input
                                                placeholder="Search for a video"
                                                mt={4}
                                                onChange={(e) =>
                                                    searchVideo(e.target.value)
                                                }
                                            />
                                        </form>
                                        <Wrap
                                            my={6}
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            {videoFiles.map((video) => (
                                                <Box
                                                    key={video.id}
                                                    margin={1}
                                                    bg="gray"
                                                    cursor="pointer"
                                                    padding="2px"
                                                    onClick={() =>
                                                        externalVideo(
                                                            video.video_files[0]
                                                                .link,
                                                        )
                                                    }
                                                    rounded="md"
                                                >
                                                    <Image
                                                        height={120}
                                                        width={116}
                                                        src={video.image}
                                                    />
                                                </Box>
                                            ))}
                                        </Wrap>
                                        <Box mt={8}>
                                            <Text as="span">
                                                Or try other options:{" "}
                                                <Link
                                                    href="/videos/edit?type=upload"
                                                    ml={2}
                                                    textDecor="underline"
                                                >
                                                    {" "}
                                                    Upload a video
                                                </Link>
                                                ,{" "}
                                                <Link
                                                    href="/videos/edit?type=record"
                                                    ml={2}
                                                    textDecor="underline"
                                                >
                                                    {" "}
                                                    Record Screen
                                                </Link>
                                            </Text>
                                        </Box>
                                    </>
                                )}
                            </>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

type UploadProps = {
    externalVideo: any;
    saveScreenRecordingToCloud: any;
    isReady: boolean;
    isPorcessing?: boolean;
    children?: React.ReactNode;
};
