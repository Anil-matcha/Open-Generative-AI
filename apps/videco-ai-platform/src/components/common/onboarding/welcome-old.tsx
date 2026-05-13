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
    Skeleton,
    Stack,
    Spinner,
    Flex,
    Step,
    StepIcon,
    StepIndicator,
    StepNumber,
    Stepper,
    StepSeparator,
    StepStatus,
    StepTitle,
    useSteps,
    Select,
    Image,
    Link,
    Checkbox,
} from "@chakra-ui/react";
import Confetti from "react-confetti";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useUserStore } from "src/store/user";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { isTrialExpired } from "src/utils/isTrialExpierd";
import { sendEmail } from "src/services/api/sendEmail";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";
import { useRouter } from "next/router";
import { signupTracking } from "src/services/api/partnero";
import { PricingTable } from "../pricing/table";

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
    const [loading, setLoading] = useState(true);
    const [fullname, setFullname] = useState(null);
    const [jobTitle, setJobTitle] = useState(null);
    const [usecase, setUsecase] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(true);
    const router = useRouter();
    const [currentCRM, setCurrentCRM] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [hideConfetti, setHideConfetti] = useState(false);
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
            if (!data.full_name && !data.onboard_completed) {
                setShowOnboarding(true);
                setActiveStep(1);
            } else if (
                data.full_name &&
                !data.job_title &&
                !data.onboard_completed
            ) {
                setShowOnboarding(true);
                setActiveStep(1);
            } else if (
                data.full_name &&
                data.job_title &&
                !data.onboard_completed
            ) {
                setFullname(data.full_name);
                setUser({
                    fullName: data.full_name,
                });
                setShowOnboarding(true);
                setShowCongratz(true);
                setActiveStep(2);
                await signupTracking(user.email, data.full_name);
            }
        } catch (error) {
            console.log(error);
            setShowOnboarding(true);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, showOnboarding, setUser]);

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
            usecase: usecase,
            job_title: jobTitle,
            current_crm: currentCRM,
            id: user?.id,
            onboard_completed: false,
        });

        await supabase.from("sub_accounts").upsert({
            main_account: user.id,
            shared_account: user.email,
            shared_account_user: user.id,
            name: user.user_metadata.full_name,
            role: "owner",
        });
        await sendEmail("/api/mail/welcome", {
            email: user.email,
            name: fullname,
        });
        if (error) {
            console.log(error);
            setCreatingProfile(false);
        } else {
            setCreatingProfile(false);
            setShowOnboarding(false);
            setShowVideo(true);
        }
        setActiveStep(2);
        setShowCongratz(true);
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
        const plan = async () => {
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
        plan();
    }, []);
    useEffect(() => {
        if (showCongratz) {
            setTimeout(() => setHideConfetti(true), 5000);
        }
    }, [showCongratz]);
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
                <Modal
                    onClose={() => null}
                    size="full"
                    isOpen={
                        !plan || showVideo || showOnboarding || showCongratz
                    }
                >
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
                                            mt={4}
                                            mb={4}
                                            ml={5}
                                            w="100px"
                                            display="block"
                                            src="/logo.svg"
                                        />
                                        <Stepper
                                            orientation="horizontal"
                                            px={4}
                                            mr={12}
                                            py={6}
                                            rounded="md"
                                            w="40%"
                                            index={activeStep}
                                            colorScheme="brand"
                                            gap="0"
                                        >
                                            {steps.map((step, index) => (
                                                <Step key={index}>
                                                    <StepIndicator borderColor="#9C9F9F">
                                                        <StepStatus
                                                            complete={
                                                                <StepIcon fontSize="12" />
                                                            }
                                                            incomplete={
                                                                <StepNumber fontSize="12" />
                                                            }
                                                            active={
                                                                <StepNumber fontSize="12" />
                                                            }
                                                        />
                                                    </StepIndicator>

                                                    <Box flexShrink="0">
                                                        <StepTitle>
                                                            <Text fontSize="12px">
                                                                {step.title}
                                                            </Text>
                                                        </StepTitle>
                                                    </Box>

                                                    <StepSeparator
                                                        style={{
                                                            background:
                                                                "#383F40",
                                                        }}
                                                    />
                                                </Step>
                                            ))}
                                        </Stepper>
                                    </Box>
                                    {!paymentProcessing && (
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            mt={13}
                                            color="#383F40"
                                            mx={12}
                                            textAlign="center"
                                        >
                                            {showCongratz
                                                ? "Select your plan"
                                                : " Welcome to Videco - Let's get started!"}
                                        </Text>
                                    )}
                                    {showCongratz && (
                                        <>
                                            <Box pos="fixed" top={0} left={0}>
                                                <Confetti
                                                    hidden={hideConfetti}
                                                />
                                            </Box>
                                            <Text
                                                color="#383F40"
                                                textAlign="center"
                                                mx={24}
                                                mt={5}
                                                fontSize="16px"
                                            >
                                                Discover the plan that suits you
                                                best! Not ready to dive in just
                                                yet? Get started with our Growth
                                                plan 7-day trial for just a
                                                one-time payment of €3. Still
                                                not ready?{" "}
                                                <a
                                                    href="https://videco.io/demo/"
                                                    target="_blank"
                                                    style={{
                                                        textDecoration:
                                                            "underline",
                                                    }}
                                                >
                                                    Book a demo with us.
                                                </a>
                                            </Text>
                                            {/* <Box
                                            textAlign="center"
                                            w="full"
                                            mt={6}
                                            fontSize="34"
                                            fontWeight="bold"
                                            bgGradient="linear(to-l, #7928CA, #FF0080)"
                                            bgClip="text"
                                        >
                                            <AnimatedCounter from={0} to={7} />{" "}
                                        </Box> */}
                                            <Box margin="0 auto" maxW="90%">
                                                <PricingTable
                                                    freeLitePlan
                                                    user={user}
                                                />
                                            </Box>
                                        </>
                                    )}
                                    {!showVideo && (
                                        <>
                                            {creatingProfile && (
                                                <>
                                                    <Stack
                                                        textAlign="center"
                                                        mt={2}
                                                    >
                                                        <Text
                                                            fontWeight="bold"
                                                            mb={5}
                                                        >
                                                            Please wait. We are
                                                            creating your
                                                            profile..
                                                            <Spinner
                                                                ml={2}
                                                                mb="-1"
                                                            />
                                                        </Text>

                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                    </Stack>
                                                </>
                                            )}

                                            {paymentProcessing && (
                                                <>
                                                    <Stack
                                                        maxW="70%"
                                                        p={12}
                                                        margin="0 auto"
                                                        textAlign="center"
                                                        mt={2}
                                                    >
                                                        <Text
                                                            fontWeight="bold"
                                                            mb={5}
                                                        >
                                                            Please wait. We are
                                                            processing your
                                                            payment.. If this
                                                            doesn't go away
                                                            after a few seconds
                                                            please contact
                                                            support@videco.io
                                                            <Spinner
                                                                ml={2}
                                                                mb="-1"
                                                            />
                                                        </Text>

                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                        <Skeleton height="20px" />
                                                    </Stack>
                                                </>
                                            )}
                                            {activeStep === 1 && (
                                                <Box p={6} pt={2}>
                                                    <Box
                                                        mt={3}
                                                        rounded="md"
                                                        sx={{
                                                            video: {
                                                                borderRadius:
                                                                    "12px",
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            style={{
                                                                position:
                                                                    "relative",
                                                                boxSizing:
                                                                    "content-box",
                                                                maxHeight:
                                                                    "200vh",
                                                                width: "100%",
                                                                aspectRatio:
                                                                    "3",
                                                                padding:
                                                                    "40px 0",
                                                            }}
                                                        >
                                                            <iframe
                                                                src="https://app.supademo.com/embed/cm42w21bb13uwjfcxfmhug1je?embed_v=2"
                                                                loading="lazy"
                                                                title="Videco Demo"
                                                                allow="clipboard-write"
                                                                width="100%"
                                                                height="100%"
                                                                frameBorder="0"
                                                                allowFullScreen
                                                                style={{
                                                                    position:
                                                                        "absolute",
                                                                    top: 0,
                                                                    left: 0,
                                                                    padding: 0,
                                                                    width: "100%",
                                                                    height: "100%",
                                                                }}
                                                            ></iframe>
                                                        </Box>
                                                    </Box>

                                                    <Button
                                                        display="flex"
                                                        px={12}
                                                        py="26px"
                                                        rounded="full"
                                                        width="full"
                                                        fontWeight="medium"
                                                        colorScheme="teal"
                                                        bg="#05405A"
                                                        fontSize="20px"
                                                        rightIcon={
                                                            <FiArrowRight />
                                                        }
                                                        margin="62px auto 0"
                                                        onClick={() =>
                                                            setActiveStep(2)
                                                        }
                                                        type="submit"
                                                    >
                                                        Continue
                                                    </Button>
                                                </Box>
                                            )}

                                            {!showCongratz &&
                                                !creatingProfile &&
                                                activeStep === 2 && (
                                                    <Box
                                                        m={10}
                                                        bg="white"
                                                        p={12}
                                                        rounded="md"
                                                    >
                                                        <form
                                                            onSubmit={
                                                                updateProfile
                                                            }
                                                        >
                                                            <FormControl
                                                                isRequired
                                                                mt={7}
                                                            >
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    fontSize="md"
                                                                    mb={1}
                                                                >
                                                                    What is your
                                                                    name?
                                                                </Text>
                                                                <Input
                                                                    border="1px solid #05405A"
                                                                    required
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setFullname(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="John Doe"
                                                                />
                                                            </FormControl>
                                                            <FormControl mt={4}>
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    fontSize="md"
                                                                    mb={1}
                                                                >
                                                                    What is your
                                                                    use case for
                                                                    Videco?
                                                                </Text>
                                                                <Select
                                                                    placeholder="Select usecase"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setUsecase(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    border="1px solid #05405A"
                                                                >
                                                                    <option value="sales">
                                                                        Sales
                                                                    </option>
                                                                    <option value="marketing">
                                                                        Marketing
                                                                    </option>
                                                                    <option value="other">
                                                                        Recruitment
                                                                    </option>
                                                                    <option value="other">
                                                                        Other
                                                                    </option>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl mt={4}>
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    fontSize="md"
                                                                    mb={1}
                                                                >
                                                                    What is your
                                                                    job title?
                                                                </Text>
                                                                <Input
                                                                    border="1px solid #05405A"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setJobTitle(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Marketing Manager"
                                                                />
                                                            </FormControl>
                                                            <FormControl mt={3}>
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    fontSize="md"
                                                                    mb={1}
                                                                >
                                                                    What is your
                                                                    current
                                                                    Outreach/CRM
                                                                    solution?
                                                                </Text>
                                                                <Select
                                                                    border="1px solid #05405A"
                                                                    placeholder="Select CRM"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setCurrentCRM(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="hubspot">
                                                                        Hubspot
                                                                    </option>
                                                                    <option value="clay">
                                                                        Clay
                                                                    </option>
                                                                    <option value="apollo">
                                                                        Apollo
                                                                    </option>
                                                                    <option value="smartlead">
                                                                        Smartlead.ai
                                                                    </option>
                                                                    <option value="lemlist">
                                                                        Lemlist
                                                                    </option>
                                                                    <option value="mailchimp">
                                                                        Mailchimp
                                                                    </option>
                                                                    <option value="brevo">
                                                                        Brevo
                                                                    </option>
                                                                    <option value="other">
                                                                        Other
                                                                    </option>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl
                                                                mt={4}
                                                                isRequired
                                                            >
                                                                <Checkbox>
                                                                    I have read
                                                                    and accept
                                                                    the{" "}
                                                                    <a
                                                                        href="https://videco.io/privacy-policy/"
                                                                        target="_blank"
                                                                    >
                                                                        Privacy
                                                                        Policy
                                                                    </a>
                                                                </Checkbox>
                                                            </FormControl>
                                                            <Button
                                                                display="flex"
                                                                px={12}
                                                                py="26px"
                                                                width="full"
                                                                fontWeight="medium"
                                                                colorScheme="teal"
                                                                rightIcon={
                                                                    <FiArrowRight />
                                                                }
                                                                rounded="full"
                                                                bg="#05405A"
                                                                fontSize="20px"
                                                                margin="62px auto 0"
                                                                type="submit"
                                                            >
                                                                Continue
                                                            </Button>
                                                        </form>
                                                    </Box>
                                                )}
                                        </>
                                    )}
                                </Box>
                                <Box
                                    w={["100%", "100%", "40%"]}
                                    position="absolute"
                                    right={0}
                                    h="full"
                                    bg="url('/assets/bg-onboarding.png')"
                                    backgroundSize="90%"
                                    backgroundColor="#14213d"
                                    backgroundRepeat="no-repeat"
                                    backgroundPosition="center"
                                >
                                    <Box
                                        pos="absolute"
                                        bottom={4}
                                        left={4}
                                        fontSize="14px"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        <FiHelpCircle
                                            style={{
                                                marginRight: "4px",
                                            }}
                                        />{" "}
                                        Need help?{" "}
                                        <Link
                                            href="https://videco.io/demo/"
                                            target="_blank"
                                            textDecor="underline"
                                            ml={2}
                                        >
                                            Book a demo with us
                                        </Link>
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
