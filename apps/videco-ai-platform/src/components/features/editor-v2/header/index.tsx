import {
    Stack,
    Button,
    Input,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    Text,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    useDisclosure,
    Heading,
    useBoolean,
    useToast,
    Skeleton,
    Box,
    Flex,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    useEditableControls,
    ButtonGroup,
    IconButton,
    Editable,
    EditableInput,
    EditablePreview,
} from "@chakra-ui/react";
import Select from "react-select";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { useRouter } from "next/router";
import { rem } from "polished";
import React, { useEffect, useState } from "react";
import { FaMagic } from "react-icons/fa";
import {
    FiArrowLeft,
    FiCheck,
    FiCopy,
    FiEdit2,
    FiFacebook,
    FiLinkedin,
    FiPieChart,
    FiX,
} from "react-icons/fi";
import { useEditorStore } from "src/store/editor";
import {
    emailProvidersList,
    getEmailEmbedCode,
} from "src/utils/getEmailEmbedCode";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

type HeaderProps = {
    activeItem: "page" | "editor" | "aivideos" | "insights";
    campaignName?: string;
    setCampaignName?: any;
};
export const Header: React.FC<HeaderProps> = ({
    activeItem,
    campaignName,
    setCampaignName,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const chatBotModal = useDisclosure();

    const [published, setPublished] = useBoolean();
    const [shareData, setShareData] = useState<any>();
    const [saving, setSaving] = useState<boolean>(false);
    const [imageLoading, setImageLoading] = useState<boolean>(true);
    const [emailProvider, setEmailProvider] = useState<any>();
    const [creatingPreview, setCreatingPreview] = useState<boolean>(false);
    const { meta, setVideoMeta } = useEditorStore();
    const toast = useToast();
    const supabase = createClientComponentClient();
    const router = useRouter();
    const embedCodeRef = React.useRef();

    const onImageLoad = () => {
        setImageLoading(false);
    };

    const updatePreview = async (playback_id) => {
        try {
            await supabase
                .from("videos")
                .update({
                    playback_id: playback_id,
                })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    setTimeout(() => {
                        setCreatingPreview(false);
                        setShareData(res.data?.[0]);
                    }, 6000);
                });
        } catch (error) {
            setCreatingPreview(false);
            toast({
                title: "Something went wrong.",
                description:
                    "Something went wronge while creating the preview GIF. Please cotnact our support team.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
        setPublished.on();
    };
    const updateCampaignName = async (name: string) => {
        const { error, data } = await supabase
            .from("videos")
            .update({
                campaign_name: name,
            })
            .eq("id", router.query.id);
        if (error) throw error;
    };
    function EditableControls() {
        const {
            isEditing,
            getSubmitButtonProps,
            getCancelButtonProps,
            getEditButtonProps,
        } = useEditableControls();

        return isEditing ? (
            <>
                <ButtonGroup
                    justifyContent="center"
                    size="sm"
                    ml={2}
                    pos="relative"
                >
                    <IconButton
                        aria-label="Check"
                        icon={<CheckIcon />}
                        {...getSubmitButtonProps()}
                    />
                    <IconButton
                        aria-label="close"
                        icon={<CloseIcon />}
                        {...getCancelButtonProps()}
                    />
                </ButtonGroup>
            </>
        ) : (
            <Flex justifyContent="center" ml={2}>
                <IconButton
                    size="sm"
                    aria-label="edit"
                    bg="transparent"
                    icon={<FiEdit2 />}
                    {...getEditButtonProps()}
                />
            </Flex>
        );
    }
    const publishVideo = async () => {
        setSaving(true);
        try {
            await supabase
                .from("videos")
                .update({
                    embed_code: `<iframe src='https://app.videco.io/embed/${router.query.id}?method=embed' width='560' height='315' frameborder='0' allowfullscreen></iframe>`,
                    final_url: `https://app.videco.io/embed/${router.query.id}`,
                })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    setShareData(res.data?.[0]);
                });
            setSaving(false);
        } catch (error) {
            setSaving(false);
            toast({
                title: "Something went wrong.",
                description:
                    "Something went wronge while saving your video. Please cotnact our support team.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
        setPublished.on();
    };

    const updateBranding = async () => {
        setSaving(true);
        try {
            await supabase
                .from("videos")
                .update({
                    name: meta.title,
                    desc: meta.desc,
                    primary_link: meta.primary_link,
                    primary_text: meta.primary_text,
                    secondary_text: meta.secondary_text,
                    secondary_link: meta.secondary_link,
                    password_protection: meta.password_protection,
                    remove_logo: meta.remove_logo,
                })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    setShareData(res.data?.[0]);
                });
            setSaving(false);
        } catch (error) {
            setSaving(false);
            toast({
                title: "Something went wrong.",
                description:
                    "Something went wronge while saving your video. Please cotnact our support team.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
    };

    const onOpenShare = () => {
        if (!published) {
            publishVideo();
        }
        onOpen();
    };

    useEffect(() => {
        updateBranding();
    }, [meta]);
    return (
        <Stack
            pos="absolute"
            top={0}
            zIndex={4}
            right={0}
            w="full"
            mb={12}
            pt={2}
            bg="white"
            justifyContent="space-between"
            direction="row"
            spacing={4}
            py={3}
            px={6}
            boxShadow="md"
        >
            <Box display="flex" flexDir="column" alignItems="flex-start">
                {shareData?.type === "Personalized Campaign" && (
                    <Text>
                        {campaignName ? (
                            <Editable
                                textAlign="center"
                                defaultValue={campaignName}
                                fontSize="20"
                                isPreviewFocusable={false}
                                display="flex"
                                alignItems={"center"}
                                onSubmit={(value) => {
                                    updateCampaignName(value);
                                    setCampaignName(value);
                                }}
                                pos="relative"
                            >
                                <EditablePreview />
                                {/* Here is the custom input */}
                                <Input as={EditableInput} />
                                <EditableControls />
                            </Editable>
                        ) : (
                            <Editable
                                textAlign="center"
                                defaultValue={campaignName}
                                fontSize="20"
                                isPreviewFocusable={false}
                                display="flex"
                                alignItems={"center"}
                                onSubmit={(value) => {
                                    updateCampaignName(value);
                                    setCampaignName?.(value);
                                }}
                                pos="relative"
                            >
                                <EditablePreview />
                                {/* Here is the custom input */}
                                <Input as={EditableInput} />
                                <EditableControls />
                            </Editable>
                        )}
                    </Text>
                )}
                {activeItem !== "editor" && (
                    <Link
                        href={
                            router.query.clone === "true"
                                ? "/clones"
                                : router.query.campaign === "true"
                                ? "/campaign"
                                : "/videos"
                        }
                        display="flex"
                        color="#9C9F9F"
                        justifyContent="center"
                        fontSize="14px"
                        alignItems="center"
                    >
                        <FiArrowLeft
                            style={{
                                marginRight: "3px",
                            }}
                        />
                        Dashboard
                    </Link>
                )}
            </Box>
            <Box>
                <Modal
                    isOpen={chatBotModal.isOpen}
                    size="lg"
                    onClose={chatBotModal.onClose}
                >
                    <ModalOverlay />
                    <ModalContent minH="600">
                        <ModalCloseButton />
                        <ModalBody>
                            <Box pos="absolute" bottom={0} w="full" h="full">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://static.chatbotkit.com/integrations/widget/clwgut7px3lsvvslad3c7tw8m/frame"
                                ></iframe>
                            </Box>
                        </ModalBody>
                    </ModalContent>
                </Modal>
                {activeItem === "editor" ? (
                    <>
                        {" "}
                        <Button
                            colorScheme="brand"
                            bg="#05405A"
                            fontWeight="500"
                            _hover={{
                                bg: "#05405A",
                                color: "white",
                            }}
                            m={0}
                            bottom={0}
                            alignItems="center"
                            display="flex"
                            onClick={() =>
                                router.push(
                                    `?preview=true&id=${router.query.id}`,
                                )
                            }
                        >
                            <FiArrowLeft
                                style={{
                                    marginRight: "5px",
                                }}
                            />
                            Back to landing page
                        </Button>
                    </>
                ) : (
                    <Box mt={2}>
                        {shareData?.type === "Personalized Campaign" && (
                            <Button
                                colorScheme="brand"
                                bg="transparent"
                                border="0"
                                cursor="not-allowed"
                                fontSize={rem(16)}
                                color="#588B8E"
                                fontWeight="400"
                                rounded="full"
                            >
                                <Text
                                    bg="#588B8E"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    fontSize="22px"
                                    p={"3px"}
                                    rounded="full"
                                    color="white"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    <FiCheck />
                                </Text>
                                Prepare files
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            colorScheme="brand"
                            fontSize={rem(16)}
                            ml={2}
                            fontWeight="400"
                            border={0}
                            onClick={() =>
                                router.push(
                                    `?id=${
                                        router.query.id
                                    }&preview=true&clone=${
                                        router.query.clone === "true"
                                            ? "true"
                                            : "false"
                                    }`,
                                )
                            }
                            bg={
                                activeItem === "aivideos"
                                    ? "transparent"
                                    : activeItem === "page"
                                    ? "#05405A"
                                    : "transparent"
                            }
                            color={
                                activeItem === "aivideos"
                                    ? "#588B8E"
                                    : activeItem === "page"
                                    ? "white"
                                    : "#9C9F9F"
                            }
                            rounded="full"
                        >
                            {activeItem === "aivideos" ? (
                                <Text
                                    bg="#588B8E"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    fontSize="22px"
                                    p={"3px"}
                                    rounded="full"
                                    color="white"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    <FiCheck />
                                </Text>
                            ) : (
                                <Text
                                    bg={
                                        activeItem === "page"
                                            ? "white"
                                            : "#9C9F9F"
                                    }
                                    color={
                                        activeItem === "page"
                                            ? "black"
                                            : "white"
                                    }
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    p={
                                        shareData?.type ===
                                        "Personalized Campaign"
                                            ? 2
                                            : 1
                                    }
                                    fontSize="12px"
                                    rounded="full"
                                    width="20px"
                                    mr="2"
                                    height="20px"
                                >
                                    {shareData?.type ===
                                    "Personalized Campaign" ? (
                                        2
                                    ) : (
                                        <FiCheck size={15} />
                                    )}
                                </Text>
                            )}
                            Landing page
                        </Button>

                        <Button
                            variant="outline"
                            fontSize={rem(16)}
                            colorScheme="brand"
                            ml={2}
                            border={0}
                            fontWeight="400"
                            bg={
                                activeItem === "aivideos"
                                    ? "#05405A"
                                    : "transparent"
                            }
                            color={
                                activeItem === "aivideos" ? "white" : "#9C9F9F"
                            }
                            rounded="full"
                            onClick={() =>
                                router.push(
                                    `?id=${
                                        router.query.id
                                    }&aivideos=true&clone=${
                                        router.query.clone === "true"
                                            ? "true"
                                            : "false"
                                    }&campaign=${
                                        router.query.campaign === "true"
                                            ? "true"
                                            : "false"
                                    }`,
                                )
                            }
                        >
                            <Text
                                bg={
                                    activeItem === "aivideos"
                                        ? "white"
                                        : "#9C9F9F"
                                }
                                color={
                                    activeItem === "aivideos"
                                        ? "black"
                                        : "white"
                                }
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                p={2}
                                fontSize="12px"
                                rounded="full"
                                width="20px"
                                mr="2"
                                height="20px"
                            >
                                3
                            </Text>
                            Share
                        </Button>
                        <Button
                            variant="outline"
                            fontSize={rem(16)}
                            colorScheme="brand"
                            ml={2}
                            border={0}
                            fontWeight="400"
                            bg={
                                activeItem === "insights"
                                    ? "#05405A"
                                    : "transparent"
                            }
                            color={
                                activeItem === "insights" ? "white" : "#9C9F9F"
                            }
                            rounded="full"
                            onClick={() =>
                                router.push(
                                    `?id=${
                                        router.query.id
                                    }&insights=true&aivideos=false&clone=${
                                        router.query.clone === "true"
                                            ? "true"
                                            : "false"
                                    }&campaign=${
                                        router.query.campaign === "true"
                                            ? "true"
                                            : "false"
                                    }`,
                                )
                            }
                        >
                            <Text
                                bg={
                                    activeItem === "insights"
                                        ? "white"
                                        : "#9C9F9F"
                                }
                                color={
                                    activeItem === "insights"
                                        ? "black"
                                        : "white"
                                }
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                // p={2}
                                fontSize="12px"
                                rounded="full"
                                width="20px"
                                mr="2"
                                height="20px"
                            >
                                <FiPieChart />
                            </Text>
                            Insights
                        </Button>
                    </Box>
                )}

                <Drawer
                    isOpen={isOpen}
                    size="sm"
                    placement="right"
                    onClose={onClose}
                    finalFocusRef={embedCodeRef}
                >
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader>
                            <Heading size="md">Share your video</Heading>
                        </DrawerHeader>
                        <DrawerBody>
                            <Box>
                                {imageLoading && <>Preview image is loading</>}
                                <>
                                    {shareData ? (
                                        <>
                                            <Image
                                                alt="Preview"
                                                height={230}
                                                width={400}
                                                src={
                                                    shareData.preview ??
                                                    `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_200,l_play-3-xxl_wefrsh/fl_layer_apply/c_scale,h_400,e_loop/dl_200,vs_30/${shareData.url
                                                        .split("/")
                                                        .pop()
                                                        .replace(
                                                            ".m3u8",
                                                            ".gif",
                                                        )
                                                        .replace(".mov", ".gif")
                                                        .replace(
                                                            ".mp4",
                                                            ".gif",
                                                        )}`
                                                }
                                                placeholder="blur"
                                                blurDataURL="https://videco.io/wp-content/uploads/2024/08/logotype-medium.png"
                                                style={{
                                                    borderRadius: "12px",
                                                }}
                                                onLoad={() => onImageLoad()}
                                                loading="lazy"
                                            />
                                        </>
                                    ) : (
                                        <Button
                                            colorScheme="teal"
                                            bg="#14213D"
                                            mb={2}
                                            isLoading={creatingPreview}
                                            onClick={() => {
                                                setCreatingPreview(true);
                                                axios
                                                    .post(
                                                        "/api/v1/videos/create-preview",
                                                        {
                                                            api_key:
                                                                process.env
                                                                    .MUX_API_KEY!,
                                                            aws_url:
                                                                shareData?.url,
                                                        },
                                                    )
                                                    .then((res) => {
                                                        updatePreview(
                                                            res.data.result.data
                                                                .playback_ids[0]
                                                                .id,
                                                        );
                                                    });
                                            }}
                                        >
                                            <FaMagic
                                                style={{
                                                    marginRight: "5px",
                                                }}
                                                color="#f0ca69"
                                            />
                                            Generate gif preview
                                        </Button>
                                    )}
                                </>
                            </Box>

                            {shareData?.type !== "Personalized Campaign" && (
                                <>
                                    <Text
                                        mt={6}
                                        fontSize="16px"
                                        fontWeight="semibold"
                                    >
                                        Video Page URL:
                                    </Text>
                                    {shareData ? (
                                        <Box display="flex">
                                            <Input
                                                mt={2}
                                                cursor="text"
                                                border="1px solid #ccc"
                                                p={4}
                                                rounded="2xl"
                                                borderStyle="dashed"
                                                onChange={() => null}
                                                value={shareData.final_url}
                                            />
                                            <Button
                                                mt={2}
                                                float="right"
                                                textDecoration="none"
                                                rightIcon={<FiCopy />}
                                                color="black"
                                                p={0}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        shareData.final_url,
                                                    );
                                                    toast({
                                                        title: "Url copied.",
                                                        description:
                                                            "You can now share the url with others",
                                                        status: "success",
                                                        duration: 1000,
                                                        isClosable: true,
                                                    });
                                                }}
                                                _hover={{
                                                    textDecoration: "none",
                                                    background: "transparent",
                                                    color: "#05405A",
                                                }}
                                                variant="ghost"
                                            />
                                        </Box>
                                    ) : (
                                        <Stack>
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                        </Stack>
                                    )}
                                    <Text
                                        mt={6}
                                        fontSize="16px"
                                        fontWeight="semibold"
                                    >
                                        Embed in Email
                                    </Text>
                                    {shareData ? (
                                        <>
                                            <Button
                                                mt={2}
                                                mb={4}
                                                leftIcon={<FiCopy />}
                                                onClick={() => {
                                                    const content = `
                                            <a href="${shareData.final_url}">
                                                <img src="${`https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_200,l_play-3-xxl_wefrsh/fl_layer_apply/c_scale,h_400,e_loop/dl_200,vs_30/${shareData.url
                                                    .split("/")
                                                    .pop()
                                                    .replace(".m3u8", ".gif")
                                                    .replace(".mov", ".gif")
                                                    .replace(".mp4", ".gif")
                                                    .replace(
                                                        ".mp4",
                                                        ".gif",
                                                    )}`}" alt="GIF Preview videco">
                                            </a>
                                        `;
                                                    const blob = new Blob(
                                                        [content],
                                                        {
                                                            type: "text/html",
                                                        },
                                                    );
                                                    const clipboardItem =
                                                        new ClipboardItem({
                                                            "text/html": blob,
                                                        });

                                                    navigator.clipboard.write([
                                                        clipboardItem,
                                                    ]);

                                                    toast({
                                                        title: "Email code copied.",
                                                        description:
                                                            "You can now paste the embed code into your email provider.",
                                                        status: "success",
                                                        duration: 1000,
                                                        isClosable: true,
                                                    });
                                                }}
                                                textDecoration="none"
                                                fontSize="16px"
                                                fontWeight="semibold"
                                                border="1px solid #055256"
                                                color="black"
                                                p={2}
                                                width="100%"
                                                float="right"
                                                colorScheme="twitter"
                                                variant="ghost"
                                            >
                                                Copy email code
                                            </Button>
                                        </>
                                    ) : (
                                        <Stack>
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                        </Stack>
                                    )}
                                    <Text fontSize="16px" fontWeight="semibold">
                                        Embed in Website
                                    </Text>
                                    {shareData ? (
                                        <>
                                            <Button
                                                mt={2}
                                                mb={6}
                                                leftIcon={<FiCopy />}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        `<iframe src='https://app.videco.io/embed/${router.query.id}?method=embed' width='560' height='315' frameborder='0' allowfullscreen></iframe>`,
                                                    );
                                                    toast({
                                                        title: "Embed code copied.",
                                                        description:
                                                            "You can now paste the embed code into your website.",
                                                        status: "success",
                                                        duration: 1000,
                                                        isClosable: true,
                                                    });
                                                }}
                                                textDecoration="none"
                                                fontSize="16px"
                                                fontWeight="semibold"
                                                border="1px solid #055256"
                                                color="black"
                                                p={2}
                                                width="100%"
                                                float="right"
                                                colorScheme="twitter"
                                                variant="ghost"
                                            >
                                                Copy website code
                                            </Button>
                                        </>
                                    ) : (
                                        <Stack>
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                        </Stack>
                                    )}
                                </>
                            )}
                            {shareData?.type === "Personalized Campaign" && (
                                <>
                                    <Text
                                        fontSize="16px"
                                        fontWeight="semibold"
                                        mt={12}
                                    >
                                        Personalized email embed
                                    </Text>
                                    {shareData ? (
                                        <>
                                            <Select
                                                placeholder="Select your email provider"
                                                options={emailProvidersList()}
                                                onChange={(e: {
                                                    value: string;
                                                }) => setEmailProvider(e)}
                                            />
                                            {emailProvider && (
                                                <>
                                                    <Button
                                                        mt={2}
                                                        mb={6}
                                                        leftIcon={<FiCopy />}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                getEmailEmbedCode(
                                                                    shareData.final_url,
                                                                    shareData.url,
                                                                    emailProvider.value,
                                                                ),
                                                            );
                                                            toast({
                                                                title: "Embed code copied.",
                                                                description:
                                                                    "You can now paste the embed code into your email provider.",
                                                                status: "success",
                                                                duration: 1000,
                                                                isClosable:
                                                                    true,
                                                            });
                                                        }}
                                                        textDecoration="none"
                                                        fontSize="16px"
                                                        fontWeight="semibold"
                                                        border="1px solid #055256"
                                                        color="black"
                                                        p={2}
                                                        width="100%"
                                                        float="right"
                                                        colorScheme="twitter"
                                                        variant="ghost"
                                                    >
                                                        Copy{" "}
                                                        {emailProvider.label}{" "}
                                                        code
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <Stack>
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                            <Skeleton height="20px" />
                                        </Stack>
                                    )}
                                </>
                            )}

                            {shareData ? (
                                <Box
                                    display="flex"
                                    mt={24}
                                    justifyContent="center"
                                >
                                    <Button
                                        textDecoration="none"
                                        border="1px solid #055256"
                                        width={rem(50)}
                                        h={rem(50)}
                                        rounded="full"
                                        onClick={() => {
                                            window.open(
                                                `https://www.facebook.com/sharer/sharer.php?u=${shareData.final_url}`,
                                            );
                                        }}
                                        bg="#05405A"
                                        color={"#fff"}
                                        _hover={{
                                            color: "#000",
                                            background: "#fff",
                                        }}
                                    >
                                        <FiFacebook />
                                    </Button>

                                    <Button
                                        float="left"
                                        textDecoration="none"
                                        border="1px solid #055256"
                                        width={rem(50)}
                                        h={rem(50)}
                                        rounded="full"
                                        mx={6}
                                        color={"#fff"}
                                        _hover={{
                                            color: "#000",
                                            background: "#fff",
                                        }}
                                        p={2}
                                        onClick={() => {
                                            window.open(
                                                `https://twitter.com/intent/tweet?text=+Check+out+my+video+on+videco.io+${shareData.final_url}`,
                                            );
                                        }}
                                        bg="#05405A"
                                    >
                                        <FiX />
                                    </Button>
                                    <Button
                                        width={rem(50)}
                                        h={rem(50)}
                                        rounded="full"
                                        textDecoration="none"
                                        border="1px solid #055256"
                                        color={"#fff"}
                                        p={2}
                                        _hover={{
                                            color: "#000",
                                            background: "#fff",
                                        }}
                                        onClick={() => {
                                            window.open(
                                                `https://www.linkedin.com/shareArticle?mini=true&url=${shareData.final_url}`,
                                            );
                                        }}
                                        bg="#05405A"
                                        variant="solid"
                                    >
                                        <FiLinkedin />
                                    </Button>
                                </Box>
                            ) : (
                                <Stack>
                                    <Skeleton height="20px" />
                                    <Skeleton height="20px" />
                                    <Skeleton height="20px" />
                                </Stack>
                            )}
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </Box>
        </Stack>
    );
};
