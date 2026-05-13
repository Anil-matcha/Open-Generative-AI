import { Box, Flex, Link, Text, Image } from "@chakra-ui/react";
import { FiRepeat } from "react-icons/fi";

export const EndScreen = ({
    endCTA,
    playerButtonHover,
    setUpdatedPlaying,
    updatedPlaying,
    setShowEnd,
    videcoBrandingRemoved,
    setPlayerButtonHover,
}: any) => (
    <>
        <Box
            bg="#00000083"
            position="absolute"
            w="100%"
            rounded="3xl"
            h="100%"
            left={0}
            top={0}
        />
        <Box
            position="absolute"
            transform="translate(-50%, -50%)"
            left="50%"
            top="50%"
            zIndex={99}
            textAlign="center"
        >
            {endCTA.link && endCTA.text && (
                <>
                    <Text
                        color="#ffffff"
                        fontSize="2xl"
                        fontWeight="bold"
                        paddingX="6"
                        paddingY="2"
                        rounded="md"
                    >
                        {endCTA.title}
                    </Text>
                    <Link
                        href={endCTA.link}
                        target="_blank"
                        bg="#17213B"
                        textColor="white"
                        py={4}
                        px={6}
                        rounded="full"
                        cursor="pointer"
                        _hover={{
                            bg: "#3d424e",
                        }}
                        mt={2}
                        display="inline-flex"
                    >
                        {endCTA.text}
                    </Link>
                </>
            )}
            <Flex justifyContent="center" mt={8}>
                <FiRepeat
                    size="30"
                    color="white"
                    fill={playerButtonHover ? "white" : "transparent"}
                    onClick={() => {
                        setUpdatedPlaying(!updatedPlaying);
                        setShowEnd(false);
                    }}
                    onMouseEnter={() => setPlayerButtonHover(true)}
                    onMouseLeave={() => setPlayerButtonHover(false)}
                    cursor={"pointer"}
                />
            </Flex>
            {!videcoBrandingRemoved && (
                <Flex mt={8} justifyContent="center">
                    <Text
                        color="#ffffff"
                        fontSize="md"
                        paddingX="2"
                        paddingY="2"
                        rounded="md"
                    >
                        Created By
                    </Text>
                    <Link
                        href="https://videco.io"
                        target="_blank"
                        bg="#f5f5f5"
                        rounded="16"
                        px={4}
                        m={0}
                        display="flex"
                        alignItems={"center"}
                    >
                        <Image src="/logo.svg" h={3} ml={2} />
                    </Link>
                </Flex>
            )}
        </Box>
    </>
);
