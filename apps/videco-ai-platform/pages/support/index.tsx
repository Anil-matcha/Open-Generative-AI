import React, { useEffect, useState } from "react";
import {
    Input,
    Box,
    Heading,
    Flex,
    Card,
    CardBody,
    Text,
    Highlight,
    Button,
    Container,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    InputGroup,
    InputLeftElement,
    Textarea,
    VStack,
    Wrap,
    WrapItem,
    Link,
    Spinner,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import {
    FiBluetooth,
    FiDisc,
    FiFacebook,
    FiGitCommit,
    FiMail,
    FiPhone,
    FiTwitter,
    FiVoicemail,
} from "react-icons/fi";
const Leads: React.FC = () => {
    const session = useSession();
    const router = useRouter();
    useEffect(() => {
        if (!session) return;
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

        (function () {
            const d = document;
            const s = d.createElement("script");
            s.src = "https://client.crisp.chat/l.js";
            s.async = true;
            d.getElementById("CHAT").appendChild(s);
        })();
    }, [session]);
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
                    <Box h="full" bg="white">
                        <Flex
                            direction="column"
                            bg="white"
                            mb={6}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Support" />
                        </Flex>
                        <Flex
                            justifyContent="space-between"
                            w="full"
                            bg="white"
                            direction="column"
                        >
                            <Heading
                                lineHeight="tall"
                                bg="white"
                                p={6}
                                width="90%"
                                rounded="md"
                            >
                                <Highlight
                                    query="Outstanding"
                                    styles={{
                                        px: "2",
                                        py: "1",
                                        rounded: "full",
                                        bg: "green.100",
                                    }}
                                >
                                    Outstanding support awaits.
                                </Highlight>
                            </Heading>
                            <Box id="CHAT" />
                        </Flex>
                        <Container
                            bg="white"
                            maxW="full"
                            mt={0}
                            overflow="hidden"
                        >
                            <Flex direction={["column", "column", "row"]}>
                                <Box
                                    bg="#02444b"
                                    color="white"
                                    borderRadius="lg"
                                    m={{ sm: 4, md: 16, lg: 10 }}
                                    p={{ sm: 5, md: 5, lg: 16 }}
                                >
                                    <Box p={4}>
                                        <Wrap
                                            spacing={{
                                                base: 20,
                                                sm: 3,
                                                md: 5,
                                                lg: 20,
                                            }}
                                            justifyContent="left"
                                            alignItems="flex-start"
                                        >
                                            <WrapItem
                                                textAlign="left"
                                                alignItems="left"
                                            >
                                                <Box>
                                                    <Heading>
                                                        Contact us via email or
                                                        chat with us
                                                    </Heading>
                                                    <Box
                                                        py={{
                                                            base: 5,
                                                            sm: 5,
                                                            md: 8,
                                                            lg: 10,
                                                        }}
                                                        textAlign="left"
                                                    >
                                                        <HStack
                                                            pl={0}
                                                            justifyContent="left"
                                                            alignItems="flex-start"
                                                        >
                                                            <Button
                                                                size="md"
                                                                height="48px"
                                                                width="200px"
                                                                p={0}
                                                                m="0"
                                                                variant="ghost"
                                                                color="#DCE2FF"
                                                                _hover={{
                                                                    border: "2px solid #1C6FEB",
                                                                }}
                                                                leftIcon={
                                                                    <FiMail
                                                                        color="white"
                                                                        size="20px"
                                                                    />
                                                                }
                                                            >
                                                                hello@videco.io
                                                            </Button>
                                                            <Button
                                                                size="md"
                                                                height="48px"
                                                                p={0}
                                                                m="0"
                                                                variant="ghost"
                                                                color="#DCE2FF"
                                                                _hover={{
                                                                    border: "2px solid #1C6FEB",
                                                                }}
                                                                leftIcon={
                                                                    <FiTwitter
                                                                        color="white"
                                                                        size="20px"
                                                                    />
                                                                }
                                                            >
                                                                @videco
                                                            </Button>
                                                        </HStack>
                                                        <HStack
                                                            w="full"
                                                            textAlign="center"
                                                        >
                                                            <Box w="full">
                                                                <Button
                                                                    mt="5"
                                                                    p={6}
                                                                    variant="outline"
                                                                    color="white"
                                                                    _hover={{
                                                                        color: "black",
                                                                        bg: "white",
                                                                    }}
                                                                    onClick={() => {
                                                                        window.$crisp.push(
                                                                            [
                                                                                "do",
                                                                                "chat:toggle",
                                                                            ],
                                                                        );
                                                                    }}
                                                                >
                                                                    {" "}
                                                                    Start Live
                                                                    Chat
                                                                </Button>
                                                            </Box>
                                                        </HStack>
                                                    </Box>
                                                </Box>
                                            </WrapItem>
                                        </Wrap>
                                    </Box>
                                </Box>
                                <Box
                                    bg="#080945"
                                    color="white"
                                    borderRadius="lg"
                                    m={{ sm: 4, md: 16, lg: 10 }}
                                    p={{ sm: 5, md: 5, lg: 16 }}
                                >
                                    <Box p={4}>
                                        <Wrap
                                            spacing={{
                                                base: 20,
                                                sm: 3,
                                                md: 5,
                                                lg: 20,
                                            }}
                                            justifyContent="left"
                                            alignItems="flex-start"
                                        >
                                            <WrapItem
                                                textAlign="left"
                                                alignItems="left"
                                            >
                                                <Box>
                                                    <Heading>
                                                        Checkout the support
                                                        articles
                                                    </Heading>
                                                    <Box
                                                        py={{
                                                            base: 5,
                                                            sm: 5,
                                                            md: 8,
                                                            lg: 10,
                                                        }}
                                                        textAlign="left"
                                                    >
                                                        <HStack
                                                            w="full"
                                                            textAlign="center"
                                                        >
                                                            <Box w="full">
                                                                <Button
                                                                    mt="5"
                                                                    p={6}
                                                                    variant="outline"
                                                                    color="white"
                                                                    _hover={{
                                                                        color: "black",
                                                                        bg: "white",
                                                                    }}
                                                                    onClick={() => {
                                                                        router.push(
                                                                            "https://videco.usetiful.help/",
                                                                        );
                                                                    }}
                                                                >
                                                                    {" "}
                                                                    To the
                                                                    articles
                                                                </Button>
                                                                <Button
                                                                    mt="5"
                                                                    ml="5"
                                                                    p={6}
                                                                    variant="outline"
                                                                    color="white"
                                                                    _hover={{
                                                                        color: "black",
                                                                        bg: "white",
                                                                    }}
                                                                    onClick={() => {
                                                                        router.push(
                                                                            "https://videco.io/roadmap/",
                                                                        );
                                                                    }}
                                                                >
                                                                    {" "}
                                                                    To the
                                                                    roadmap
                                                                </Button>
                                                            </Box>
                                                        </HStack>
                                                    </Box>
                                                </Box>
                                            </WrapItem>
                                        </Wrap>
                                    </Box>
                                </Box>
                            </Flex>
                        </Container>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default Leads;
