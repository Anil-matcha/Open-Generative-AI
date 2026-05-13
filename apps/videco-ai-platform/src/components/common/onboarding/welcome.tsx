import React, { FC, useCallback, useEffect, useState } from "react";
import {
    Box,
    Text,
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    FormControl,
    Input,
    Flex,
    useSteps,
    Image,
    Checkbox,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useUserStore } from "src/store/user";
import { motion, m } from "framer-motion";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { isTrialExpired } from "src/utils/isTrialExpierd";
import { sendEmail } from "src/services/api/sendEmail";
import { FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/router";
import { processOnboardingVideo } from "src/services/api/createAIPreview";
import { startTrial } from "src/services/api/startTrial";
import { internalAPIRequest } from "src/services/api/stripe-event";

type OnboardingProps = {
    pageTitle?: string;
};

const steps = [
    { title: "App Demo", description: "Watch the introduction video" },
    { title: "About You", description: "We want to know more about you" },
    {
        title: "Select Plan",
        description: "Enjoy free videco trial",
    },
];

export const Onboarding: FC<OnboardingProps> = (props) => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    const [fullname, setFullname] = useState(null);
    const [website, setWebsite] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(true);
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [creatingProfile, setCreatingProfile] = useState(false);
    const { setUser } = useUserStore();
    const session = useSession();
    const user = session?.user;
    const [plan, setPlan] = React.useState<any>([]);
    const [showCongratz, setShowCongratz] = useState(false);
    const [trail, setTrail] = React.useState<any>();
    const [videos, setVideos] = React.useState<any>(0);
    const [videoSize, setVideoSize] = React.useState<any>(0);
    const { getData } = useFetchTeamData();
    const { getPlan } = useUserPlan();
    const { activeStep, setActiveStep } = useSteps({
        index: 1,
        count: steps.length,
    });

    useEffect(() => {
        // Dynamically add the ProductLift SDK script
        const script = document.createElement("script");
        script.src = "https://roadmap.videco.io/widgets_sdk";
        script.defer = true;
        document.body.appendChild(script);

        // Cleanup to remove the script when the component unmounts
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    const MotionBox = motion(Box);

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`full_name, onboard_completed, job_title`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (!data.onboard_completed) {
                if (data.full_name) {
                    setFullname(data.full_name.split(" ")[0]);
                }
                setShowOnboarding(true);
                setActiveStep(1);
            } else {
                setShowOnboarding(false);
            }
        } catch (error) {
            console.log(error);
            setShowOnboarding(true);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, showOnboarding, setUser]);
    const getUserplan = async () => {
        setLoading(true);
        const fetchPlan = await getPlan(user?.id);
        setPlan(fetchPlan?.[0]?.plan_name);

        setTrail(fetchPlan?.[0]);
        setLoading(false);
        const data = await getData("videos", {
            col: "status",
            val: "deleted",
        });
        data && setVideoSize(calculateTotalSize(data));
        setVideos(data?.length);
        if (
            router.query.redirect_status === "succeeded" &&
            router.query.payment_intent
        ) {
            setShowCongratz(false);
            setPaymentProcessing(true);
            setActiveStep(3);
        } else {
            setPaymentProcessing(false);

            showOnboarding &&
                setShowCongratz(fetchPlan?.[0]?.plan_name ? true : false);
            setActiveStep(fetchPlan?.[0]?.plan_name ? 2 : 1);
        }
    };
    const updateProfile = async (e) => {
        e.preventDefault();

        setCreatingProfile(true);
        if (window.po) {
            window.po("customers", "signup", {
                data: {
                    key: user.email,
                    name: fullname,
                    email: user.email,
                },
            });
        }
        const { data, error } = await supabase.from("profiles").upsert({
            full_name: fullname,
            website: website,
            onboarding_video: "in_progress",
            id: user?.id,
            onboard_completed: true,
        });

        await supabase.from("sub_accounts").upsert({
            main_account: user.id,
            shared_account: user.email,
            shared_account_user: user.id,
            name: user.user_metadata.full_name,
            role: "owner",
        });

        await supabase
            .from("plan")
            .upsert({
                plan_name: "growth",
                user_id: user?.id,
                free_trial_start_date: new Date().toJSON().slice(0, 10),
                free_trial_ended: false,
                status: "active",
            })
            .select();

        const startJob = await processOnboardingVideo({
            og_video_public_id: "jdgx4ief93digpesea69",
            voice_id: "e3cfb432-e548-4145-b7b7-d93da78b8a9c",
            background: "website",
            user_id: user.id,
            language: "english",
            greeting: "Hello",
            text: fullname,
            website: website,
            voiceCloningEnabled: true,
        });
        await sendEmail("/api/mail/welcome", {
            email: user.email,
            name: fullname,
        });
        await startTrial("/api/brevo/start-trial", {
            user_email: user?.email,
            plan_name: "growth",
        });
        if (error) {
            console.log(error);
            setCreatingProfile(false);
        } else {
            setCreatingProfile(false);
            setShowOnboarding(false);
            setShowVideo(true);
        }
        getUserplan();
        await internalAPIRequest("/api/credits/deduct", {
            user_id: user.id,
        });
        router.reload();
        setShowOnboarding(false);
    };

    useEffect(() => {
        getProfile();
    }, [user, getProfile, showOnboarding]);

    const calculateTotalSize = (data) => {
        let totalSize = 0;
        data.forEach((item: { size: number }) => {
            totalSize += item.size;
        });
        return totalSize;
    };

    useEffect(() => {
        getUserplan();
    }, []);

    useEffect(() => {
        const endTrail = async () => {
            try {
                await supabase
                    .from("plan")
                    .update({
                        status: "free_trial_ended",
                        free_trial_ended: true,
                    })
                    .eq("user_id", user?.id);
            } catch (error) {
                console.log("error..", error);
            }
        };
        if (
            trail &&
            isTrialExpired(trail?.free_trial_start_date, trail?.status) &&
            !trail?.free_trial_ended
        ) {
            endTrail();
        }
    }, [trail]);
    return (
        <>
            {loading ? null : (
                <Modal onClose={() => null} size="full" isOpen={showOnboarding}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalBody mb={3} p={0}>
                            <Flex
                                w="full"
                                direction={["column", "column", "row"]}
                                p={0}
                                height="full"
                                bg="white"
                                m={0}
                            >
                                <Box
                                    w={["100%", "100%", "60%"]}
                                    ml={4}
                                    pr={6}
                                    height="full"
                                >
                                    <Box
                                        w={["100%", "100%", "100%"]}
                                        ml={4}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignContent="center"
                                    >
                                        <Image
                                            mt={6}
                                            mb={4}
                                            ml={3}
                                            w="100px"
                                            display="block"
                                            src="/logo.svg"
                                        />
                                    </Box>

                                    {!showVideo && (
                                        <>
                                            <Box
                                                m="40px auto"
                                                bg="white"
                                                maxW="660px"
                                                p={12}
                                                rounded="md"
                                            >
                                                <Text
                                                    fontSize="2xl"
                                                    fontWeight="bold"
                                                    mt={2}
                                                    color="#383F40"
                                                    textAlign="left"
                                                >
                                                    Welcome to Videco!
                                                </Text>
                                                <Text
                                                    fontSize="16px"
                                                    mb={4}
                                                    color="#9C9F9F"
                                                    textAlign="left"
                                                >
                                                    Let's start by creating your
                                                    own personalized video.
                                                </Text>
                                                <form onSubmit={updateProfile}>
                                                    <FormControl
                                                        isRequired
                                                        mt={1}
                                                    >
                                                        <Text
                                                            fontSize="md"
                                                            mb={1}
                                                        >
                                                            What is your name?
                                                        </Text>
                                                        <Input
                                                            border="1px solid #05405A"
                                                            required
                                                            defaultValue={
                                                                fullname
                                                            }
                                                            onChange={(e) =>
                                                                setFullname(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="John Doe"
                                                        />
                                                    </FormControl>
                                                    <FormControl mt={4}>
                                                        <Text
                                                            fontSize="md"
                                                            mb={1}
                                                        >
                                                            What is your
                                                            website?
                                                        </Text>
                                                        <Input
                                                            border="1px solid #05405A"
                                                            required
                                                            onChange={(e) =>
                                                                setWebsite(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="https://videco.io"
                                                        />
                                                    </FormControl>
                                                    <FormControl
                                                        mt={4}
                                                        isRequired
                                                    >
                                                        <Checkbox>
                                                            I have read and
                                                            accept the{" "}
                                                            <a
                                                                href="https://videco.io/privacy-policy/"
                                                                target="_blank"
                                                            >
                                                                Privacy Policy
                                                            </a>
                                                        </Checkbox>
                                                    </FormControl>
                                                    <Button
                                                        display="flex"
                                                        px={12}
                                                        py="18px"
                                                        fontWeight="normal"
                                                        width="full"
                                                        colorScheme="teal"
                                                        rightIcon={
                                                            <FiArrowRight />
                                                        }
                                                        rounded="md"
                                                        isLoading={
                                                            loading ||
                                                            creatingProfile
                                                        }
                                                        bg="#05405A"
                                                        fontSize="16px"
                                                        margin="62px auto 0"
                                                        type="submit"
                                                    >
                                                        Continue
                                                    </Button>
                                                </form>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                                <Box
                                    w={["100%", "100%", "40%"]}
                                    position="absolute"
                                    right={0}
                                    h="98.8%"
                                    mt={1}
                                    mr={1}
                                    rounded="xl"
                                    // bg="url('/assets/bg-onboarding.png')"
                                    backgroundSize="90%"
                                    backgroundColor="#14213d"
                                    backgroundRepeat="no-repeat"
                                    backgroundPosition="center"
                                >
                                    <Box
                                        pos="absolute"
                                        top={32}
                                        left="40"
                                        fontWeight="bold"
                                        color="white"
                                        fontSize="24px"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        Hi{" "}
                                        <MotionBox
                                            className="text-3xl font-bold"
                                            animate={{
                                                x: [0, -5, 5, -5, 5, 0], // Moves left and right
                                            }}
                                            ml={1}
                                            transition={{
                                                duration: 0.3,
                                            }} // Keeps shaking infinitely
                                        >
                                            {fullname ? fullname : "There"}
                                        </MotionBox>
                                        , Welcome to Videco!
                                    </Box>
                                    <Text
                                        pos="absolute"
                                        top={44}
                                        left="30"
                                        px={12}
                                        fontSize="sm"
                                        textAlign="center"
                                        color="white"
                                    >
                                        Book 5x more meetings and close deals
                                        with AI-powered personalized videos that
                                        engage your prospects instantly
                                    </Text>
                                    <Box
                                        pos="absolute"
                                        top={64}
                                        left="33"
                                        ml={7}
                                        px={12}
                                        opacity="0.6"
                                    >
                                        <video
                                            src="https://res.cloudinary.com/dhd6m0fh3/video/upload/v1738168015/Hey_First_name_2_snyiuw.mp4"
                                            muted
                                            autoPlay
                                            style={{
                                                borderRadius: "20px",
                                                border: "1px solid #DADADA",
                                            }}
                                            width={400}
                                        />
                                    </Box>
                                </Box>
                            </Flex>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};
