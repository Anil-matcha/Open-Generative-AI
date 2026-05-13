import {
    CheckIcon,
    CloseIcon,
    ArrowForwardIcon,
    ChevronDownIcon,
} from "@chakra-ui/icons";
import {
    Box,
    Button,
    ButtonGroup,
    Editable,
    EditablePreview,
    EditableTextarea,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Progress,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import Pricing from "@components/common/pricing";
import { Player } from "@components/features/player";
import { useSession } from "@supabase/auth-helpers-react";
import { Formik, Form, Field } from "formik";
import { useRouter } from "next/router";
import { rem } from "polished";
import { useEffect, useRef, useState } from "react";
import {
    FiArrowRight,
    FiEdit2,
    FiEyeOff,
    FiFlag,
    FiImage,
    FiInfo,
    FiLink,
    FiRepeat,
} from "react-icons/fi";
import { useBrandKit } from "src/hooks/getBrandKit";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useEditorStore } from "src/store/editor";
import ThemeSidebar from "../theme-siderbar";
import { PlayerSettings } from "./player-settings";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";

type PagePreviewProps = {
    videoUrl: string;
    mediaStatus?: string;
};
export const PagePreview: React.FC<PagePreviewProps> = ({
    videoUrl,
    mediaStatus,
}) => {
    const router = useRouter();
    const { meta, setVideoMeta, setVideo, interactiveElements } =
        useEditorStore();
    const playerRef = useRef(null);
    const { getBrandKit } = useBrandKit();
    const supabase = createClientComponentClient();
    const [duration, setDuration] = useState(0);
    const [latestMediaStatus, setLatestMediaStatus] = useState(mediaStatus);
    const [latestUrl, setLatestUrl] = useState(videoUrl);
    const [isEditing, setIsEditing] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [brandKit, setBrandKit] = useState({
        primary_color: "#05405A",
        secondary_color: "#1A202C",
        primary_text_color: "#ffffff",
        secondary_text_color: "#ffffff",
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [settingsModalType, setSettingsModalType] = useState<
        "cta" | "branding" | "preview" | "none" | "password"
    >("none");
    const { isOpen, onClose, onOpen } = useDisclosure();
    const secondaryButton = useDisclosure();
    const session = useSession();
    const [showPricing, setShowPricing] = useState<any>(false);
    const user = session?.user;
    const { getPlan } = useUserPlan();
    const [plan, setPlan] = useState<any>();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
        getBrandKit(user?.id).then((res) => {
            if (res?.[0]) {
                setBrandKit(res?.[0]);
            }
        });
    }, []);

    useEffect(() => {
        if (router.query.clone === "true" && mediaStatus === "in_progress") {
            const interval = setInterval(async () => {
                try {
                    const response = await axios.post(
                        "/api/v1/videos/get-clone",
                        {
                            id: router.query.id,
                        },
                    );
                    if (response.data?.url) {
                        setLatestUrl(response.data.url);
                        setLatestMediaStatus("ready");
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error("Error fetching clone status:", error);
                }
            }, 5000);

            return () => clearInterval(interval);
        }
    }, []);

    function validatePrimaryButton(value) {
        let error;
        if (!value) {
            error = "This is required";
        }
        return error;
    }

    function EditableControls() {
        return isEditing ? (
            <>
                <Formik
                    initialValues={{
                        title: meta.title,
                    }}
                    onSubmit={async (values) => {
                        // set global state
                        setVideoMeta({
                            ...meta,
                            title: values.title,
                        });
                        setIsEditing(false);
                    }}
                >
                    {({
                        handleChange,
                        handleSubmit,
                        values,
                        setFieldValue,
                    }) => (
                        <Form
                            onSubmit={handleSubmit}
                            style={{
                                display: "flex",
                                position: "relative",
                                alignItems: "center",
                            }}
                        >
                            <Input
                                name="title"
                                type="text"
                                onChange={handleChange}
                                value={values.title}
                                placeholder="Title of the video"
                            />
                            <ButtonGroup
                                justifyContent="center"
                                size="sm"
                                ml={2}
                                pos="relative"
                            >
                                <IconButton
                                    aria-label="Check"
                                    onClick={() => handleSubmit()}
                                    icon={<CheckIcon />}
                                />
                                <IconButton
                                    aria-label="close"
                                    icon={<CloseIcon />}
                                    onClick={() => handleSubmit()}
                                />
                            </ButtonGroup>
                            <Box
                                pos="absolute"
                                bottom={"-32px"}
                                fontSize="11px"
                                rounded="md"
                                left={-2}
                                px={3}
                                color="white"
                            >
                                <Menu>
                                    <MenuButton
                                        as={Button}
                                        variant="secondary"
                                        color="#05405A"
                                        fontSize="sm"
                                        rightIcon={<ChevronDownIcon />}
                                        _hover={{
                                            bg: "transparent",
                                        }}
                                        p={0}
                                        m={0}
                                        bg="transparent"
                                    >
                                        Personalize
                                    </MenuButton>
                                    <MenuList p={0} mt={-4}>
                                        <MenuItem
                                            color="black"
                                            onClick={() =>
                                                setFieldValue(
                                                    "title",
                                                    `${values.title} |FNAME|`,
                                                )
                                            }
                                            fontSize="15px"
                                        >
                                            First Name
                                        </MenuItem>
                                        <MenuItem
                                            color="black"
                                            fontSize="15px"
                                            onClick={() =>
                                                setFieldValue(
                                                    "title",
                                                    `${values.title} |LNAME|`,
                                                )
                                            }
                                        >
                                            Last Name
                                        </MenuItem>
                                    </MenuList>
                                </Menu>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </>
        ) : (
            <Flex justifyContent="center" ml={2}>
                <IconButton
                    size="sm"
                    aria-label="edit"
                    bg="transparent"
                    icon={<FiEdit2 />}
                    onClick={() => setIsEditing(true)}
                />
            </Flex>
        );
    }

    return (
        <Box
            bg="#ffffff"
            height="full"
            overflow="auto"
            mt={0}
            pt={90}
            display="flex"
            flexDir="column"
            alignItems="center"
        >
            {showPricing && (
                <Pricing hidePiricng={() => setShowPricing(false)} />
            )}
            <PlayerSettings
                isModalOpen={isModalOpen}
                type={settingsModalType}
            />
            <Text
                textAlign="center"
                fontSize={rem(32)}
                fontWeight="semibold"
                display="flex"
                as="span"
                onClick={() => setIsEditing(true)}
                id="title-edit"
                alignItems="center"
            >
                {!isEditing && meta.title}
                <EditableControls />
            </Text>
            <Box
                w="full"
                maxW="800px"
                h="full"
                maxH="400px"
                bg="transparent"
                mt={6}
            >
                <Box w="full" h="full" display="flex" pos="relative">
                    <Box position="absolute" left={-8} top={8} id="theme-edit">
                        <ThemeSidebar />
                    </Box>
                    <Box
                        justifyContent="flex-start"
                        display="flex"
                        mt={1}
                        height={"100%"}
                        width={"100%"}
                        flexDirection="column"
                    >
                        {router.query.clone === "true" &&
                        latestMediaStatus === "in_progress" ? (
                            <Box
                                display="flex"
                                p={12}
                                mt={20}
                                color="#383F40"
                                bg="gray.100"
                                rounded="md"
                                textAlign="center"
                                flexDir="column"
                                maxW="lg"
                                m="auto"
                                alignItems="center"
                            >
                                Please wait.. Your AI clone is in progress. You
                                can leave this page and check again later or
                                wait in this page
                                <Progress
                                    size="lg"
                                    height={1}
                                    mt={4}
                                    colorScheme="green"
                                    rounded="md"
                                    w="sm"
                                    isIndeterminate
                                />
                            </Box>
                        ) : (
                            <Player
                                platform={meta?.platform}
                                elements={interactiveElements}
                                videoUrl={latestUrl}
                                width="100%"
                                embeded={true}
                                isEditor={true}
                                endCTA={
                                    {
                                        link: meta.endCTAlink,
                                        title: meta.endCTAtitle,
                                        text: meta.endCTAtext,
                                    } as any
                                }
                                preview={
                                    videoUrl &&
                                    !videoUrl.includes("videco.s3.") &&
                                    !videoUrl.includes("youtube")
                                        ? `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${videoUrl
                                              .split("/")
                                              .pop()
                                              .replace(".mp4", ".gif")
                                              .replace(".mov", ".gif")
                                              .replace(".m3u8", ".gif")
                                              .replace(".webm", ".gif")}`
                                        : "/default_thumb.png"
                                }
                                playerRef={playerRef}
                                videcoBrandingRemoved={
                                    meta.remove_logo ?? false
                                }
                                playing={playing}
                                setDuration={setDuration}
                                setPlaying={setPlaying}
                                setVideo={setVideo}
                            />
                        )}
                    </Box>
                    <Box pos="absolute" right="-88px" id="player-edit">
                        <Box display="flex" flexDir="column">
                            <Button
                                onClick={() => {
                                    if (plan === "free" || plan === undefined) {
                                        setShowPricing(true);
                                    } else {
                                        setIsModalOpen(!isModalOpen);
                                        setSettingsModalType("preview");
                                    }
                                }}
                                mt={4}
                                _hover={{
                                    bg: "transparent",
                                }}
                                bg="transparent"
                                display="flex"
                                flexDir="column"
                            >
                                <Box
                                    bg={"#e8eef0"}
                                    boxShadow="1px 1px 4px  #959595"
                                    width="40px"
                                    height={12}
                                    p={3}
                                    display="flex"
                                    alignItems="center"
                                    mb={2}
                                    justifyContent="center"
                                    rounded="full"
                                >
                                    <FiImage />
                                </Box>
                                <Text
                                    fontWeight={400}
                                    fontSize="12px"
                                    color="#9C9F9F"
                                >
                                    Thumbnail
                                </Text>
                            </Button>
                            <Button
                                onClick={() => {
                                    if (plan === "free" || plan === undefined) {
                                        setShowPricing(true);
                                    } else {
                                        router.push(
                                            `?id=${router.query.id}&interactive=true`,
                                        );
                                    }
                                }}
                                _hover={{
                                    bg: "transparent",
                                }}
                                bg="transparent"
                                display="flex"
                                mt={10}
                                flexDir="column"
                            >
                                <Box
                                    bg={"#e8eef0"}
                                    boxShadow="1px 1px 4px  #959595"
                                    width="40px"
                                    height={12}
                                    p={3}
                                    display="flex"
                                    alignItems="center"
                                    mb={2}
                                    justifyContent="center"
                                    rounded="full"
                                >
                                    <FiLink />
                                </Box>
                                <Text
                                    fontWeight={400}
                                    fontSize="12px"
                                    color="#9C9F9F"
                                >
                                    Interactive
                                </Text>
                            </Button>
                            <Button
                                onClick={() => {
                                    if (plan === "free" || plan === undefined) {
                                        setShowPricing(true);
                                    } else {
                                        setIsModalOpen(!isModalOpen);
                                        setSettingsModalType("password");
                                    }
                                }}
                                _hover={{
                                    bg: "transparent",
                                }}
                                bg="transparent"
                                display="flex"
                                mt={10}
                                flexDir="column"
                            >
                                <Box
                                    bg={"#e8eef0"}
                                    boxShadow="1px 1px 4px  #959595"
                                    width="40px"
                                    height={12}
                                    p={3}
                                    display="flex"
                                    alignItems="center"
                                    mb={2}
                                    justifyContent="center"
                                    rounded="full"
                                >
                                    <FiEyeOff />
                                </Box>
                                <Text
                                    fontWeight={400}
                                    fontSize="12px"
                                    color="#9C9F9F"
                                >
                                    Password
                                </Text>
                            </Button>
                            <Button
                                onClick={() => {
                                    if (plan === "free" || plan === undefined) {
                                        setShowPricing(true);
                                    } else {
                                        setIsModalOpen(!isModalOpen);
                                        setSettingsModalType("cta");
                                    }
                                }}
                                _hover={{
                                    bg: "transparent",
                                }}
                                bg="transparent"
                                display="flex"
                                flexDir="column"
                                mt={10}
                            >
                                {" "}
                                <Box
                                    bg={"#e8eef0"}
                                    boxShadow="1px 1px 4px  #959595"
                                    width="40px"
                                    height={12}
                                    p={3}
                                    display="flex"
                                    alignItems="center"
                                    mb={2}
                                    justifyContent="center"
                                    rounded="full"
                                >
                                    <FiRepeat />
                                </Box>
                                <Text
                                    fontWeight={400}
                                    fontSize="12px"
                                    color="#9C9F9F"
                                >
                                    End CTA
                                </Text>
                            </Button>

                            <Button
                                onClick={() => {
                                    if (plan === "free" || plan === undefined) {
                                        setShowPricing(true);
                                    } else {
                                        setIsModalOpen(!isModalOpen);
                                        setSettingsModalType("branding");
                                    }
                                }}
                                mt={10}
                                _hover={{
                                    bg: "transparent",
                                }}
                                bg="transparent"
                                display="flex"
                                flexDir="column"
                            >
                                <Box
                                    bg={"#e8eef0"}
                                    boxShadow="1px 1px 4px  #959595"
                                    width="40px"
                                    height={12}
                                    p={3}
                                    display="flex"
                                    alignItems="center"
                                    mb={2}
                                    justifyContent="center"
                                    rounded="full"
                                >
                                    <FiFlag />
                                </Box>
                                <Text
                                    fontWeight={400}
                                    fontSize="12px"
                                    color="#9C9F9F"
                                >
                                    Branding
                                </Text>
                            </Button>
                        </Box>
                    </Box>
                </Box>
                <Editable
                    minH={132}
                    border="1px solid #E2E8F0"
                    rounded="2xl"
                    mt={4}
                    onSubmit={(value) =>
                        setVideoMeta({
                            ...meta,
                            desc: value,
                        })
                    }
                    p={4}
                    defaultValue={
                        meta.desc ?? "Type here to add a video description..."
                    }
                    pb={16}
                >
                    <EditablePreview />
                    <EditableTextarea />
                </Editable>
                <Stack
                    direction="row"
                    spacing={4}
                    w="full"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={rem(-56)}
                >
                    <Box display="flex" alignItems="center" position="relative">
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
                                    meta.primary_link ??
                                        "https://www.videco.io",
                                )
                            }
                        >
                            {meta.primary_text ?? "Primary button"}
                        </Button>
                        <Popover
                            defaultIsOpen={false}
                            trigger="click"
                            isOpen={isOpen}
                            onClose={onClose}
                            onOpen={onOpen}
                            closeOnBlur={true}
                            placement="bottom-end"
                            strategy="absolute"
                        >
                            <PopoverContent
                                bg="#fcfcfc"
                                zIndex={900}
                                rounded="md"
                                color="black"
                                border="1px solid #E2E8F0"
                                height="full"
                                overflowY="auto"
                            >
                                <PopoverCloseButton />

                                <PopoverArrow bg="#000000" />
                                <PopoverBody
                                    rounded="md"
                                    pb={2}
                                    opacity={1}
                                    bg="#ffffff"
                                >
                                    <Text fontWeight="bold">
                                        Edit Primary Button
                                    </Text>
                                    <Formik
                                        initialValues={{
                                            text:
                                                meta.primary_text ??
                                                "Primary button",
                                            link: meta.primary_link,
                                        }}
                                        onSubmit={(values, actions) => {
                                            setTimeout(() => {
                                                setVideoMeta({
                                                    ...meta,
                                                    primary_link: values.link,
                                                    primary_text: values.text,
                                                });
                                                actions.setSubmitting(false);
                                                onClose();
                                            }, 1000);
                                        }}
                                    >
                                        {(props) => (
                                            <Form>
                                                <Field
                                                    name="text"
                                                    validate={
                                                        validatePrimaryButton
                                                    }
                                                >
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={
                                                                form.errors
                                                                    .text &&
                                                                form.touched
                                                                    .text
                                                            }
                                                        >
                                                            <FormLabel
                                                                mt={3}
                                                                fontSize="small"
                                                            >
                                                                Button Text
                                                            </FormLabel>
                                                            <Input
                                                                {...field}
                                                                placeholder="Button Text"
                                                            />
                                                            <FormErrorMessage>
                                                                {
                                                                    form.errors
                                                                        .text
                                                                }
                                                            </FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Field
                                                    name="link"
                                                    validate={
                                                        validatePrimaryButton
                                                    }
                                                >
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={
                                                                form.errors
                                                                    .link &&
                                                                form.touched
                                                                    .link
                                                            }
                                                        >
                                                            <FormLabel
                                                                mt={3}
                                                                fontSize="small"
                                                            >
                                                                Button Link
                                                            </FormLabel>
                                                            <Input
                                                                {...field}
                                                                placeholder="https://www.videco.io"
                                                            />
                                                            <FormErrorMessage>
                                                                {
                                                                    form.errors
                                                                        .link
                                                                }
                                                            </FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Button
                                                    mt={4}
                                                    colorScheme="teal"
                                                    float="right"
                                                    color={
                                                        brandKit.secondary_text_color
                                                    }
                                                    isLoading={
                                                        props.isSubmitting
                                                    }
                                                    type="submit"
                                                >
                                                    Save
                                                </Button>
                                            </Form>
                                        )}
                                    </Formik>
                                </PopoverBody>
                            </PopoverContent>
                            <PopoverTrigger>
                                <FiEdit2
                                    style={{
                                        marginLeft: "12px",
                                        cursor: "pointer",
                                    }}
                                />
                            </PopoverTrigger>
                        </Popover>
                    </Box>
                    <Box display="flex" alignItems="center" position="relative">
                        <Button
                            p={6}
                            pr={2}
                            textDecor="underline"
                            colorScheme="green"
                            fontWeight={400}
                            color={brandKit.secondary_text_color ?? "black"}
                            variant="gohst"
                            onClick={() => window.open(meta.secondary_link)}
                        >
                            {meta.secondary_text ?? "Visit Videco"}
                        </Button>
                        <Popover
                            defaultIsOpen={false}
                            trigger="click"
                            isOpen={secondaryButton.isOpen}
                            onClose={secondaryButton.onClose}
                            onOpen={secondaryButton.onOpen}
                            closeOnBlur={true}
                            placement="bottom-end"
                            strategy="absolute"
                        >
                            <PopoverContent
                                bg="#fcfcfc"
                                zIndex={900}
                                rounded="md"
                                color="black"
                                border="1px solid #E2E8F0"
                                height="full"
                                overflowY="auto"
                            >
                                <PopoverCloseButton />

                                <PopoverArrow bg="#000000" />
                                <PopoverBody
                                    rounded="md"
                                    pb={2}
                                    opacity={1}
                                    bg="#ffffff"
                                >
                                    <Text fontWeight="bold">
                                        Edit Secondary Button
                                    </Text>
                                    <Formik
                                        initialValues={{
                                            text:
                                                meta.secondary_text ??
                                                "Read More",
                                            link: meta.secondary_link,
                                        }}
                                        onSubmit={(values, actions) => {
                                            setTimeout(() => {
                                                setVideoMeta({
                                                    ...meta,
                                                    secondary_link: values.link,
                                                    secondary_text: values.text,
                                                });
                                                actions.setSubmitting(false);
                                                secondaryButton.onClose();
                                            }, 1000);
                                        }}
                                    >
                                        {(props) => (
                                            <Form>
                                                <Field
                                                    name="text"
                                                    validate={
                                                        validatePrimaryButton
                                                    }
                                                >
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={
                                                                form.errors
                                                                    .text &&
                                                                form.touched
                                                                    .text
                                                            }
                                                        >
                                                            <FormLabel
                                                                mt={3}
                                                                fontSize="small"
                                                            >
                                                                Button Text
                                                            </FormLabel>
                                                            <Input
                                                                {...field}
                                                                placeholder="Button Text"
                                                            />
                                                            <FormErrorMessage>
                                                                {
                                                                    form.errors
                                                                        .text
                                                                }
                                                            </FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Field
                                                    name="link"
                                                    validate={
                                                        validatePrimaryButton
                                                    }
                                                >
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={
                                                                form.errors
                                                                    .link &&
                                                                form.touched
                                                                    .link
                                                            }
                                                        >
                                                            <FormLabel
                                                                mt={3}
                                                                fontSize="small"
                                                            >
                                                                Button Link
                                                            </FormLabel>
                                                            <Input
                                                                {...field}
                                                                placeholder="https://www.videco.io"
                                                            />
                                                            <FormErrorMessage>
                                                                {
                                                                    form.errors
                                                                        .link
                                                                }
                                                            </FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Button
                                                    mt={4}
                                                    float="right"
                                                    colorScheme="teal"
                                                    isLoading={
                                                        props.isSubmitting
                                                    }
                                                    type="submit"
                                                >
                                                    Save
                                                </Button>
                                            </Form>
                                        )}
                                    </Formik>
                                </PopoverBody>
                            </PopoverContent>
                            <PopoverTrigger>
                                <FiEdit2
                                    style={{
                                        marginRight: "12px",
                                        cursor: "pointer",
                                    }}
                                />
                            </PopoverTrigger>
                        </Popover>
                    </Box>
                </Stack>
            </Box>
            <Button
                bg="white"
                border="1px solid #05405A"
                color="#05405A"
                fontWeight="500"
                _hover={{
                    bg: "#05405A",
                    color: "white",
                }}
                py={6}
                width="400px"
                margin="18px auto"
                bottom={0}
                pos="absolute"
                alignItems="center"
                display="flex"
                onClick={() =>
                    router.push(`?aivideos=true&id=${router.query.id}`)
                }
            >
                Next step{" "}
                <FiArrowRight
                    style={{
                        marginLeft: "5px",
                    }}
                />
            </Button>
        </Box>
    );
};
