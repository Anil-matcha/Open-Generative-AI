import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Box, Text, Image } from "@chakra-ui/react";
import Link from "next/link";
import { FC, useState } from "react";
import { GiDiploma } from "react-icons/gi";
import { useBanner } from "src/hooks/useBanner";

type BannerProps = {
    name: string;
    iconOnly: boolean;
};
export const Banner: FC<BannerProps> = ({ name, iconOnly }) => {
    const [isBannerVisible, setIsBannerVisible] = useState(iconOnly);

    const { updateBanner } = useBanner();

    return (
        <>
            {isBannerVisible ? (
                <Box
                    mr={8}
                    mt={2}
                    pos="absolute"
                    px={4}
                    color="#05405A"
                    py={1}
                    rounded="lg"
                    fontSize={15}
                    bg="#EDF4F6"
                    cursor="pointer"
                    right={0}
                    onClick={() => {
                        updateBanner(name, true);
                        setIsBannerVisible(false);
                    }}
                >
                    Not sure how to start?
                </Box>
            ) : (
                <Box
                    bg="#6ec1d430"
                    ml={6}
                    mt={6}
                    pos="relative"
                    p={5}
                    rounded="lg"
                >
                    <Box pos="absolute" right={3} top={1} cursor="pointer">
                        <CloseIcon
                            onClick={() => {
                                updateBanner(name, false);
                                setIsBannerVisible(true);
                            }}
                            width="12px"
                        />
                    </Box>
                    <Flex
                        justifyContent="space-between"
                        flexDir={["column", "column", "row"]}
                    >
                        <Box mt={-2}>
                            <GiDiploma size="23" color="#05405A" />
                            <Text mt={2} fontSize="16px" fontWeight="semibold">
                                {" "}
                                Not sure how to start?
                            </Text>
                            <Text fontSize="14px" mt={1} color="#5b5a5a">
                                Check out our video tutorials or read the
                                documentation
                            </Text>
                        </Box>

                        <Flex>
                            <Box width="160px" cursor="pointer">
                                <Link
                                    target="_blank"
                                    href="https://www.youtube.com/watch?v=AwGwI4_Ldy4&t=216s"
                                >
                                    <Image
                                        boxShadow="md"
                                        rounded="lg"
                                        src="/assets/help_video.gif"
                                    />
                                </Link>
                            </Box>
                            <Box
                                mx={6}
                                width="200px"
                                boxShadow="md"
                                border="1px solid #5c5c5c"
                                p={2}
                                rounded="lg"
                            >
                                <Text
                                    fontSize="14px"
                                    fontWeight="semibold"
                                    color="#292929"
                                >
                                    How to create dynamic videos?
                                </Text>
                                <Link
                                    target="_blank"
                                    href="https://roadmap.videco.io/p/create-your-first-video-g3Yeaw"
                                >
                                    <Text
                                        fontSize="14px"
                                        mt={2}
                                        color="#05405A"
                                    >
                                        Read about dynamic videos
                                    </Text>
                                </Link>
                            </Box>
                        </Flex>
                    </Flex>
                </Box>
            )}
        </>
    );
};
