import {
    Box,
    Button,
    Card,
    CardBody,
    Heading,
    useToast,
    Text,
    SimpleGrid,
    Flex,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Portal,
    Tag,
    Spinner,
    Divider,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
} from "@chakra-ui/react";
import { IoIosRefresh } from "react-icons/io";
import { processAIVideos } from "src/services/api/createAIPreview";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FiCheck, FiInfo, FiPlayCircle, FiRefreshCcw } from "react-icons/fi";
import { useSession } from "@supabase/auth-helpers-react";
import { greetings, the_greeting } from "src/utils/voice";

interface StepImportProps {
    children?: React.ReactNode;
    setIsOpen: any;
    user?: any;
}
export const StepGenerate: React.FC<StepImportProps> = ({ setIsOpen }) => {
    const [loading, setLoading] = useState(false);
    const [AIVideos, setAIVideos] = useState([]);
    const [activePreviewVideo, setActivePreviewVideo] = useState<any>();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const previewModal = useDisclosure();
    const router = useRouter();
    const toast = useToast();
    const [greeting, setGreeting] = useState("Hello");
    const [background, setBackground] = useState("website");
    const [voiceID, setVoiceID] = useState<string>("");
    const [regenerateData, setRegenerateData] = useState<any>();
    const [language, setLanguage] = useState<string>("");
    const [originalVideoPubId, setOriginalVideoPubId] = useState<string>("");
    const supabase = createClientComponentClient();
    const session = useSession();
    const user = session?.user;

    const getAIVideosFromDB = async () => {
        setLoading(true);
        try {
            const aiVideos = supabase
                .from("ai_videos")
                .select()
                .eq("og_video_id", router.query.id);
            const { data, error, status } = await aiVideos;

            setAIVideos(data);

            setLoading(false);
        } catch (error) {
            console.log(error);

            setLoading(false);
        }
    };
    useEffect(() => {
        // Subscribe to the `jobs` table for status changes.
        const subscription = supabase
            .channel("custom-all-channel")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "ai_videos",
                    filter: `og_video_id=eq.${router.query.id}`, // Status should be completed.
                },
                (payload) => {
                    setAIVideos((prev) =>
                        prev.map((video) =>
                            video.id === payload.new.id ? payload.new : video,
                        ),
                    );
                },
            )
            .subscribe();

        // Cleanup subscription when component unmounts
        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);
    const getVoiceid = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`ai_voice_id`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (data.ai_voice_id) {
                setVoiceID(data.ai_voice_id);
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    }, [user, supabase]);

    const getVideoFromDB = async () => {
        try {
            const { data, error } = await supabase
                .from("videos")
                .select("url, preview, campaign_name, language")
                .eq("id", router.query.id);
            if (data) {
                setOriginalVideoPubId(
                    data[0]?.url.split("/").pop().replace(".mp4", ""),
                );
                setLanguage(data[0]?.language);
            }
        } catch (error) {
            console.log("error..", error);
        }
    };

    const retryVideoGeneration = async (
        ai_video_id: string,
        fname: string,
        website: string,
    ) => {
        const startJob = await processAIVideos({
            og_video_public_id: originalVideoPubId,
            voice_id: voiceID,
            ai_video_id: ai_video_id,
            language: language,
            greeting: the_greeting(language, greeting),
            text: fname,
            background: background,
            website: website,
        });
    };
    useEffect(() => {
        if (router.query.id) {
            getVoiceid();
            getVideoFromDB();
        }
    }, [router]);

    useEffect(() => {
        getAIVideosFromDB();
    }, []);

    return (
        <Box mt={12} w="full">
            <Modal
                size="2xl"
                isOpen={previewModal.isOpen}
                onClose={() => {
                    previewModal.onClose();
                    setActivePreviewVideo("");
                }}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Video Preview: {activePreviewVideo?.contact?.fname}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody padding={0}>
                        <video
                            style={{
                                borderRadius: "4px",
                                width: "100%",
                            }}
                            src={activePreviewVideo?.url}
                            width="100%"
                            controls
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
            {AIVideos.length > 0 && (
                <Box display="flex" justifyContent="space-between" w="full">
                    <Box
                        textAlign="right"
                        mb={6}
                        display="flex"
                        justifyContent="flex-end"
                        alignItems="center"
                        cursor="pointer"
                    >
                        <FiInfo />{" "}
                        <Text ml={2}>
                            {
                                AIVideos?.filter(
                                    (video) => video.status === "completed",
                                ).length
                            }{" "}
                            out of {AIVideos?.length} videos are generated
                        </Text>
                    </Box>
                </Box>
            )}
            <SimpleGrid columns={1} spacing={5} rounded="md" pt={3}>
                <Box
                    border={AIVideos?.length > 0 ? "1px solid #9C9F9F" : 0}
                    p={3}
                    rounded="md"
                    mb={12}
                >
                    {AIVideos &&
                        AIVideos.length > 0 &&
                        AIVideos?.map((video, index) => (
                            <Card
                                key={video.fname}
                                ml="1"
                                mb={6}
                                boxShadow="none"
                            >
                                <CardBody
                                    padding={0}
                                    display="flex"
                                    boxShadow="none"
                                    border="0"
                                    flexDir={["column", "column", "row"]}
                                >
                                    <Button
                                        bg="transparent"
                                        mt="2"
                                        onClick={() => {
                                            setActivePreviewVideo(video);
                                            previewModal.onOpen();
                                        }}
                                        _hover={{
                                            bg: "transparent",
                                        }}
                                    >
                                        <FiPlayCircle
                                            fontSize={32}
                                            color="#4991A1"
                                        />
                                    </Button>
                                    <Flex
                                        justifyContent="space-between"
                                        mx={15}
                                        p={1}
                                        w="full"
                                        flexDir={["column", "column", "row"]}
                                    >
                                        <Box>
                                            <Heading
                                                size="md"
                                                onClick={() =>
                                                    router.push({
                                                        pathname: `/videos/edit`,
                                                        query: {
                                                            id: video.id,
                                                            preview: true,
                                                        },
                                                    })
                                                }
                                                p="0"
                                                m="0"
                                                cursor="pointer"
                                            >
                                                {video.contact.fname ??
                                                    "No Name"}
                                            </Heading>
                                            <Text
                                                as="span"
                                                fontSize="xs"
                                                mt={0}
                                            >
                                                {video.contact.email ??
                                                    "No email"}
                                            </Text>
                                        </Box>

                                        <Box
                                            zIndex={999}
                                            display="flex"
                                            alignItems="center"
                                        >
                                            <Tag
                                                colorScheme={
                                                    video.status === "completed"
                                                        ? "green"
                                                        : "red"
                                                }
                                            >
                                                {video.status === "completed" &&
                                                    "Completed"}
                                                {video.status === "error" &&
                                                    "Error - Please retry"}
                                                {video.status === "pending" && (
                                                    <>
                                                        <Spinner size="xs" />{" "}
                                                        <Box ml={2}>
                                                            Processing
                                                        </Box>
                                                    </>
                                                )}
                                                {video.status === "error" && (
                                                    <Box>
                                                        If this presist please
                                                        contact support
                                                    </Box>
                                                )}
                                            </Tag>

                                            <Box zIndex={999}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setRegenerateData(
                                                            video,
                                                        );
                                                        onOpen();
                                                    }}
                                                >
                                                    <FiRefreshCcw />
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Flex>
                                </CardBody>

                                {AIVideos.length - 1 !== index && (
                                    <Divider
                                        color="#DADADA"
                                        mx={6}
                                        width="96%"
                                        mt={2}
                                    ></Divider>
                                )}
                            </Card>
                        ))}
                    <Modal isOpen={isOpen} onClose={onClose} size="xl">
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Hold on</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Box>
                                    This will regenerate the video. Including
                                    the greeting. Please select a greeting
                                    before generating the video
                                </Box>
                                <Flex mt={2}>
                                    {language === "english" &&
                                        greetings.en.map((myGreeting) => (
                                            <Box
                                                border="1px solid #4991A1"
                                                rounded="md"
                                                py={2}
                                                px={3}
                                                onClick={() => {
                                                    setGreeting(myGreeting);
                                                }}
                                                mr={2}
                                                fontSize="16px"
                                                bg="#F7F9FA"
                                                cursor="pointer"
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                            >
                                                <Text mr={2}>
                                                    {myGreeting} ||FNAME||{" "}
                                                </Text>
                                                {myGreeting === greeting && (
                                                    <FiCheck color="#4991A1" />
                                                )}
                                            </Box>
                                        ))}
                                    {language === "french" &&
                                        greetings.fr.map((myGreeting) => (
                                            <Box
                                                border="1px solid #4991A1"
                                                rounded="md"
                                                py={2}
                                                onClick={() => {
                                                    setGreeting(myGreeting);
                                                }}
                                                px={3}
                                                mr={2}
                                                fontSize="16px"
                                                bg="#F7F9FA"
                                                cursor="pointer"
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                            >
                                                <Text mr={2}>
                                                    {myGreeting} ||FNAME||{" "}
                                                </Text>
                                                {myGreeting === greeting && (
                                                    <FiCheck color="#4991A1" />
                                                )}
                                            </Box>
                                        ))}
                                    {language === "spanish" &&
                                        greetings.sp.map((myGreeting) => (
                                            <Box
                                                border="1px solid #4991A1"
                                                rounded="md"
                                                py={2}
                                                px={3}
                                                mr={2}
                                                onClick={() => {
                                                    setGreeting(myGreeting);
                                                }}
                                                fontSize="16px"
                                                bg="#F7F9FA"
                                                cursor="pointer"
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                            >
                                                <Text mr={2}>
                                                    {myGreeting} ||FNAME||{" "}
                                                </Text>
                                                {myGreeting === greeting && (
                                                    <FiCheck color="#4991A1" />
                                                )}
                                            </Box>
                                        ))}
                                </Flex>
                                {regenerateData?.contact?.website && (
                                    <Box>
                                        <Text
                                            fontSize="20"
                                            fontWeight="semibold"
                                            mt={4}
                                            textAlign="left"
                                            color="#05405A"
                                        >
                                            Video Background:
                                        </Text>
                                        <Text
                                            fontSize="16"
                                            textAlign="left"
                                            color="#05405A"
                                        >
                                            Select a background for your video.
                                            Learn more about backgrounds here.
                                        </Text>
                                        <Select
                                            mt={4}
                                            width="md"
                                            defaultValue={background}
                                            onChange={(el) =>
                                                setBackground(el.target.value)
                                            }
                                        >
                                            <option value="no_bg">
                                                No Background
                                            </option>
                                            <option value="website">
                                                Website / Linkedin (Dynamic)
                                            </option>
                                            <option value="secondery" disabled>
                                                Multiple Backgrounds (Coming
                                                soon)
                                            </option>
                                            <option value="secondery" disabled>
                                                Secondary video (Coming soon)
                                            </option>
                                        </Select>
                                    </Box>
                                )}
                                <Button
                                    my={4}
                                    variant="brand"
                                    fontWeight="normal"
                                    _hover={{
                                        bg: "#53ADD4",
                                    }}
                                    bg="#4991A1"
                                    color="white"
                                    onClick={() => {
                                        retryVideoGeneration(
                                            regenerateData.id,
                                            regenerateData.contact.fname,
                                            regenerateData.contact.website,
                                        );
                                        onClose();
                                    }}
                                >
                                    Regenerate the video{" "}
                                    {regenerateData?.contact?.fname}
                                </Button>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Box>
            </SimpleGrid>
            {!AIVideos?.length && (
                <Box textAlign="center">
                    You don't have any AI videos. Please wait and check back
                    later
                </Box>
            )}

            {/* )} */}
        </Box>
    );
};
