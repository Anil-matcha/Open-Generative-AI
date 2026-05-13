import {
    Box,
    Link,
    Text,
    Image,
    Flex,
    Input,
    Heading,
    Highlight,
    Alert,
    Spinner,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { Video } from "pexels";
import { FiFolder, FiVideo } from "react-icons/fi";
import { useRouter } from "next/router";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useSession } from "@supabase/auth-helpers-react";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import Pricing from "@components/common/pricing";
import { Recorder } from "@components/features/recorder/recorder";
import { Library } from "./library";

export const UploadV2: React.FC<UploadProps> = ({
    externalVideo,
    saveScreenRecordingToCloud,
    children,
    handleDownload,
    isReady,
    isPorcessing,
    id,
}) => {
    const [videoFiles, setVideoFiles] = React.useState<Video[]>([]);
    const router = useRouter();
    const session = useSession();
    const user = session?.user;
    const [showPricing, setShowPricing] = React.useState<any>(false);
    const [plan, setPlan] = React.useState<any>();
    const { getPlan } = useUserPlan();
    const { getData } = useFetchTeamData();
    const { type = "upload", varient } = router.query;

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
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
                        pt={6}
                        bg="white"
                        marginTop="-12px"
                        zIndex={4}
                        rounded="md"
                    >
                        {isPorcessing && (
                            <Box height="full" mb={5}>
                                <Alert rounded="md" status="info">
                                    <Spinner mr={3} />
                                    Your video is processing, please wait...
                                </Alert>
                            </Box>
                        )}
                        {type === "upload" && (
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                w="full"
                                alignItems="center"
                            >
                                {children}

                                {!varient && (
                                    <Box display="flex" flexDir="column">
                                        <Library
                                            handleDownload={handleDownload}
                                        />

                                        <Link
                                            _hover={{
                                                cursor: "pointer",
                                                bg: "#6ff6ce",
                                            }}
                                            rounded="md"
                                            href={`/videos/edit?type=record&id=${id}&varient=personalize`}
                                        >
                                            <Box
                                                border="1px solid #e6e4e4"
                                                px={6}
                                                py="8px"
                                                minWidth="230px"
                                                bg="#F6F6F6"
                                                width="full"
                                                height="auto"
                                                rounded="md"
                                                alignItems="center"
                                                display="flex"
                                                flexDir="column"
                                            >
                                                <FiVideo
                                                    style={{
                                                        marginRight: "8px",
                                                    }}
                                                />
                                                <Text fontSize="14px" mt={2}>
                                                    Record Video
                                                </Text>
                                            </Box>
                                        </Link>
                                    </Box>
                                )}
                            </Box>
                        )}
                        {type === "record" && (
                            <>
                                {isReady ? (
                                    <>
                                        <Text mb={5} fontSize="3xl" as="span">
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
                                        <Recorder
                                            onFinish={(data) =>
                                                saveScreenRecordingToCloud(data)
                                            }
                                        />
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
                                    <></>
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
    handleDownload?: any;
    isReady: boolean;
    id?: string;
    isPorcessing?: boolean;
    children?: React.ReactNode;
};
