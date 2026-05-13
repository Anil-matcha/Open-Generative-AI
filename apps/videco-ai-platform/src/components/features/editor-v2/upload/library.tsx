import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Text,
    useDisclosure,
    Button,
    Box,
    Card,
    CardBody,
    Flex,
    Heading,
    Image,
    SimpleGrid,
    Tag,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import moment from "moment";
import router from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FiFolder } from "react-icons/fi";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { videoTypes } from "src/utils/video";
export const Library = ({ handleDownload }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [videoData, setVideoData] = useState<any>();
    const [filterVideos, setFilterVideos] = useState<any>(videoTypes.video);
    const session = useSession();
    const { getData } = useFetchTeamData();
    const user = session?.user;
    const filteredVideos = filterVideos
        ? videoData?.filter((video: any) => video.type === filterVideos)
        : videoData;
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

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);
    return (
        <>
            <Box
                border="1px solid #e6e4e4"
                px={6}
                py="20px"
                mb={2}
                _hover={{
                    cursor: "pointer",
                    textDecor: "none",
                    bg: "#6ff6ce",
                }}
                minWidth="230px"
                onClick={onOpen}
                bg="#F6F6F6"
                width="full"
                height="auto"
                rounded="md"
                alignItems="center"
                display="flex"
                flexDir="column"
            >
                <FiFolder
                    style={{
                        marginRight: "8px",
                    }}
                />
                <Button
                    variant="ghost"
                    _hover={{
                        bg: "transparent",
                    }}
                >
                    Select from Library
                </Button>
            </Box>

            <Modal isOpen={isOpen} onClose={onClose} size="3xl">
                <ModalOverlay />
                <ModalOverlay />
                <ModalContent height={600} overflowY="scroll" pb={12}>
                    <ModalHeader>Select a Video</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {" "}
                        <SimpleGrid mt={2} columns={[1]} spacing="40px">
                            {!!filteredVideos?.length &&
                                filteredVideos.map((video) => (
                                    <Card
                                        maxW="full"
                                        key={video?.id}
                                        border="1px solid #e5e5e5"
                                        boxShadow="none"
                                        onClick={() =>
                                            handleDownload(video.url)
                                        }
                                    >
                                        <CardBody
                                            padding={0}
                                            display="flex"
                                            flexDir={[
                                                "column",
                                                "column",
                                                "row",
                                            ]}
                                        >
                                            <Image
                                                src={
                                                    video?.preview
                                                        ? video?.preview
                                                        : "/default_thumb.png"
                                                }
                                                height={["124", "32", "32"]}
                                                maxW="250"
                                                w="100%"
                                                cursor="pointer"
                                                alt="Preview"
                                                borderRadius="lg"
                                                rounded="md"
                                                borderTopRightRadius={0}
                                                borderBottomRightRadius={0}
                                            />
                                            <Flex
                                                mt="6"
                                                justifyContent="space-between"
                                                mx={3}
                                                w="full"
                                                flexDir={[
                                                    "column",
                                                    "column",
                                                    "row",
                                                ]}
                                            >
                                                <Box>
                                                    <Tag
                                                        bg={
                                                            video.type ===
                                                            "Video"
                                                                ? "#4991A1"
                                                                : "#4991A1"
                                                        }
                                                        color="white"
                                                        mb={3}
                                                    >
                                                        {video.type}
                                                    </Tag>
                                                    <Heading
                                                        size="md"
                                                        cursor="pointer"
                                                    >
                                                        {video.type === "Video"
                                                            ? video?.name ??
                                                              "No Name"
                                                            : video?.campaign_name ??
                                                              "No Name"}
                                                    </Heading>
                                                    <Text
                                                        as="span"
                                                        fontSize="xs"
                                                    >
                                                        {moment(
                                                            video?.created_at,
                                                            "YYYYMMDD",
                                                        ).fromNow()}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        </CardBody>
                                    </Card>
                                ))}
                        </SimpleGrid>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
