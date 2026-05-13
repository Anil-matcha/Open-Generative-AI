import {
    Flex,
    Box,
    Text,
    Image,
    Button,
    Divider,
    Card,
    CardBody,
    Heading,
    Stack,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import { FiPlayCircle } from "react-icons/fi";
import { useUserPlan } from "src/hooks/useUserPlan";

export const OnBoardingVideoFrame: FC<{
    video: string;
    name: string;
    helpOff?: boolean;
}> = ({ video, name, helpOff }) => {
    const session = useSession();
    const user = session?.user;
    const [plan, setPlan] = useState<any>();
    const { getPlan } = useUserPlan();
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]);
        };
        plan();
    }, [session, user]);

    return (
        <Box ml={6} pos="relative" p={5} rounded="lg" maxW="852" m="10px auto">
            <Modal isOpen={isOpen} onClose={onClose} size="5xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalBody>
                        <div
                            style={{
                                position: "relative",
                                boxSizing: "content-box",
                                maxHeight: "80vh",
                                width: "100%",
                                aspectRatio: "2.644628099173554",
                                padding: "40px 0",
                            }}
                        >
                            <iframe
                                src="https://app.supademo.com/embed/cm42w21bb13uwjfcxfmhug1je?embed_v=2"
                                loading="lazy"
                                title="Videco Demo"
                                allow="clipboard-write"
                                frameBorder="0"
                                style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "0",
                                    width: "100%",
                                    height: "100%",
                                }}
                            ></iframe>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Flex
                justifyContent="space-between"
                flexDir={"column"}
                textAlign="center"
            >
                <Text fontWeight="bold" fontSize="3xl" color="#05405A">
                    Hey {name}!
                </Text>
                <Text color="#9C9F9F">
                    This video is an example of how campaigns work!
                </Text>

                <Box maxW="652" margin="15px auto">
                    <video
                        src={video}
                        controls
                        style={{
                            borderRadius: "20px",
                            border: "1px solid #DADADA",
                        }}
                        poster="assets/avatar.png"
                        width="100%"
                    />
                </Box>
                <Box
                    mt={5}
                    display="flex"
                    flexDir="column"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Button
                        variant="videco"
                        px={20}
                        py={6}
                        onClick={() =>
                            plan?.status === "active"
                                ? router.push("/videos/start")
                                : router.push("/pricing")
                        }
                    >
                        {plan?.status === "active"
                            ? "Create"
                            : "Start free trial"}
                    </Button>
                    <Button
                        variant="ghost"
                        px={4}
                        onClick={onOpen}
                        py={3}
                        rightIcon={<FiPlayCircle />}
                        color="#383F40"
                        _hover={{
                            bg: "transparent",
                        }}
                    >
                        Try Interactive Demo
                    </Button>
                </Box>
                {!helpOff && (
                    <>
                        <Divider mt={8} />
                        <Text
                            fontWeight="bold"
                            fontSize="3xl"
                            color="#05405A"
                            mt={12}
                        >
                            Learn more about video selling
                        </Text>
                        <Box mt={5} p={0} display="flex">
                            <Card
                                w="full"
                                shadow="none"
                                p={0}
                                cursor="pointer"
                                onClick={() =>
                                    window?.open(
                                        "https://www.youtube.com/watch?v=2xXPGa1fSfs",
                                    )
                                }
                            >
                                <CardBody p={0}>
                                    <Image
                                        src="/assets/firstCampaign.png"
                                        height="160px"
                                        alt="Create your first campaign"
                                        borderRadius="lg"
                                    />
                                    <Stack
                                        mt="2"
                                        ml={2}
                                        justifyContent="flex-start"
                                        alignItems="flex-start"
                                    >
                                        <Heading
                                            size="xs"
                                            color="#383F40"
                                            textAlign="left"
                                            mt={0}
                                        >
                                            Create your first campaign
                                        </Heading>
                                    </Stack>
                                </CardBody>
                            </Card>
                            <Card
                                w="full"
                                shadow="none"
                                p={0}
                                cursor="pointer"
                                onClick={() =>
                                    window?.open(
                                        "https://www.youtube.com/watch?v=7Zq0PND5QBk&t=117s",
                                    )
                                }
                            >
                                <CardBody p={0}>
                                    <Image
                                        src="/assets/turn.png"
                                        height="160px"
                                        alt="Create your first campaign"
                                        borderRadius="lg"
                                    />
                                    <Stack
                                        mt="2"
                                        ml={2}
                                        justifyContent="flex-start"
                                        alignItems="flex-start"
                                    >
                                        <Heading
                                            size="xs"
                                            color="#383F40"
                                            textAlign="left"
                                            mt={0}
                                        >
                                            Turn leads into clients with AI
                                        </Heading>
                                    </Stack>
                                </CardBody>
                            </Card>

                            <Card
                                w="full"
                                shadow="none"
                                p={0}
                                ml={3}
                                cursor="pointer"
                                onClick={() =>
                                    window?.open(
                                        "https://www.youtube.com/watch?v=HZsyAF2ZfYs&t=2s",
                                    )
                                }
                            >
                                <CardBody p={0}>
                                    <Image
                                        src="assets/avatar.png"
                                        height="160px"
                                        alt="Create your first campaign"
                                        borderRadius="lg"
                                    />
                                    <Stack
                                        mt="2"
                                        ml={2}
                                        justifyContent="flex-start"
                                        alignItems="flex-start"
                                    >
                                        <Heading
                                            size="xs"
                                            color="#383F40"
                                            textAlign="left"
                                            mt={0}
                                        >
                                            How to create AI videos with Videco
                                        </Heading>
                                    </Stack>
                                </CardBody>
                            </Card>
                        </Box>
                    </>
                )}
            </Flex>
        </Box>
    );
};
