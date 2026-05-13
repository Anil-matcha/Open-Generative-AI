import React, { useCallback, useEffect, useState } from "react";
import {
    Grid,
    GridItem,
    Textarea,
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
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Portal,
    Input,
    Tag,
    MenuItem,
    MenuList,
    useToast,
} from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { FiBarChart, FiDelete, FiEdit, FiShare } from "react-icons/fi";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { Banner } from "@components/common/banners";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { videoTypes } from "src/utils/video";
import { OnBoardingVideo } from "@components/common/onboarding-video";

const Videos: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [videoData, setVideoData] = useState<any>();
    const [filterVideos, setFilterVideos] = useState<any>(videoTypes.clone);
    const filteredVideosList = filterVideos
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
                        <Header pageTitle="AI clones" />
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
                            {/* <Banner iconOnly={false} name="video_page_banenr" /> */}

                            <Flex
                                mb={22}
                                direction={["column", "column", "column"]}
                            >
                                <Box ml="7">
                                    <SimpleGrid
                                        mt={12}
                                        columns={[1]}
                                        ml={6}
                                        spacing="40px"
                                    >
                                        {!!filteredVideosList?.length &&
                                            filteredVideosList.map((video) => (
                                                <Card
                                                    maxW="70%"
                                                    w="full"
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
                                                                video?.url &&
                                                                !video?.url.includes(
                                                                    "sync.so",
                                                                )
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
                                                                            : "/clones/create",
                                                                    query: {
                                                                        id: video.id,
                                                                        preview:
                                                                            video.url
                                                                                ? true
                                                                                : false,
                                                                        clone: true,
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
                                                                                pathname: `/videos/edit`,
                                                                                query: {
                                                                                    id: video.id,
                                                                                    preview:
                                                                                        true,
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
                                                                <Menu>
                                                                    <MenuButton
                                                                        bg="transparent"
                                                                        as={
                                                                            Button
                                                                        }
                                                                        rightIcon={
                                                                            <ChevronDownIcon />
                                                                        }
                                                                    >
                                                                        Manage
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
                                                                                                : "/clones/create",
                                                                                        query: {
                                                                                            id: video.id,
                                                                                            preview:
                                                                                                true,
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
                                                                <Button
                                                                    fontSize="sm"
                                                                    variant="ghost"
                                                                    mx={6}
                                                                    leftIcon={
                                                                        <FiBarChart />
                                                                    }
                                                                    onClick={() =>
                                                                        router.push(
                                                                            {
                                                                                pathname: `/analytics`,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    Analytics
                                                                </Button>

                                                                <Popover>
                                                                    <PopoverTrigger>
                                                                        <Button
                                                                            fontSize="sm"
                                                                            variant="ghost"
                                                                            colorScheme="green"
                                                                            leftIcon={
                                                                                <FiShare />
                                                                            }
                                                                        >
                                                                            Share
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <Portal>
                                                                        <PopoverContent>
                                                                            <PopoverArrow />
                                                                            <PopoverCloseButton />
                                                                            <PopoverBody>
                                                                                <Text
                                                                                    as="span"
                                                                                    fontSize="sm"
                                                                                    bg="#252525"
                                                                                    color="white"
                                                                                    rounded="sm"
                                                                                    p={
                                                                                        1
                                                                                    }
                                                                                >
                                                                                    Share
                                                                                    this
                                                                                    video
                                                                                    with
                                                                                    your
                                                                                    friends
                                                                                </Text>
                                                                                <Input
                                                                                    mt={
                                                                                        2
                                                                                    }
                                                                                    mb={
                                                                                        2
                                                                                    }
                                                                                    value={
                                                                                        video?.final_url
                                                                                    }
                                                                                />
                                                                                <Text
                                                                                    as="span"
                                                                                    fontSize="sm"
                                                                                    bg="#252525"
                                                                                    color="white"
                                                                                    rounded="sm"
                                                                                    p={
                                                                                        1
                                                                                    }
                                                                                >
                                                                                    Embed
                                                                                    in
                                                                                    your
                                                                                    website
                                                                                </Text>
                                                                                <Textarea
                                                                                    mt={
                                                                                        2
                                                                                    }
                                                                                    value={
                                                                                        video?.embed_code
                                                                                    }
                                                                                />
                                                                            </PopoverBody>
                                                                        </PopoverContent>
                                                                    </Portal>
                                                                </Popover>
                                                            </Box>
                                                        </Flex>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                    </SimpleGrid>

                                    {!loading &&
                                        !filteredVideosList?.length && (
                                            <Box textAlign="center" w="full">
                                                <OnBoardingVideo
                                                    helpOff={true}
                                                />
                                            </Box>
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
