import React, { useEffect, useState } from "react";
import {
    Input,
    Box,
    Heading,
    Flex,
    Button,
    Card,
    CardBody,
    Text,
    CardHeader,
    Link,
    Stack,
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Spinner,
    useToast,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    InputGroup,
    InputRightElement,
    Divider,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { useUserPlan } from "src/hooks/useUserPlan";
import { sendEmail } from "src/services/api/sendEmail";
import axios from "axios";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { InviteList } from "@components/features/invite/list";

function generateSecureKey() {
    const array = new Uint32Array(6);
    window.crypto.getRandomValues(array);
    return array.join("");
}
const Settings: React.FC = () => {
    const session = useSession();
    const [plan, setPlan] = React.useState<any>();
    const [stipeId, setStipeId] = React.useState<any>();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef();
    const user = session?.user;
    const router = useRouter();
    const toast = useToast();
    const [teamMembers, setTeamMembers] = useState<any>();
    const [deleted, setDeleted] = useState<any>(false);
    const { getTeamUserIds, getData } = useFetchTeamData();
    const { getPlan } = useUserPlan();
    const supabase = createClientComponentClient();
    const [videos, setVideos] = React.useState<any>(0);
    const [videoSize, setVideoSize] = React.useState<any>(0);
    const [show, setShow] = React.useState(false);
    const [key, setKey] = React.useState("");
    const handleAPIKeyClick = async () => {
        if (plan !== "lite") {
            try {
                await supabase
                    .from("apikey")
                    .select()
                    .eq("user_id", user?.id)
                    .then((res) => {
                        if (res.data.length > 0) {
                            setKey(res.data[0].key);
                            setShow(!show);
                        } else {
                            supabase
                                .from("apikey")
                                .upsert([
                                    {
                                        user_id: user?.id,
                                        key: `api_${generateSecureKey()}_videco.io`,
                                    },
                                ])
                                .eq("user_id", user?.id)
                                .select()
                                .then((res) => {
                                    setKey(res.data[0].key);
                                    setShow(!show);
                                });
                        }
                    });
            } catch (error) {
                console.log("error..", error);
            }
        } else {
            alert("You need to be a growth member to generate API key");
        }
    };
    const getFullTeamMembers = async () => {
        const team = await getTeamUserIds();
        if (team) {
            setTeamMembers(team ?? []);
        }
    };
    const calculateTotalSize = (data) => {
        let totalSize = 0;
        data.forEach((item: { size: number }) => {
            totalSize += item.size;
        });
        return totalSize;
    };

    const deleteUser = async () => {
        try {
            await sendEmail("/api/mail/delete", {
                email: user?.email,
                user_id: user?.id,
            });
            setDeleted(true);
            toast({
                title: "Account deletion requested",
                description:
                    "We've delete your account in 24 hours. This action is irreversible. If you made a mistake please contact us asap.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
            router.push("/auth/logout");
        } catch (error) {
            setDeleted(false);
        }
    };

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
            setStipeId(fetchPlan?.[0]?.stipe_id);
            const data = await getData("videos", {
                col: "status",
                val: "deleted",
            });
            data && setVideoSize(calculateTotalSize(data));
            setVideos(data?.length);
        };
        plan();
        getFullTeamMembers();
    }, [session, user]);

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
                <Sidebar>
                    <AlertDialog
                        motionPreset="slideInBottom"
                        leastDestructiveRef={cancelRef}
                        onClose={onClose}
                        isOpen={isOpen}
                        isCentered
                    >
                        <AlertDialogOverlay />

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                Delete account?
                            </AlertDialogHeader>
                            <AlertDialogCloseButton />
                            <AlertDialogBody>
                                Are you sure you want to delete your account?
                                All of your videos will be deleted.
                            </AlertDialogBody>
                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onClose}>
                                    No
                                </Button>
                                <Button
                                    colorScheme="red"
                                    ml={3}
                                    onClick={() => deleteUser()}
                                >
                                    Yes
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {router.query.success && (
                        <Alert
                            status="success"
                            position="fixed"
                            zIndex={1000}
                            left={0}
                            top={0}
                            height="full"
                            variant="subtle"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            textAlign="center"
                        >
                            <AlertIcon boxSize="40px" mr={0} />
                            <AlertTitle mt={4} mb={1} fontSize="lg">
                                You are now a premium member
                            </AlertTitle>
                            <AlertDescription maxWidth="sm">
                                Thanks for becaoming a premium member. You can
                                now create interactive videos with many more
                                features.
                            </AlertDescription>
                            <Button
                                variant="solid"
                                bg="green.400"
                                color="white"
                                mt={6}
                                onClick={() => router.push("/videos")}
                            >
                                {" "}
                                Back to Videos
                            </Button>
                        </Alert>
                    )}
                    <Box h="full" bg="#F8F8F8">
                        <Flex
                            direction="column"
                            bg="white"
                            mb={6}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Settings" />
                        </Flex>

                        <Flex justifyContent="space-between" w="85%" ml={20}>
                            <Flex ml={5} w="full" direction="column">
                                <Card
                                    w="98%"
                                    mr={12}
                                    shadow="md"
                                    mb={4}
                                    textAlign="left"
                                    alignItems="left"
                                >
                                    <CardHeader>
                                        <Heading
                                            size="sm"
                                            fontWeight="semibold"
                                        >
                                            Account Settings
                                        </Heading>
                                        <Text mt={1} fontSize="sm" as="span">
                                            Your account managment
                                        </Text>
                                        <Divider mt={2} />
                                    </CardHeader>
                                    <CardBody pt="0">
                                        <Stack
                                            spacing="1"
                                            direction="row"
                                            justifyContent="space-between"
                                            maxW="40%"
                                        >
                                            <Box>
                                                <Heading
                                                    size="xs"
                                                    fontWeight="semibold"
                                                >
                                                    Name
                                                </Heading>
                                                <Text pt="2" fontSize="sm">
                                                    {user?.user_metadata
                                                        ?.name ??
                                                        "Not provided"}
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Heading
                                                    size="xs"
                                                    fontWeight="semibold"
                                                >
                                                    Email
                                                </Heading>
                                                <Text pt="2" fontSize="sm">
                                                    {user?.email}
                                                </Text>
                                            </Box>
                                        </Stack>
                                        <Stack
                                            textAlign="left"
                                            mt={10}
                                            spacing={0}
                                        >
                                            <Heading
                                                size="sm"
                                                fontWeight="semibold"
                                            >
                                                Other settings
                                            </Heading>
                                            <Text fontSize="sm" as="span">
                                                Other settings related to your
                                                account
                                            </Text>
                                            <Divider mt={2} />
                                            <Box mt={5}>
                                                <Link
                                                    href="/brand-kit"
                                                    color="#383F40"
                                                    mt="4"
                                                    _hover={{
                                                        textDecor: "none",
                                                        bg: "#DADADA",
                                                    }}
                                                    mr={4}
                                                    px={4}
                                                    py={2}
                                                    rounded="md"
                                                    border=".5px solid #383F40"
                                                    shadow="sm"
                                                    textAlign="left"
                                                >
                                                    Brand Kit{" "}
                                                    <ExternalLinkIcon
                                                        fontSize="sm"
                                                        ml={1}
                                                        mb={1}
                                                        fontWeight="normal"
                                                    />
                                                </Link>
                                                <Link
                                                    onClick={() =>
                                                        axios
                                                            .post(
                                                                "/api/stripe/portal",
                                                                {
                                                                    stipe_customer:
                                                                        stipeId,
                                                                },
                                                            )
                                                            .then((res) =>
                                                                router.push(
                                                                    res.data
                                                                        .url,
                                                                ),
                                                            )
                                                    }
                                                    color="#383F40"
                                                    mt="4"
                                                    _hover={{
                                                        textDecor: "none",
                                                        bg: "#DADADA",
                                                    }}
                                                    mr={4}
                                                    px={4}
                                                    py={2}
                                                    rounded="md"
                                                    border=".5px solid #383F40"
                                                    shadow="sm"
                                                    textAlign="left"
                                                >
                                                    Billing{" "}
                                                    <ExternalLinkIcon
                                                        fontSize="sm"
                                                        ml={1}
                                                        mb={1}
                                                        fontWeight="normal"
                                                    />
                                                </Link>
                                            </Box>
                                            <Heading
                                                size="sm"
                                                mt={10}
                                                color="#F06B6B"
                                                fontWeight="semibold"
                                            >
                                                Danger Zone
                                            </Heading>
                                            <Text
                                                color="#F06B6B"
                                                mt={1}
                                                fontSize="sm"
                                                as="span"
                                            >
                                                Your account managment
                                            </Text>
                                            <Divider mt={2} />
                                            <Box mt="6">
                                                <Link
                                                    onClick={() =>
                                                        router.push(
                                                            "/auth/login?reset=true",
                                                        )
                                                    }
                                                    color="#383F40"
                                                    mt="4"
                                                    _hover={{
                                                        textDecor: "none",
                                                        bg: "#F06B6B",
                                                        color: "white",
                                                        borderCOlor: "#F06B6B",
                                                    }}
                                                    mr={4}
                                                    px={4}
                                                    py={2}
                                                    rounded="md"
                                                    border=".5px solid #383F40"
                                                    shadow="sm"
                                                    textAlign="left"
                                                >
                                                    Reset password{" "}
                                                    <ExternalLinkIcon
                                                        fontSize="sm"
                                                        ml={1}
                                                        mb={1}
                                                        fontWeight="normal"
                                                    />
                                                </Link>

                                                <Link
                                                    onClick={onOpen}
                                                    color="#383F40"
                                                    mt="4"
                                                    _hover={{
                                                        textDecor: "none",
                                                        bg: "#F06B6B",
                                                        color: "white",
                                                        borderCOlor: "#F06B6B",
                                                    }}
                                                    mr={4}
                                                    px={4}
                                                    py={2}
                                                    rounded="md"
                                                    border=".5px solid #383F40"
                                                    shadow="sm"
                                                    textAlign="left"
                                                >
                                                    {" "}
                                                    Delete account{" "}
                                                    <ExternalLinkIcon
                                                        fontSize="sm"
                                                        ml={1}
                                                        mb={1}
                                                        fontWeight="normal"
                                                    />
                                                </Link>
                                            </Box>
                                        </Stack>
                                    </CardBody>
                                </Card>
                                <Card
                                    mr={6}
                                    shadow="md"
                                    bg="white"
                                    w="98%"
                                    mb={4}
                                    textAlign="left"
                                    alignItems="left"
                                >
                                    <CardBody>
                                        <Heading
                                            size="sm"
                                            fontWeight="semibold"
                                        >
                                            API Key
                                        </Heading>
                                        <Text mt={1} fontSize="sm" as="span">
                                            Manage your API keys here
                                        </Text>
                                        <Divider mt={2} />
                                        <InputGroup size="md" mt={5}>
                                            <Input
                                                pr="4.5rem"
                                                type={
                                                    show ? "text" : "password"
                                                }
                                                placeholder="your API key"
                                                value={key}
                                            />
                                            <InputRightElement width="auto">
                                                <Button
                                                    h="1.75rem"
                                                    mr={2}
                                                    px={2}
                                                    size="xs"
                                                    onClick={handleAPIKeyClick}
                                                >
                                                    {show
                                                        ? "Hide"
                                                        : "Get your key"}
                                                </Button>
                                            </InputRightElement>
                                        </InputGroup>
                                    </CardBody>
                                </Card>
                                <Card
                                    mr={6}
                                    shadow="md"
                                    bg="white"
                                    w="98%"
                                    mb={4}
                                    textAlign="left"
                                    alignItems="left"
                                >
                                    <CardBody>
                                        <InviteList />
                                    </CardBody>
                                </Card>
                            </Flex>
                        </Flex>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default Settings;
