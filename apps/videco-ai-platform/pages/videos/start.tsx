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
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { FiArrowRight } from "react-icons/fi";
import { videoTypes } from "src/utils/video";

const Start: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [loadingCampaign, setLoadingCampaign] = useState(false);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [videoData, setVideoData] = useState<any>();
    const session = useSession();
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
    const router = useRouter();
    const { getData } = useFetchTeamData();
    const { clearVideo } = useEditorStore();

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);

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
                <Box bg="#F7F9FA">
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="32px auto"
                        maxW="1000px"
                        w="full"
                        px={24}
                        py={22}
                        bg="#F7F9FA"
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
                            flexDir="row"
                            mt={12}
                            justifyContent="space-between"
                        >
                            <Card
                                p={4}
                                py={5}
                                maxW="250"
                                mb="4"
                                bg="white"
                                color="#383F40"
                                border="2px solid white"
                                boxShadow="sm"
                                _hover={{
                                    border: "2px solid #4991A1",
                                    boxShadow: "md",
                                }}
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
                                        src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1726760673/Grey_and_Ivory_Collage_Simple_Photo_Minimalist_Fashion_Collection_YouTube_Intro_2.mp4"
                                    />
                                </Box>
                                <Box mt={4}>
                                    <Text fontSize="lg">AI Clone</Text>
                                    <Text as="span" fontSize="xs">
                                        Create your own AI clone from your
                                        recording, With this you will be able to
                                        create your videos from script.
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="normal"
                                        fontSize="14"
                                        mt={2}
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
                                border="2px solid white"
                                boxShadow="sm"
                                _hover={{
                                    border: "2px solid #4991A1",
                                    boxShadow: "md",
                                }}
                                rounded="lg"
                                cursor="pointer"
                                onClick={createCampaign}
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
                                <Box mt={4}>
                                    <Text fontSize="lg">
                                        Personalized campaign
                                    </Text>
                                    <Text as="span" fontSize="xs">
                                        Generate 1000s of videos from one video
                                        and embed it on your own email platform
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="normal"
                                        fontSize="14"
                                        mt={2}
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
                                border="2px solid white"
                                boxShadow="sm"
                                _hover={{
                                    border: "2px solid #4991A1",
                                    boxShadow: "md",
                                }}
                                rounded="lg"
                                cursor="pointer"
                                onClick={() => {
                                    setLoadingUpload(true);
                                    router.push("/videos/edit?type=upload");
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
                                <Box mt={4}>
                                    <Text fontSize="lg">Upload video</Text>
                                    <Text as="span" fontSize="xs">
                                        Upload a single regular video and add
                                        interactive elements to before share it
                                        quickly with anyone
                                    </Text>
                                </Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        fontWeight="normal"
                                        fontSize="14"
                                        mt={2}
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
                        </Flex>
                    </Box>
                    <Box
                        pos="fixed"
                        w="full"
                        h="full"
                        bg="white"
                        zIndex={1}
                        top="0"
                        // backgroundImage="url('/upload-bg.png')"
                        backgroundSize="cover"
                        filter={"blur(4px)"}
                        left="0"
                    />
                </Box>
            )}
        </>
    );
};
export default Start;
