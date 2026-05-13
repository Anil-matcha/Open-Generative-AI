"use client";

import { Box, Button, Flex, Text, Image } from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";
import { FiArrowRight, FiX } from "react-icons/fi";

const optionsPremium = [
    { id: 1, desc: "Unlimited videos" },
    { id: 2, desc: "Customizable player color" },
    { id: 3, desc: "Interactive forms" },
    { id: 4, desc: "Interactive surveys" },
    { id: 5, desc: "Invite users to the account " },
    { id: 6, desc: "Remove videco branding " },
];
interface PackageTierProps {
    hidePiricng?: () => void;
}
const Pricing = ({ hidePiricng }: PackageTierProps) => {
    return (
        <Box>
            <Box
                pos="fixed"
                bg="gray.300"
                zIndex={999}
                opacity={0.8}
                left={0}
                top={0}
                w="full"
                h="full"
            />
            <Box
                py={6}
                px={5}
                width="full"
                pos="fixed"
                zIndex={999}
                bg="white"
                maxW="2xl"
                margin={"auto"}
                left={"50%"}
                top={"50%"}
                rounded={"md"}
                transform={"translate(-50%, -50%)"}
            >
                <Box float="right" cursor="pointer" zIndex={800}>
                    <FiX onClick={() => hidePiricng()} />
                </Box>
                <Box>
                    <Image src="/assets/logonew.png" w="20" m="0 auto" />
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
                        Unlock Multiple Perks
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
                        10x your results with personalised videos!
                    </Text>
                    <Box p={5}>
                        <Flex>
                            <Box width="full" pl={0} rounded="lg" ml={0}>
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
                            _hover={{
                                bg: "#3086AC",
                            }}
                            mt={8}
                            w="full"
                            onClick={() => (window.location.href = "/pricing")}
                            rightIcon={<FiArrowRight />}
                        >
                            See all plans
                        </Button>
                        <Text textAlign="center" mt={2} fontSize="md">
                            Got questions?{" "}
                            <a
                                href="mailto:support@videco.io"
                                style={{
                                    textDecoration: "underline",
                                }}
                            >
                                Chat with us!
                            </a>
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Pricing;
