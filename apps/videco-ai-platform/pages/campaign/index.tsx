import React, { useCallback, useEffect, useState } from "react";
import {
    Grid,
    GridItem,
    Button,
    Box,
    Flex,
    Spinner,
    Text,
    Link,
    Menu,
    MenuButton,
    Image,
    CardBody,
    Heading,
    Card,
    SimpleGrid,
    Tag,
    MenuItem,
    MenuList,
    useToast,
    useMediaQuery,
} from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import {
    FiBarChart,
    FiDelete,
    FiEdit,
    FiMoreVertical,
    FiShare,
} from "react-icons/fi";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { videoTypes } from "src/utils/video";
import { OnBoardingVideo } from "@components/common/onboarding-video";
import { PiPlay, PiVideo } from "react-icons/pi";

const Videos: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [isLargerThan800] = useMediaQuery("(min-width: 1000px)");
    const [videoData, setVideoData] = useState<any>();
    const [filterVideos, setFilterVideos] = useState<any>(videoTypes.campaign);
    const filteredVideos = filterVideos
        ? videoData?.filter((video: any) => video.type === filterVideos)
        : videoData;
    const session = useSession();
    const user = session?.user;
    useEffect(() => {
        window.usetifulTags = { userId: user?.id };

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
    }, [user]);
    const router = useRouter();
    const toast = useToast();
    const { getData } = useFetchTeamData();
    const { clearVideo } = useEditorStore();

    const deleteVideoFromId = useCallback(async (id) => {
        try {
            await supabase
                .from("videos")
                .update({ status: "deleted" })
                .eq("id", id)
                .select()
                .then((res) => {
                    toast({
                        title: "Deleted",
                        description: "Your video has been deleted",
                        status: "error",
                        duration: 1000,
                        isClosable: true,
                    });
                    setTimeout(() => {
                        router.reload();
                    }, 1000);
                });
        } catch (error) {
            toast({
                title: "Something went wrong",
                description:
                    "Please contact our support. Something went wrong while deleting your video.",
                status: "warning",
                duration: 1000,
                isClosable: true,
            });
        }
    }, []);

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
        clearVideo();
    }, [user, supabase]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);

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
                    <Flex
                        direction="column"
                        bg="white"
                        mb={1}
                        boxShadow="sm"
                        w="full"
                    >
                        <Header pageTitle="Personalized Campaigns" />
                    </Flex>
                    <Grid
                        templateColumns={[
                            null,
                            "repeat(12, 1fr)",
                            "repeat(12, 1fr)",
                        ]}
                        h="full"
                        textColor="black"
                    >
                        <GridItem
                            pr={8}
                            w="full"
                            colSpan={12}
                            h="full"
                            bg="white"
                        >
                            {/* <Banner iconOnly={true} name="video_page_banenr" /> */}

                            <Flex
                                mt={5}
                                mb={22}
                                direction={["column", "column", "column"]}
                            >
                                <Box ml="7">
                                    {!!videoData?.length && (
                                        <Flex
                                            direction={[
                                                "column",
                                                "column",
                                                "row",
                                            ]}
                                        ></Flex>
                                    )}
                                    <SimpleGrid
                                        mt={2}
                                        w="auto"
                                        columns={[1]}
                                        ml={6}
                                        spacing="50px"
                                    >
                                        {!!filteredVideos?.length &&
                                            filteredVideos.map((video) => (
                                                <Card
                                                    maxW="70%"
                                                    w="100%"
                                                    key={video?.id}
                                                    border="1px solid #e5e5e5"
                                                    boxShadow="none"
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
                                                                video?.url
                                                                    ? `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${video?.url
                                                                          .split(
                                                                              "/",
                                                                          )
                                                                          .pop()
                                                                          .replace(
                                                                              ".mp4",
                                                                              ".gif",
                                                                          )
                                                                          .replace(
                                                                              ".mov",
                                                                              ".gif",
                                                                          )
                                                                          .replace(
                                                                              ".m3u8",
                                                                              ".gif",
                                                                          )
                                                                          .replace(
                                                                              ".webm",
                                                                              ".gif",
                                                                          )}`
                                                                    : "/default_thumb.png"
                                                            }
                                                            height={[
                                                                "124",
                                                                "32",
                                                                "32",
                                                            ]}
                                                            maxW="250"
                                                            w="100%"
                                                            onClick={() =>
                                                                router.push({
                                                                    pathname:
                                                                        video.url
                                                                            ? `/videos/edit`
                                                                            : video.type ===
                                                                              videoTypes.clone
                                                                            ? "/clones/create"
                                                                            : "/campaign/steps/start",
                                                                    query: {
                                                                        id: video.id,
                                                                        preview:
                                                                            video.url
                                                                                ? true
                                                                                : false,
                                                                        campaign:
                                                                            true,
                                                                        clone:
                                                                            video.type ===
                                                                            videoTypes.clone
                                                                                ? true
                                                                                : false,
                                                                    },
                                                                })
                                                            }
                                                            cursor="pointer"
                                                            alt="Preview"
                                                            borderRadius="lg"
                                                            rounded="md"
                                                            borderTopRightRadius={
                                                                0
                                                            }
                                                            borderBottomRightRadius={
                                                                0
                                                            }
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
                                                                    onClick={() =>
                                                                        router.push(
                                                                            {
                                                                                pathname:
                                                                                    video.url
                                                                                        ? `/videos/edit`
                                                                                        : video.type ===
                                                                                          videoTypes.clone
                                                                                        ? "/clones/create"
                                                                                        : "/campaign/steps/start",
                                                                                query: {
                                                                                    id: video.id,
                                                                                    preview:
                                                                                        video.url
                                                                                            ? true
                                                                                            : false,
                                                                                    campaign:
                                                                                        true,
                                                                                    clone:
                                                                                        video.type ===
                                                                                        videoTypes.clone
                                                                                            ? true
                                                                                            : false,
                                                                                },
                                                                            },
                                                                        )
                                                                    }
                                                                    cursor="pointer"
                                                                >
                                                                    {video.type ===
                                                                    "Video"
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

                                                            <Box mt={4}>
                                                                <Button
                                                                    fontSize="sm"
                                                                    variant="ghost"
                                                                    mx={4}
                                                                    onClick={() =>
                                                                        router.push(
                                                                            {
                                                                                pathname: `/analytics`,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <FiBarChart />
                                                                </Button>

                                                                <Button
                                                                    fontSize="sm"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            {
                                                                                pathname:
                                                                                    video.url
                                                                                        ? `/videos/edit`
                                                                                        : video.type ===
                                                                                          videoTypes.clone
                                                                                        ? "/clones/create"
                                                                                        : "/campaign/steps/start",
                                                                                query: {
                                                                                    id: video.id,
                                                                                    preview:
                                                                                        video.url
                                                                                            ? true
                                                                                            : false,
                                                                                    campaign:
                                                                                        true,
                                                                                    clone:
                                                                                        video.type ===
                                                                                        videoTypes.clone
                                                                                            ? true
                                                                                            : false,
                                                                                },
                                                                            },
                                                                        )
                                                                    }
                                                                    colorScheme="green"
                                                                >
                                                                    <FiShare />
                                                                </Button>

                                                                <Menu>
                                                                    <MenuButton
                                                                        bg="transparent"
                                                                        as={
                                                                            Button
                                                                        }
                                                                    >
                                                                        <FiMoreVertical />
                                                                    </MenuButton>
                                                                    <MenuList>
                                                                        <MenuItem
                                                                            icon={
                                                                                <FiEdit />
                                                                            }
                                                                            onClick={() =>
                                                                                router.push(
                                                                                    {
                                                                                        pathname:
                                                                                            video.url
                                                                                                ? `/videos/edit`
                                                                                                : video.type ===
                                                                                                  videoTypes.clone
                                                                                                ? "/clones/create"
                                                                                                : "/campaign/steps/start",
                                                                                        query: {
                                                                                            id: video.id,
                                                                                            preview:
                                                                                                video.url
                                                                                                    ? true
                                                                                                    : false,
                                                                                            clone:
                                                                                                video.type ===
                                                                                                videoTypes.clone
                                                                                                    ? true
                                                                                                    : false,
                                                                                        },
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </MenuItem>
                                                                        <MenuItem
                                                                            icon={
                                                                                <FiDelete />
                                                                            }
                                                                            onClick={() =>
                                                                                deleteVideoFromId(
                                                                                    video.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            Delete
                                                                        </MenuItem>
                                                                    </MenuList>
                                                                </Menu>
                                                            </Box>
                                                        </Flex>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                    </SimpleGrid>
                                    {!loading && !filteredVideos?.length ? (
                                        <Box textAlign="center" w="full">
                                            <OnBoardingVideo />
                                        </Box>
                                    ) : (
                                        <>
                                            {/* {" "}
                                            <Box
                                                pos="absolute"
                                                right={4}
                                                border="1px solid #DADADA"
                                                top={28}
                                                bg="white"
                                                maxW="xs"
                                                boxShadow="md"
                                                p={4}
                                                rounded="md"
                                            >
                                                <Text
                                                    fontSize="lg"
                                                    fontWeight="semibold"
                                                    as="span"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    <FiVideo
                                                        style={{
                                                            marginRight: "5px",
                                                        }}
                                                    />
                                                    Onboarding Meeting
                                                </Text>
                                                <Tag mt={2}>15 min</Tag>
                                                <Text fontSize="md" mt={3}>
                                                    Let us craft the perfect
                                                    personalized campaign
                                                    tailored just for you!
                                                </Text>
                                                <Button
                                                    variant="videco"
                                                    onClick={() =>
                                                        window.open(
                                                            process.env.NEXT_PUBLIC_CALENDAR_BOOKING_URL,
                                                        )
                                                    }
                                                    mt={4}
                                                    bg="#383F40"
                                                >
                                                    Join now
                                                </Button>
                                            </Box> */}
                                            {isLargerThan800 && (
                                                <Box
                                                    pos="absolute"
                                                    right={4}
                                                    border="1px solid #DADADA"
                                                    top={40}
                                                    // bg="#ecf7f7"
                                                    bgGradient="linear(to-r, #85dcf0b9, #ecf7f7)"
                                                    maxW="xs"
                                                    display="flex"
                                                    alignItems="center"
                                                    boxShadow="md"
                                                    p={4}
                                                    rounded="md"
                                                    onClick={() =>
                                                        window?.open(
                                                            "https://www.youtube.com/watch?v=2xXPGa1fSfs",
                                                        )
                                                    }
                                                    cursor="pointer"
                                                >
                                                    <Text
                                                        fontSize="lg"
                                                        fontWeight="semibold"
                                                        as="span"
                                                        display="flex"
                                                        ml={2}
                                                        mr={4}
                                                        alignItems="center"
                                                    >
                                                        Watch our quick demo
                                                    </Text>
                                                    <PiVideo
                                                        style={{
                                                            marginRight: "5px",
                                                        }}
                                                    />

                                                    {/* <Image
                                                        src="assets/avatar.png"
                                                        rounded="md"
                                                        onClick={() =>
                                                            window?.open(
                                                                "https://www.youtube.com/watch?v=2xXPGa1fSfs",
                                                            )
                                                        }
                                                        cursor="pointer"
                                                        mt={2}
                                                    /> */}
                                                    <Box
                                                        pos="absolute"
                                                        top="119px"
                                                        color="white"
                                                        fontSize="30"
                                                        left="135px"
                                                    >
                                                        <PiPlay />
                                                    </Box>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Flex>
                        </GridItem>
                    </Grid>
                </Sidebar>
            )}
        </>
    );
};
export default Videos;
