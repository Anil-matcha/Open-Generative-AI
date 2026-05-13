import React, { FC, useCallback, useEffect, useState } from "react";
import {
    Flex,
    Box,
    Text,
    Heading,
    Button,
    Link,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Image,
    useDisclosure,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useUserStore } from "src/store/user";
import { useUserPlan } from "src/hooks/useUserPlan";
import { FaCheckCircle } from "react-icons/fa";
import {
    FiAlertCircle,
    FiArrowRight,
    FiHelpCircle,
    FiPlus,
    FiX,
} from "react-icons/fi";
import { daysLeftInTrial, isTrialExpired } from "src/utils/isTrialExpierd";
import { Onboarding } from "../onboarding/welcome";
import { internalAPIRequest } from "src/services/api/stripe-event";
import New from "../create/new";
import { useRouter } from "next/router";
import Pricing from "../pricing";

type HeaderProps = {
    pageTitle: string;
};
export const Header: FC<HeaderProps> = (props) => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [fullname, setFullname] = useState(null);
    const create = useDisclosure();
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hideConfetti, setHideConfetti] = useState(false);
    const { setUser } = useUserStore();
    const session = useSession();
    const user = session?.user;
    const [plan, setPlan] = React.useState<any>();
    const { getPlan } = useUserPlan();
    const [trail, setTrail] = React.useState<any>();

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

    const handleClick = (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        // ProductLift should handle the link click automatically based on the data-productlift-widget attribute
    };
    const getProfile = useCallback(async () => {
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
            if (data.full_name && data.onboard_completed) {
                setFullname(data.full_name);
                setUser({
                    fullName: data.full_name,
                });
                setShowOnboarding(false);
                //Rest usage limits. TODO: move to a cronjob in the future
                await internalAPIRequest("/api/credits/deduct", {
                    user_id: user.id,
                });
            } else {
                setShowOnboarding(true);
            }
        } catch (error) {
            console.log(error);
            setShowOnboarding(false);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, showOnboarding, setUser]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile, showOnboarding]);

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
            setTrail(fetchPlan?.[0]);
        };
        plan();
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
            {plan &&
                !isTrialExpired(trail?.free_trial_start_date, trail?.status) &&
                !trail?.free_trial_ended && <Pricing />}
            {trail?.status === "free_trial_ended" && (
                <>
                    {" "}
                    <Modal
                        isOpen={plan ? true : false}
                        onClose={() => null}
                        size="xl"
                    >
                        <ModalOverlay bg="#000000cd" />
                        <ModalContent>
                            <ModalBody m={0} p="5" bg="#ffffff" rounded="md">
                                <Image
                                    src="assets/logonew.png"
                                    w="20"
                                    m="0 auto"
                                />
                                <Text
                                    as="h2"
                                    fontSize="3xl"
                                    textAlign="center"
                                    bg="white"
                                    p="0"
                                    m="0"
                                    borderTopRadius="md"
                                    fontWeight="semibold"
                                >
                                    Your Free Trial Ended
                                </Text>
                                <Text
                                    as="h2"
                                    p="0"
                                    m="0"
                                    fontSize="md"
                                    textAlign="center"
                                    bg="white"
                                    borderTopRadius="md"
                                >
                                    Upgrade to Continue
                                </Text>
                                <Box p={5}>
                                    <Flex>
                                        <Box
                                            width="full"
                                            pl={0}
                                            rounded="lg"
                                            ml={0}
                                        >
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={4} fontSize="20px">
                                                    Up to 50 videos
                                                </Text>
                                            </Box>
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                                mt={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={4} fontSize="20px">
                                                    1000 Dynamic videos
                                                </Text>
                                            </Box>
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                                mt={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={2} fontSize="20px">
                                                    Dynamic variables
                                                </Text>
                                            </Box>
                                        </Box>
                                        <Box width="full" pl={5} rounded="lg">
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={4} fontSize="20px">
                                                    +60 CRM Integrations
                                                </Text>
                                            </Box>
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                                mt={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={4} fontSize="20px">
                                                    +5 Users Invite
                                                </Text>
                                            </Box>
                                            <Box
                                                display="flex"
                                                justifyContent="left"
                                                pl={3}
                                                alignItems="center"
                                                bg="white"
                                                rounded="lg"
                                                py={2}
                                                mt={2}
                                            >
                                                <FaCheckCircle
                                                    color="#05405A"
                                                    fontSize="20px"
                                                />
                                                <Text pl={2} fontSize="20px">
                                                    Video analytics
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Flex>
                                    <Button
                                        bg="#05405A"
                                        color="white"
                                        colorScheme="blue"
                                        mt={8}
                                        w="full"
                                        onClick={() =>
                                            (window.location.href = "/pricing")
                                        }
                                        rightIcon={<FiArrowRight />}
                                    >
                                        See all plans
                                    </Button>
                                    <Text
                                        textAlign="center"
                                        mt={2}
                                        fontSize="md"
                                    >
                                        Got questions?{" "}
                                        <a
                                            href="https://videco.io/demo/"
                                            style={{
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Book a demo!
                                        </a>{" "}
                                        or{" "}
                                        <a
                                            href="/auth/logout"
                                            style={{
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Logout
                                        </a>
                                    </Text>
                                </Box>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </>
            )}
            <Flex
                ml={7}
                my={2}
                alignItems="center"
                rounded="md"
                flexDirection="row"
                justifyContent="space-between"
            >
                <Heading as="h2" fontSize="xl" ml={6} color="#383F40">
                    {props?.pageTitle ?? "Dashboard"}
                </Heading>
                <Onboarding />
                <Flex bg="white" px={4} py={3} rounded="lg">
                    {create.isOpen && (
                        <>
                            {" "}
                            <Box
                                pos="fixed"
                                w="full"
                                h="full"
                                bg="#000000c4"
                                zIndex={1}
                                top="0"
                                // backgroundImage="url('/upload-bg.png')"
                                backgroundSize="cover"
                                filter={"blur(4px)"}
                                left="0"
                            />
                            <Box
                                pos="absolute"
                                left="50%"
                                top="50%"
                                w="full"
                                zIndex={999}
                                transform="translate(-50%, -50%)"
                            >
                                <New />
                            </Box>
                            <Box
                                pos="absolute"
                                right={2}
                                top={2}
                                color="black"
                                bg="white"
                                zIndex={999}
                                rounded="md"
                                p={2}
                                onClick={() => create.onClose()}
                                cursor="pointer"
                            >
                                <FiX />
                            </Box>
                        </>
                    )}
                    <Link
                        href="#"
                        display="flex"
                        justifyContent="center"
                        fontSize="16px"
                        textDecor="none"
                        _hover={{
                            textDecor: "none",
                        }}
                        rounded="full"
                        alignItems="center"
                        fontWeight="normal"
                        data-productlift-sidebar={process.env.NEXT_PUBLIC_PRODUCTLIFT_SIDEBAR_ID}
                        onClick={handleClick}
                    >
                        <FiHelpCircle
                            style={{
                                marginRight: "4px",
                                fontWeight: "normal",
                                fontSize: "16px",
                            }}
                            color="#383F40"
                        />
                        Help
                    </Link>
                    <Button
                        bg={"#05405A"}
                        border="1px solid #05405A"
                        color={"white"}
                        size="sm"
                        w="full"
                        mx={4}
                        h={"40px"}
                        _hover={{
                            bg: "#166183",
                        }}
                        onClick={() => {
                            trail?.status === "active"
                                ? create.onOpen()
                                : router.push("/pricing");
                        }}
                    >
                        <FiPlus />

                        <Text ml={2} fontSize={16} fontWeight={400}>
                            Create new
                        </Text>
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};
