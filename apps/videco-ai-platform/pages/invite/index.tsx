import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Heading,
    Flex,
    Card,
    Text,
    Button,
    Spinner,
    Avatar,
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Divider,
    Tag,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    TableContainer,
    Tbody,
    Td,
    Tr,
    Alert,
    Link,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import {
    FiBarChart,
    FiBarChart2,
    FiDatabase,
    FiEdit,
    FiUpload,
    FiUserPlus,
} from "react-icons/fi";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Invite } from "@components/features/invite";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { TopAnalytics } from "@components/features/analytics/top";
import { LatestAnalytics } from "@components/features/analytics/latest";
import Pricing from "@components/common/pricing";

const InviteUsers: React.FC = () => {
    const supabase = createClientComponentClient();
    const [isSSR, setIsSSR] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [videoData, setVideoData] = useState<any>();
    const [memberEmail, setMemberEmail] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<any>();
    const [canInvite, setCanInvite] = useState<any>(false);
    const [showPricing, setShowPricing] = useState<any>(false);
    const [plan, setPlan] = React.useState<any>();
    const [inviteApproved, setInviteApproved] = useState<any>(true);
    const { getPlan } = useUserPlan();
    const [loading, setLoading] = useState(true);
    const [inviteUpdated, setInviteUpdated] = useState(false);
    const session = useSession();
    const user = session?.user;
    const router = useRouter();
    const { getTeamUserIds, getData } = useFetchTeamData();
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
    }, [user, supabase]);

    const getFullTeamMembers = async () => {
        const team = await getTeamUserIds();
        if (team) {
            team.filter((member) => {
                if (
                    member?.role === "owner" &&
                    member?.shared_account === user?.email
                ) {
                    setCanInvite(true);
                }
                if (
                    member?.role !== "owner" &&
                    member?.shared_account === user?.email &&
                    !member?.shared_account_user
                ) {
                    setInviteApproved(false);
                }
            });
            setTeamMembers(team ?? []);
        }
    };

    const { isOpen, onOpen, onClose } = useDisclosure();
    useEffect(() => {
        getProfile();
        getFullTeamMembers();
        setInviteUpdated(false);
        setMemberEmail(null);
    }, [user, getProfile, inviteUpdated]);

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, []);
    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (router.query.code) {
            setIsConfirming(true);
        }
    }, [router.query]);

    const inviteUserButtonRef = React.useRef();

    const approveInvite = async () => {
        try {
            const { error } = await supabase
                .from("sub_accounts")
                .update({ shared_account_user: user?.id, status: "approved" })
                .eq("shared_account", user.email);
            if (error) throw error;
            setInviteApproved(true);
        } catch (error) {
            console.log("error", error);
        }
    };

    const rejectInvite = async () => {
        try {
            const { error } = await supabase
                .from("sub_accounts")
                .update({ shared_account_user: user?.id, status: "rejected" })
                .eq("shared_account", user.email);
            if (error) throw error;
            setInviteApproved(true);
        } catch (error) {
            console.log("error", error);
        }
    };
    useEffect(() => {
        setIsSSR(false);
    }, []);

    return (
        <>
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="fixed"
                    height="full"
                    width="full"
                >
                    {isConfirming ? (
                        <Box>
                            Thank you for confirming your email,{" "}
                            <Link
                                textDecor="underline"
                                href="/auth/login?mode=login"
                            >
                                Click here
                            </Link>{" "}
                            to login
                        </Box>
                    ) : (
                        <Spinner size="xl" />
                    )}
                </Box>
            ) : (
                <Sidebar>
                    {showPricing && (
                        <Pricing hidePiricng={() => setShowPricing(false)} />
                    )}
                    {!inviteApproved && (
                        <Modal onClose={() => null} isOpen={true}>
                            <ModalOverlay bg="#000001c2" />
                            <ModalContent>
                                <ModalHeader>
                                    You are invited to join
                                </ModalHeader>
                                <ModalBody>
                                    You are invited to join another Videco
                                    project. Please approve or reject the
                                    invitation.
                                </ModalBody>

                                <ModalFooter>
                                    <Button
                                        colorScheme="green"
                                        mr={3}
                                        onClick={approveInvite}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        colorScheme="red"
                                        onClick={rejectInvite}
                                        variant="ghost"
                                    >
                                        Reject
                                    </Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                    )}
                    <Drawer
                        isOpen={isOpen}
                        placement="right"
                        onClose={onClose}
                        size="md"
                        finalFocusRef={inviteUserButtonRef}
                    >
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader mb={3}>
                                Invite a user to your project
                                <Text fontSize="sm" fontWeight="normal">
                                    Add an email address and select a role for
                                    the user. Make sure to double check the
                                    email address
                                </Text>
                            </DrawerHeader>

                            <DrawerBody>
                                <Invite
                                    setInviteUpdated={setInviteUpdated}
                                    memberEmail={memberEmail}
                                    onClose={onClose}
                                />
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                    <Box h="full" bg="white" w="full">
                        <Flex
                            direction="column"
                            bg="white"
                            mb={10}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Invite users" />
                        </Flex>

                        <Flex
                            bg="white"
                            justifyContent="space-between"
                            w="full"
                            direction={["column", "column", "row"]}
                            pb={22}
                        >
                            <Flex
                                w="50%"
                                ml="6"
                                mr="4"
                                mb="6"
                                alignItems="flex-start"
                                justifyContent="left"
                                direction="column"
                            >
                                <Flex
                                    direction={["column", "column", "column"]}
                                    w="full"
                                >
                                    <Box height="sm" ml={6} w="full">
                                        <Box
                                            mr={0}
                                            shadow="lg"
                                            border="1px solid #dcdcdc"
                                            p={7}
                                            mb={5}
                                            rounded="md"
                                            boxShadow="sm"
                                            height="max-content"
                                        >
                                            <Text as="h3" fontSize="md" mb={0}>
                                                <Flex>
                                                    <Heading
                                                        display="flex"
                                                        justifyContent="space-between"
                                                        lineHeight="tall"
                                                        bg="whiblte"
                                                        p={0}
                                                        fontSize="xl"
                                                        fontWeight="semibold"
                                                        width="100%"
                                                        rounded="md"
                                                    >
                                                        Your team
                                                    </Heading>
                                                    <Box
                                                        bg="black"
                                                        display="flex"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        px={4}
                                                        rounded="md"
                                                    >
                                                        <FiUserPlus
                                                            onClick={() =>
                                                                onOpen()
                                                            }
                                                            size="20px"
                                                            color="white"
                                                            cursor="pointer"
                                                        />
                                                    </Box>
                                                </Flex>
                                                <Text
                                                    as="p"
                                                    display="block"
                                                    fontSize="sm"
                                                    mb={8}
                                                >
                                                    Need more seats?{" "}
                                                    <a
                                                        href="/pricing"
                                                        style={{
                                                            color: "#055256",
                                                            textDecoration:
                                                                "underline",
                                                        }}
                                                    >
                                                        Upgrade
                                                    </a>
                                                </Text>
                                            </Text>
                                            <Card
                                                border="0"
                                                w="full"
                                                shadow="none"
                                                mr={2}
                                                maxH="240px"
                                                overflowY="auto"
                                                textAlign="left"
                                                display="flex"
                                                flexDirection="column"
                                                alignItems="left"
                                            >
                                                {teamMembers ? (
                                                    teamMembers.map(
                                                        (member) => (
                                                            <Flex
                                                                mt={5}
                                                                key={member?.id}
                                                                alignItems="center"
                                                                justifyContent="space-between"
                                                            >
                                                                <Box display="flex">
                                                                    <Avatar
                                                                        name={
                                                                            member?.name
                                                                        }
                                                                    />

                                                                    <Box pl={2}>
                                                                        <Text fontWeight="bold">
                                                                            {
                                                                                member?.name
                                                                            }
                                                                        </Text>
                                                                        <Text
                                                                            fontWeight="normal"
                                                                            fontSize="12px"
                                                                        >
                                                                            {
                                                                                member?.shared_account
                                                                            }
                                                                        </Text>
                                                                        <Tag
                                                                            mt={
                                                                                1
                                                                            }
                                                                            colorScheme={
                                                                                member?.role ===
                                                                                "owner"
                                                                                    ? "teal"
                                                                                    : "blue"
                                                                            }
                                                                        >
                                                                            {
                                                                                member?.role
                                                                            }
                                                                        </Tag>
                                                                    </Box>
                                                                </Box>
                                                                {canInvite &&
                                                                    member?.role !==
                                                                        "owner" && (
                                                                        <Box cursor="pointer">
                                                                            <FiEdit
                                                                                onClick={() => {
                                                                                    setMemberEmail(
                                                                                        member?.shared_account,
                                                                                    );
                                                                                    onOpen();
                                                                                }}
                                                                                size="15px"
                                                                                color="gray"
                                                                            />
                                                                        </Box>
                                                                    )}
                                                            </Flex>
                                                        ),
                                                    )
                                                ) : (
                                                    <Box>
                                                        <Alert
                                                            rounded="md"
                                                            bg="#e2ffe6"
                                                        >
                                                            You don't have any
                                                            team members yet
                                                        </Alert>
                                                    </Box>
                                                )}
                                            </Card>
                                        </Box>
                                    </Box>
                                </Flex>
                            </Flex>

                            <Flex
                                w="50%"
                                bg="white"
                                ml={10}
                                mr={4}
                                flexDirection="column"
                                sx={{
                                    "@media screen and (max-width: 768px)": {
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    },
                                }}
                            >
                                <Box
                                    shadow="sm"
                                    rounded="md"
                                    border="1px solid #dcdcdc"
                                    w="full"
                                    mr={4}
                                    pt={6}
                                >
                                    <Text
                                        as="h2"
                                        fontSize="lg"
                                        fontWeight="semibold"
                                        mb={5}
                                        ml={5}
                                    >
                                        Invite a new user
                                    </Text>
                                    <Divider mb={1} />
                                    <Box p={4}>
                                        <Invite
                                            setInviteUpdated={setInviteUpdated}
                                            memberEmail={memberEmail}
                                            onClose={onClose}
                                        />
                                    </Box>
                                </Box>
                            </Flex>
                        </Flex>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default InviteUsers;
