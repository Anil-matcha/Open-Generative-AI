import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Image,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Stack,
    Text,
    useDisclosure,
    Link,
    useMediaQuery,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { FiArrowRight } from "react-icons/fi";
import { useBrandKit } from "src/hooks/getBrandKit";
import { usePersonalizedContent } from "src/hooks/usePersonalizedContent";
import Head from "next/head";

const Edit: React.FC = ({ videoData }: any) => {
    const router = useRouter();
    const { personalizedContent } = usePersonalizedContent();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isLargerThan800] = useMediaQuery("(min-width: 800px)");

    const [videoUrl, setVideoUrl] = useState("");
    const [password, setPassword] = useState("");
    const [videoRest, setVideoRest] = useState({
        name: "",
        desc: "",
        platform: "videco",
        preview: "",
        primary_link: "https://videco.io",
        primary_text: "Learn More",
        secondary_text: "Watch more videos",
        secondary_link: "https://videco.io/docs",
        elements: [],
        password_protection: "false",
        brand: {
            videcoBranding: false,
        },
        endCTAlink: "",
        endCTAtitle: "",
        endCTAtext: "",
    });
    const [brandKit, setBrandKit] = useState({
        primary_color: "#05405A",
        secondary_color: "#1A202C",
        primary_text_color: "#ffffff",
        secondary_text_color: "#ffffff",
    });
    const [playing, setPlaying] = useState(false);
    const [input, setInput] = useState("");
    const { getBrandKit } = useBrandKit();
    const handleInputChange = (e) => setInput(e.target.value);

    const [duration, setDuration] = useState(0);
    const supabase = createClientComponentClient();
    const playerRef = useRef(null);
    const { setVideo, setInteractiveElements, interactiveElements, video } =
        useEditorStore();
    const getVideoByID = useCallback(async () => {
        await supabase
            .from("videos")
            .select(
                "url, name, desc, elements, endCTAlink, endCTAtitle, endCTAtext, brand, preview, password_protection, primary_link, primary_text, secondary_text, secondary_link, platform, user_id",
            )
            .match({ id: router.query.id })
            .then((res) => {
                setVideoUrl(res.data?.[0].url);
                setVideoRest({
                    name: res.data?.[0].name,
                    desc: res.data?.[0].desc,
                    preview: res.data?.[0].preview,
                    platform: res.data?.[0].platform,
                    primary_link: res.data?.[0].primary_link,
                    primary_text: res.data?.[0].primary_text,
                    secondary_text: res.data?.[0].secondary_text,
                    secondary_link: res.data?.[0].secondary_link,
                    password_protection: res.data?.[0].password_protection,
                    elements: res.data?.[0].elements,
                    brand: res.data?.[0].brand?.[0],
                    endCTAlink: res.data?.[0]?.endCTAlink,
                    endCTAtitle: res.data?.[0]?.endCTAtitle,
                    endCTAtext: res.data?.[0]?.endCTAtext,
                });
                setInteractiveElements(res.data?.[0].elements);
                getBrandKit(res.data?.[0]?.user_id).then((res) => {
                    if (res?.[0]) {
                        setBrandKit(res?.[0]);
                    }
                });
            });
    }, []);

    const setVideoAnalytics = useCallback(async () => {
        const view = localStorage.getItem("page_view") || false;
        //create another localstroage item called view_count and increment it when user come to the page
        const view_count = localStorage.getItem("page_view_count") || 1;

        if (view) {
            localStorage.setItem(
                "page_view_count",
                (Number(view_count) + 1).toString(),
            );
            await supabase
                .from("analytics")
                .update([
                    {
                        data: {
                            user_agent: navigator.userAgent,
                            count: Number(view_count) + 1,
                            name: videoRest.name,
                        },
                    },
                ])
                .eq("anoyomous_id", view)
                .eq("event", "page_view");
        } else {
            localStorage.setItem("page_view_count", "1");
            await supabase
                .from("analytics")
                .insert([
                    {
                        video_id: router.query.id,
                        event: "page_view",
                        data: {
                            user_agent: navigator.userAgent,
                            count: view_count,
                            name: videoRest.name,
                        },
                    },
                ])
                .select("anoyomous_id")
                .then((res) => {
                    localStorage.setItem("page_view", res.data[0].anoyomous_id);
                });
        }
    }, [router.query]);

    useEffect(() => {
        getVideoByID();
    }, [router.query]);

    useEffect(() => {
        setVideoAnalytics();
    }, [router.query, videoRest.name]);
    return (
        <>
            <Head>
                <title>{videoData.title ?? "Videco"}</title>
                <meta name="description" content={videoData.desc ?? "Videco"} />
                <meta
                    property="og:title"
                    content={videoData.title ?? "Videco"}
                />
                <meta
                    property="og:image"
                    content={`https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${videoData.url
                        .split("/")
                        .pop()
                        .replace(".m3u8", ".gif")
                        .replace(".mp4", ".gif")}`}
                />
            </Head>
            {!router.query.method && (
                <Box bg="#FCFCFC" py={4}>
                    <Box
                        maxW="5xl"
                        m="0 auto"
                        px={["16px", "10px", "70px"]}
                        display="flex"
                        justifyContent="space-between"
                    >
                        <Image width={28} src="/logo.svg" alt="videco" />
                        <Text
                            fontSize="sm"
                            textAlign="center"
                            as="span"
                            ml={2}
                            display="flex"
                            alignItems="center"
                        >
                            Hosted with Videco.{" "}
                            <Link
                                href="https://app.videco.io"
                                textDecor="underline"
                                mx={1}
                            >
                                Sign up for free
                            </Link>
                            <FiArrowRight />
                        </Text>
                    </Box>
                </Box>
            )}
            <Box
                height="full"
                w="full"
                display="flex"
                alignItems={!router.query.method ? "center" : "flex-start"}
                flexDirection="column"
                textAlign="center"
                m={!router.query.method ? "21px auto" : 0}
            >
                <>
                    <Modal
                        closeOnOverlayClick={false}
                        isOpen={
                            videoRest.password_protection === password ||
                            videoRest.password_protection === "false" ||
                            videoRest.password_protection === null
                                ? false
                                : true
                        }
                        onClose={onClose}
                        size="3xl"
                    >
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>
                                This video is password protected
                            </ModalHeader>
                            <ModalBody pb={6}>
                                <FormControl>
                                    <FormLabel>Enter the password</FormLabel>
                                    <Input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Password"
                                    />
                                </FormControl>
                            </ModalBody>

                            <ModalFooter>
                                <Button
                                    colorScheme="green"
                                    mr={3}
                                    onClick={() => {
                                        setPassword(input);
                                    }}
                                >
                                    Watch
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </>
                {videoUrl ? (
                    <Box w="full" h="100%" bg="transparent">
                        {!!videoData.title && !router.query.method && (
                            <>
                                <Text
                                    textAlign="center"
                                    as="h2"
                                    fontSize="3xl"
                                    mt="4"
                                    mb="4"
                                    fontWeight="semibold"
                                >
                                    {personalizedContent(videoData.title)}
                                </Text>
                            </>
                        )}
                        {!!videoRest.name && !router.query.method ? (
                            <iframe
                                src={`/embed/player/${router.query.id}?ai=${
                                    router.query.ai ?? ""
                                }&ai_email=${router.query.ai_email ?? ""}`}
                                style={{
                                    width: "100%",
                                    overflow: "hidden",
                                    height: "auto",
                                    padding: "20px",
                                    margin: "0 auto",
                                    maxWidth: "900px",
                                    minHeight: isLargerThan800
                                        ? "450px"
                                        : "300px",
                                    border: "none",
                                }}
                            />
                        ) : (
                            <iframe
                                src={`/embed/player/${router.query.id}?ai=${
                                    router.query.ai ?? ""
                                }&ai_email=${router.query.ai_email ?? ""}`}
                                style={{
                                    width: "100%",
                                    overflow: "hidden",
                                    height: "100%",
                                    padding: "0",
                                    minHeight: "100%",
                                    border: "none",
                                }}
                            />
                        )}
                        {!!videoRest.name && !router.query.method && (
                            <Box maxW="900px" margin="0 auto" px={3}>
                                <Text
                                    textAlign="left"
                                    as="h2"
                                    margin="0 auto"
                                    pl={4}
                                    pr={0}
                                    fontSize="md"
                                    mt="4"
                                >
                                    {personalizedContent(videoRest.desc)}
                                </Text>
                                <Stack
                                    direction="row"
                                    spacing={4}
                                    pr={2}
                                    w="full"
                                    pb={"100px"}
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mt={5}
                                >
                                    <Button
                                        colorScheme="teal"
                                        bg={brandKit.primary_color}
                                        color={brandKit.primary_text_color}
                                        rightIcon={<ArrowForwardIcon />}
                                        p={3}
                                        px="6"
                                        ml={4}
                                        variant="solid"
                                        onClick={() =>
                                            window.open(
                                                videoRest.primary_link ??
                                                    "https://videco.io",
                                            )
                                        }
                                    >
                                        {videoRest.primary_text ??
                                            "Primary button"}
                                    </Button>
                                    <Button
                                        p={6}
                                        pr={2}
                                        colorScheme="green"
                                        color={brandKit.secondary_text_color}
                                        variant="gohst"
                                        onClick={() =>
                                            window.open(
                                                videoRest.secondary_link ??
                                                    "https://videco.io",
                                            )
                                        }
                                    >
                                        {videoRest.secondary_text ??
                                            "Visit Videco"}
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box
                        textAlign="center"
                        pt="12"
                        justifyContent="center"
                        w="full"
                        margin="0 auto"
                    >
                        <Spinner color="green.500" />
                    </Box>
                )}
            </Box>
        </>
    );
};

export default Edit;

export async function getServerSideProps({ params }) {
    const supabase = createClientComponentClient();
    const data = await supabase
        .from("videos")
        .select(
            "url, name, desc, elements, endCTAlink, endCTAtitle, endCTAtext, brand, preview, password_protection, primary_link, primary_text, secondary_text, secondary_link, platform, user_id",
        )
        .match({ id: params.id });

    const videoData = {
        title: data.data[0].name,
        url: data.data[0].url,
        desc: data.data[0].desc,
    };

    return {
        props: {
            videoData, // Pass fetched data as props
        },
    };
}
