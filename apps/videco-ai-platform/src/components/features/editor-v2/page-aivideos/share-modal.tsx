import {
    Modal,
    Text,
    ModalContent,
    Input,
    Button,
    useDisclosure,
    Box,
    Flex,
    ListItem,
    OrderedList,
    Image,
    ModalOverlay,
    CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiShare2 } from "react-icons/fi";
import {
    emailProvidersList,
    getEmailEmbedCode,
} from "src/utils/getEmailEmbedCode";

const ShareModal = ({ videoId, ogURL }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [copied, setCopied] = useState(false);
    const [search, setSearch] = useState("");
    const [copiedProvider, setCopiedProvider] = useState(null);

    const handleCopy = (provider) => {
        const container = document.createElement("div");
        container.innerHTML = getEmailEmbedCode(
            `${process.env.NEXT_PUBLIC_SITE_URL}/embed/${videoId}`,
            `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${ogURL
                .split("/")
                .pop()
                .replace(".mp4", ".gif")
                .replace(".mov", ".gif")
                .replace(".m3u8", ".gif")
                .replace(".webm", ".gif")}`,
            provider.value,
        );

        if (provider.value === "brevo") {
            navigator.clipboard.writeText(
                getEmailEmbedCode(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/embed/${videoId}`,
                    `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/dl_200,vs_30/${ogURL
                        .split("/")
                        .pop()
                        .replace(".mp4", ".gif")
                        .replace(".mov", ".gif")
                        .replace(".m3u8", ".gif")
                        .replace(".webm", ".gif")}`,
                    provider.value,
                ),
            );
        } else {
            document.body.appendChild(container);

            // Copy the rendered content
            const range = document.createRange();
            range.selectNode(container);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("copy");

            // Cleanup
            document.body.removeChild(container);
            selection.removeAllRanges();
        }

        setCopiedProvider(provider.value);

        // Reset text back to "Copy code" after 2 seconds
        setTimeout(() => {
            setCopiedProvider(null);
        }, 9000);
    };

    const filteredProviders = emailProvidersList().filter((provider) =>
        provider.label.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <Box>
            <Button
                onClick={onOpen}
                w="full"
                variant="videco"
                mb={2}
                rightIcon={<FiShare2 />}
            >
                Share with email
            </Button>
            <Modal isOpen={isOpen} onClose={onClose} size="5xl">
                <ModalOverlay />
                <ModalContent
                    px={6}
                    py={8}
                    bg="#fff"
                    border="1px solid #05405A"
                >
                    <CloseButton
                        pos="absolute"
                        right={0}
                        top={0}
                        onClick={onClose}
                    />
                    <Flex>
                        <Box
                            width="50%"
                            bg={"#F6F6F6"}
                            border="1px solid #DADADA"
                            p={4}
                            mr={2}
                            rounded="md"
                        >
                            <Text
                                fontWeight="bold"
                                fontSize="lg"
                                color="#383F40"
                            >
                                How to share your video?
                            </Text>
                            <Text fontSize="sm" color="#383F40" mb={6}>
                                This section will help your to share your video
                            </Text>

                            <OrderedList>
                                <ListItem>
                                    <Text fontSize="md" color="#383F40">
                                        Select your sending platform on the
                                        right. This action will copy a Videco
                                        share snippet to your clipboard.
                                    </Text>
                                </ListItem>
                                <ListItem mt={3}>
                                    <Text fontSize="md" color="#383F40">
                                        Insert the snippet directly into the
                                        body of the email template within your
                                        sending platform.
                                    </Text>
                                </ListItem>
                                <ListItem mt={3}>
                                    <Text fontSize="md" color="#383F40">
                                        Upon pasting, the fallback video will
                                        appear. This occurs when no contact has
                                        been chosen yet.
                                    </Text>
                                </ListItem>
                                <ListItem mt={3}>
                                    <Text fontSize="md" color="#383F40">
                                        Verify that everything is functioning
                                        correctly by previewing a contact from
                                        your automated video list. In the email
                                        preview, you should observe the video
                                        you've generated for them (complete with
                                        website background).
                                    </Text>
                                </ListItem>
                                <ListItem mt={3}>
                                    <Text fontSize="md" color="#383F40">
                                        Save this template and incorporate it
                                        into your sales automation!
                                    </Text>
                                </ListItem>
                            </OrderedList>
                        </Box>
                        <Box
                            width="50%"
                            border="1px solid #DADADA"
                            p={4}
                            rounded="md"
                        >
                            <Text
                                fontWeight="bold"
                                fontSize="lg"
                                color="#383F40"
                            >
                                Share Your Video
                            </Text>
                            <Text fontSize="sm" color="#383F40" mb={6}>
                                Select your platform and click to copy the code
                            </Text>
                            <Input
                                placeholder="Search your platform"
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Box mt={4} maxH="300px" overflowY="auto">
                                {filteredProviders.map((provider) => (
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        onClick={() => handleCopy(provider)}
                                        alignItems="center"
                                        border="1px solid #DADADA"
                                        rounded="md"
                                        mb={2}
                                        _hover={{ bg: "#F6F6F6" }}
                                        cursor="pointer"
                                        p={2}
                                    >
                                        <Box display="flex" alignItems="center">
                                            <Image
                                                src={`/assets/share/${provider.value}.${provider.fileType}`}
                                                w={30}
                                                rounded="full"
                                            />
                                            <Text ml={2} fontWeight="bold">
                                                {provider.label}
                                            </Text>
                                        </Box>
                                        <Button
                                            fontSize="xs"
                                            px={4}
                                            height="22px"
                                            bg={
                                                copiedProvider ===
                                                provider.value
                                                    ? "green.100"
                                                    : "#DADADA"
                                            }
                                        >
                                            {copiedProvider === provider.value
                                                ? "Code Copied"
                                                : "Copy Code"}
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Flex>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ShareModal;
