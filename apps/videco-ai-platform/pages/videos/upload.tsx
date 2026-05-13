import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Image,
    Spinner,
    Text,
    Link,
    Card,
    Flex,
    Button,
    useSteps,
    Progress,
    Step,
    Stepper,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { Header } from "@components/common/header";
import { FiArrowRight, FiCamera, FiUpload } from "react-icons/fi";

const Upload: React.FC = () => {
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
        index: 3,
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
                        zIndex={9}
                        pos="relative"
                        display="flex"
                        justifyContent="space-between"
                        p={12}
                        position="absolute"
                        w="full"
                    >
                        <Image src="/logo.svg" />
                        <Link href="/videos">Go Back</Link>
                    </Box>
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="22px auto"
                        maxW="700px"
                        w="full"
                        px={6}
                        bg="white"
                        boxShadow="sm"
                        border="1px solid #ccc"
                        rounded="md"
                    >
                        <Box
                            position="relative"
                            maxW="full"
                            mt="-11px"
                            ml="-25px"
                        >
                            <Stepper size="sm" index={activeStep} gap="0">
                                {steps.map((step, index) => (
                                    <Step key={index}></Step>
                                ))}
                            </Stepper>
                            <Progress
                                value={progressPercent}
                                position="absolute"
                                height="3px"
                                width="full"
                                top="10px"
                                zIndex={-1}
                            />
                        </Box>
                        <Text
                            fontSize="30"
                            fontWeight="semibold"
                            textAlign="center"
                            mt={6}
                        >
                            Upload or record video
                        </Text>
                        <Text fontSize="14" textAlign="center" mt={1} px="61px">
                            Upload the video you would like to send to your
                            prospects and we will merge personalized greetings
                            with your cloned voice.
                        </Text>
                        <Box
                            height="auto"
                            mx={20}
                            mt="5"
                            rounded="md"
                            bg="black"
                            p={1}
                        >
                            <video
                                autoPlay={true}
                                loop
                                muted
                                src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1726747536/Live_pjfajv.mp4"
                            />
                        </Box>
                        <Flex p={12} flexDir="column" mx={8}>
                            <Card
                                p={4}
                                py={5}
                                mb="4"
                                border="2px solid #9b9a9a"
                                _hover={{
                                    border: "2px solid green",
                                }}
                                cursor="pointer"
                                onClick={() => {
                                    setLoadingCampaign(true);
                                    router.push(
                                        `/videos/edit?type=upload&id=${router.query.id}&varient=personalize`,
                                    );
                                }}
                                display="flex"
                                flexDir="row"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Box>Upload a video</Box>
                                {loadingCampaign ? (
                                    <Spinner />
                                ) : (
                                    <FiUpload
                                        size="30"
                                        style={{
                                            marginLeft: "22px",
                                        }}
                                    />
                                )}
                            </Card>
                            <Card
                                onClick={() => {
                                    setLoadingUpload(true);
                                    router.push(
                                        `/videos/edit?type=record&id=${router.query.id}&varient=personalize`,
                                    );
                                }}
                                p={4}
                                py={5}
                                mb="4"
                                border="2px solid #dfdfdf"
                                _hover={{
                                    border: "2px solid green",
                                }}
                                cursor="pointer"
                                display="flex"
                                flexDir="row"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Box>Record a video</Box>
                                {loadingUpload ? (
                                    <Spinner />
                                ) : (
                                    <FiCamera
                                        size="30"
                                        style={{
                                            marginLeft: "22px",
                                        }}
                                    />
                                )}
                            </Card>
                        </Flex>
                    </Box>
                    <Box
                        pos="fixed"
                        w="full"
                        h="full"
                        bg="#717171"
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
export default Upload;
