import { CheckIcon } from "@chakra-ui/icons";
import { Flex, Box, Text, Spinner, Link } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";

export const OnBoardingVideoLoader: FC = () => {
    const [showIcon1, setShowIcon1] = useState(false);
    const [showIcon2, setShowIcon2] = useState(false);
    const [showIcon3, setShowIcon3] = useState(false);
    const [showIcon4, setShowIcon4] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowIcon1(true), 3000); // 5s delay
        setTimeout(() => setShowIcon2(true), 7000); // 7s delay
        setTimeout(() => setShowIcon3(true), 9000); // 9s delay
        // setTimeout(() => setShowIcon4(true), 11000); // 11s delay
    }, []);
    return (
        <Box
            ml={6}
            mt={6}
            pos="relative"
            p={5}
            rounded="lg"
            maxW="500"
            m="26px auto"
        >
            <Flex
                justifyContent="space-between"
                flexDir={"column"}
                textAlign="left"
            >
                <Text fontWeight="semibold" fontSize="2xl" color="#383F40">
                    Crafting a video for you ...
                </Text>
                <Text color="#9C9F9F">
                    Videco is creating a personalized video for you. Hang tight
                    this might take 20-30 seconds.
                </Text>

                <Box mt={5}>
                    <Flex w="full" justifyContent="space-between">
                        Crafting your script
                        <>
                            {showIcon1 ? (
                                <CheckIcon
                                    color="white"
                                    rounded="full"
                                    bg="#4991A1"
                                    padding="4px"
                                />
                            ) : (
                                <Spinner size="sm" />
                            )}
                        </>
                    </Flex>
                    <Flex mt={3} w="full" justifyContent="space-between">
                        Crawling your website
                        <>
                            {showIcon2 ? (
                                <CheckIcon
                                    color="white"
                                    rounded="full"
                                    bg="#4991A1"
                                    padding="4px"
                                />
                            ) : (
                                <Spinner size="sm" />
                            )}
                        </>
                    </Flex>
                    <Flex mt={3} w="full" justifyContent="space-between">
                        Generating video output
                        <>
                            {showIcon3 ? (
                                <CheckIcon
                                    color="white"
                                    rounded="full"
                                    bg="#4991A1"
                                    padding="4px"
                                />
                            ) : (
                                <Spinner size="sm" />
                            )}
                        </>
                    </Flex>
                    <Flex mt={3} w="full" justifyContent="space-between">
                        Editing your final video
                        <>
                            {showIcon4 ? (
                                <CheckIcon
                                    color="white"
                                    rounded="full"
                                    bg="#4991A1"
                                    padding="4px"
                                />
                            ) : (
                                <Spinner size="sm" />
                            )}
                        </>
                    </Flex>
                    <Flex mt={5} w="full" color="#9C9F9F">
                        Don’t wanna wait?{" "}
                        <Link href="/videos/start" ml={1} textDecor="underline">
                            start creating your campaign
                        </Link>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
};
