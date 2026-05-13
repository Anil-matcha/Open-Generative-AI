import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Spinner,
    Text,
    Link,
    Card,
    Flex,
    useSteps,
    Button,
    useToast,
    Divider,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { FiArrowRight, FiChrome, FiMonitor } from "react-icons/fi";
import { videoTypes } from "src/utils/video";
import { useUserPlan } from "src/hooks/useUserPlan";

const New: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [loadingCampaign, setLoadingCampaign] = useState(false);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [needUpgrade, setNeedUpgrade] = useState(false);
    const [videoData, setVideoData] = useState<any>();
    const toast = useToast();
    const { currentUserPlan } = useUserPlan();
    const session = useSession();
    const user = session?.user;
    const handleLimits = async () => {
        const plan = await currentUserPlan();
        if (plan) {
            if (plan?.plan_name === "lite" && videoData?.length >= 20) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                setNeedUpgrade(true);
            } else if (
                plan?.plan_name === "growth" &&
                videoData?.length >= 100
            ) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                setNeedUpgrade(true);
            } else if (
                plan?.plan_name === "scale" &&
                videoData?.length >= 250
            ) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                setNeedUpgrade(true);
            } else if (plan?.plan_name === "enterprise") {
                setNeedUpgrade(false);
            } else {
                setNeedUpgrade(false);
            }
        }
    };
    useEffect(() => {
        window.usetifulTags = { userId: user?.id };

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.usetiful.com/dist/usetiful.js";
        script.setAttribute("id", "usetifulScript");
        script.dataset.token = process.env.NEXT_PUBLIC_USETIFUL_TOKEN;
        document.head.appendChild(script);
        handleLimits();
        return () => {
            // Cleanup script when component unmounts
            document.head.removeChild(script);
        };
    }, [user]);
    useEffect(() => {
        handleLimits();
    }, [videoData]);

    const router = useRouter();
    const { getData } = useFetchTeamData();
    const { clearVideo } = useEditorStore();

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);

            const data = await getData("videos", {
                col: "status",
                val: "",
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
    const createCampaign = useCallback(async () => {
        try {
            setLoadingCampaign(true);

            const { error, data } = await supabase
                .from("videos")
                .insert({
                    user_id: user?.id,
                    status: "draft",
                    campaign_name: `Campaign #${Math.floor(
                        Math.random() * 10,
                    )}`,
                    type: videoTypes.campaign,
                    url: "",
                })
                .select("id");
            window.location.href = `/campaign/steps/start?id=${data[0].id}`;
            if (error) throw error;
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingCampaign(false);
        }
    }, [user, supabase]);

    const createClone = useCallback(async () => {
        try {
            setLoadingCampaign(true);

            const { error, data } = await supabase
                .from("videos")
                .insert({
                    user_id: user?.id,
                    status: "draft",
                    campaign_name: `Clone #${Math.floor(Math.random() * 10)}`,
                    type: videoTypes.clone,
                    url: "",
                })
                .select("id");
            window.location.href = `/clones/create?id=${data[0].id}`;
            if (error) throw error;
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingCampaign(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);
    const steps = [
        { title: "Create", description: "Create" },
        { title: "Clone", description: "Clone AI" },
        { title: "Upload Video", description: "Upload Video" },
        { title: "CSV Upload", description: "CSV Upload" },
    ];

    const { activeStep, setActiveStep } = useSteps({
        index: 1,
        count: steps.length,
    });

    const activeStepText = steps[activeStep].description;

    const max = steps.length - 1;
    const progressPercent = (activeStep / max) * 100;
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
                        pos="relative"
                        zIndex={9}
                        m="auto"
                        maxW="1000px"
                        w="full"
                        px={24}
                        py={22}
                        bg="#f7f9fa"
                        boxShadow="sm"
                        rounded="lg"
                    >
                        <Text
                            color="#05405A"
                            fontSize="30"
                            fontWeight="semibold"
                            textAlign="left"
                            mt={6}
                        >
                            Choose video type
                        </Text>
                        <Text color="#05405A" fontSize="16" textAlign="left">
                            Select the type of video or campaign you want to
                            create
                        </Text>

                        <Flex
                            pb={6}
                            flexDir={["column", "column", "row"]}
                            mt={6}
                            justifyContent="space-between"
                        >
                            <Card
                                p={4}
                                py={5}
                                maxW="250"
                                mb="4"
                                bg="white"
                                color="#383F40"
                                border="2px solid #00000012"
                                boxShadow="md"
                                // _hover={{
                                //     border: "2px solid #4991A1",
                                //     boxShadow: "md",
                                // }}
                                rounded="lg"
                                cursor="pointer"
                                onClick={createClone}
                                display="flex"
                                flexDir="column"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box
                                    height="auto"
                                    maxW="220"
                                    rounded="md"
                                    bg="black"
                                    p={1}
                                >
                                    <video
                                        autoPlay={true}
                                        loop
                                        muted
                                        src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1733740543/qnpsgtdubqgtylmuvpmu.webm"
                                    />
                                </Box>
                                <Box mt={6}>
                                    <Text
                                        fontSize="lg"
                                        fontWeight="semibold"
                                        color="#05405A"
                                        as="span"
                                        display="flex"
                                    >
                                        AI Clone
                                        <Text fontSize="2xs" ml={1}>
                                            Beta
                                        </Text>
                                    </Text>
                                    <Text fontSize="15">
                                        Create your own AI clone from your
                                        recording and create your videos from
                                        script.
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="semibold"
                                        _hover={{
                                            bg: "white",
                                            fontWeight: "bold",
                                        }}
                                        fontSize="14"
                                        mt={4}
                                        color="#4991A1"
                                        rightIcon={
                                            <FiArrowRight
                                                style={{
                                                    marginLeft: "2px",
                                                }}
                                            />
                                        }
                                    >
                                        Continue
                                    </Button>
                                )}
                            </Card>
                            <Card
                                p={4}
                                py={5}
                                maxW="250"
                                mb="4"
                                bg="white"
                                color="#383F40"
                                border="2px solid #00000012"
                                boxShadow="md"
                                _hover={{
                                    border: "2px solid #4991A1",
                                    boxShadow: "md",
                                }}
                                rounded="lg"
                                cursor="pointer"
                                onClick={() => {
                                    if (needUpgrade) {
                                        router.push("/pricing");
                                    } else {
                                        setLoadingUpload(true);
                                        createCampaign();
                                    }
                                }}
                                display="flex"
                                flexDir="column"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box
                                    height="auto"
                                    maxW="220"
                                    rounded="md"
                                    bg="black"
                                    p={1}
                                >
                                    <video
                                        autoPlay={true}
                                        loop
                                        muted
                                        src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1726760673/Grey_and_Ivory_Collage_Simple_Photo_Minimalist_Fashion_Collection_YouTube_Intro_2.mp4"
                                    />
                                </Box>
                                <Box mt={6}>
                                    <Text
                                        fontSize="lg"
                                        fontWeight="semibold"
                                        color="#05405A"
                                    >
                                        Personalized campaign
                                    </Text>
                                    <Text fontSize="15">
                                        Generate 1000s of videos from one video
                                        and embed it on your own email platform.
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="semibold"
                                        _hover={{
                                            bg: "white",
                                            fontWeight: "bold",
                                        }}
                                        fontSize="14"
                                        mt={4}
                                        color="#4991A1"
                                        rightIcon={
                                            <FiArrowRight
                                                style={{
                                                    marginLeft: "2px",
                                                }}
                                            />
                                        }
                                    >
                                        {needUpgrade
                                            ? "Please Upgrade"
                                            : "Continue"}
                                    </Button>
                                )}
                            </Card>

                            <Card
                                p={4}
                                py={5}
                                maxW="250"
                                mb="4"
                                bg="white"
                                color="#383F40"
                                border="2px solid #00000012"
                                boxShadow="md"
                                _hover={{
                                    border: "2px solid #4991A1",
                                    boxShadow: "md",
                                }}
                                rounded="lg"
                                cursor="pointer"
                                onClick={() => {
                                    if (needUpgrade) {
                                        router.push("/pricing");
                                    } else {
                                        setLoadingUpload(true);
                                        router.push("/videos/edit?type=upload");
                                    }
                                }}
                                display="flex"
                                flexDir="column"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box
                                    height="auto"
                                    maxW="220"
                                    rounded="md"
                                    bg="black"
                                    p={1}
                                >
                                    <video
                                        autoPlay={true}
                                        loop
                                        muted
                                        src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1735839318/qyhz03uwj9r0oxwutx69.mp4"
                                    />
                                </Box>
                                <Box mt={6}>
                                    <Text
                                        fontSize="lg"
                                        fontWeight="semibold"
                                        color="#05405A"
                                    >
                                        Upload video
                                    </Text>
                                    <Text fontSize="15">
                                        Upload a single regular video and share
                                        it right away with anyone.
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="semibold"
                                        _hover={{
                                            bg: "white",
                                            fontWeight: "bold",
                                        }}
                                        fontSize="14"
                                        mt={4}
                                        color="#4991A1"
                                        rightIcon={
                                            <FiArrowRight
                                                style={{
                                                    marginLeft: "2px",
                                                }}
                                            />
                                        }
                                    >
                                        {needUpgrade
                                            ? "Please Upgrade"
                                            : "Continue"}
                                    </Button>
                                )}
                            </Card>
                        </Flex>
                        <Divider mb={4} />
                        <Box>
                            <Text>
                                Don't have a video yet? Use our free tools to
                                create:
                            </Text>
                            <Box display="flex">
                                <Button
                                    mt={4}
                                    fontSize="sm"
                                    onClick={() => router.push("/teleprompter")}
                                    alignItems="center"
                                    display="flex"
                                    variant="videco"
                                >
                                    <FiMonitor
                                        style={{
                                            marginRight: "5px",
                                        }}
                                    />{" "}
                                    Teleprompter
                                </Button>
                                <Button
                                    mt={4}
                                    disabled
                                    ml={4}
                                    fontSize="sm"
                                    alignItems="center"
                                    display="flex"
                                    variant="videco"
                                >
                                    <FiChrome
                                        style={{
                                            marginRight: "5px",
                                        }}
                                    />{" "}
                                    Chrome Extention (Coming Soon)
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
};
export default New;
