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
    Image,
    Card,
    CardBody,
    CardFooter,
    Divider,
    Heading,
    SimpleGrid,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Portal,
    Input,
} from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { FiBarChart, FiShare } from "react-icons/fi";

const Videos: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [AIVideos, setAIVideos] = useState([]);
    const session = useSession();
    const user = session?.user;
    const router = useRouter();
    const { clearVideo } = useEditorStore();
    const getAIVideosFromDB = async () => {
        setLoading(true);
        try {
            const aiVideos = supabase
                .from("ai_videos")
                .select()
                .eq("user_id", user.id);
            const { data } = await aiVideos;

            setAIVideos(data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);

            getAIVideosFromDB();
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
                        <Header pageTitle="AI Personalized Video" />
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
                            {!AIVideos.length && !loading ? (
                                <Flex
                                    mt={12}
                                    direction={["column", "column", "column"]}
                                >
                                    <Box ml="7" margin="60px auto">
                                        <Text
                                            fontSize="2xl"
                                            mb={6}
                                            fontWeight="bold"
                                        >
                                            Ready to use AI Personalized Videos?
                                        </Text>
                                        <Text fontSize="md" mb={6} maxW="xl">
                                            We're introducing AI Personalized
                                            Videos in Videco, allowing sales
                                            teams to easily create customized
                                            video content for each prospect,
                                            enhancing engagement and
                                            effectiveness.
                                        </Text>

                                        <Link
                                            href="/videos/edit?type=record"
                                            bg="#05405A"
                                            color="white"
                                            p={2}
                                            px={5}
                                            my="2"
                                            rounded="lg"
                                        >
                                            Start creating AI Videos
                                        </Link>

                                        <Image
                                            w="2xl"
                                            mt={5}
                                            src="https://videco.io/wp-content/uploads/2024/07/videco-header-main-page.png"
                                        />
                                    </Box>
                                </Flex>
                            ) : (
                                <SimpleGrid
                                    mt={5}
                                    ml={5}
                                    columns={[2, null, 3]}
                                    spacing="40px"
                                >
                                    {AIVideos &&
                                        AIVideos.map((video) => {
                                            return (
                                                <Card maxW="sm" key={video?.id}>
                                                    <CardBody
                                                        padding={0}
                                                        cursor="pointer"
                                                    >
                                                        <video
                                                            width="100%"
                                                            style={{
                                                                borderRadius:
                                                                    "12px",
                                                            }}
                                                            src={`https://res.cloudinary.com/${
                                                                process.env
                                                                    .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                                                            }/video/upload/c_fill,h_200,w_300/fl_splice,l_video:${video.og_video_url
                                                                .split("/")
                                                                .pop()
                                                                .replace(
                                                                    ".m3u8",
                                                                    "",
                                                                )}/c_fill,h_200,w_300/fl_layer_apply/${video.url
                                                                .split("/")
                                                                .pop()}`}
                                                            controls
                                                        ></video>
                                                        <Flex
                                                            mt="6"
                                                            justifyContent="space-between"
                                                            mx={3}
                                                        >
                                                            <Heading size="md">
                                                                {video?.contact
                                                                    ?.fname ??
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
                                                        </Flex>
                                                    </CardBody>
                                                    <Divider
                                                        mt={4}
                                                        color="#b9b9b9"
                                                    />
                                                    <CardFooter
                                                        justify="space-between"
                                                        flexWrap="wrap"
                                                    >
                                                        <Button
                                                            fontSize="sm"
                                                            variant="ghost"
                                                            leftIcon={
                                                                <FiBarChart />
                                                            }
                                                            onClick={() =>
                                                                router.push({
                                                                    pathname: `/analytics`,
                                                                })
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
                                                                            value={`https://app.videco.io/embed/${video?.og_video_id}?ai=${video.id}`}
                                                                        />
                                                                    </PopoverBody>
                                                                </PopoverContent>
                                                            </Portal>
                                                        </Popover>
                                                    </CardFooter>
                                                </Card>
                                            );
                                        })}
                                </SimpleGrid>
                            )}
                        </GridItem>
                    </Grid>
                </Sidebar>
            )}
        </>
    );
};
export default Videos;
