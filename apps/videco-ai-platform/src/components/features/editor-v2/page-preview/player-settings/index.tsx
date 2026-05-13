import {
    useDisclosure,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Box,
    Text,
    FormControl,
    FormLabel,
    Input,
    Switch,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useEditorStore } from "src/store/editor";
import { VideoPreview } from "../../header/image-preview";

type PlayerSettingsProps = {
    type: "cta" | "branding" | "preview" | "none" | "password";
    isModalOpen: boolean;
};
export const PlayerSettings: React.FC<PlayerSettingsProps> = ({
    type,
    isModalOpen,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { meta, setVideoMeta } = useEditorStore();
    useEffect(() => {
        if (type !== "none") {
            onOpen();
        }
    }, [type, isModalOpen]);

    return (
        <>
            <Modal onClose={onClose} isOpen={isOpen} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <>{type === "cta" && "Update CTA"}</>
                        <>{type === "branding" && "Update Branding"}</>
                        <>{type === "preview" && "Update Preview Image"}</>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {type === "preview" && (
                            <VideoPreview src="https://placehold.co/250x140" />
                        )}

                        {type === "password" && (
                            <Box>
                                <Text fontWeight="bold">Password</Text>
                                <Text fontWeight="thin" fontSize="12">
                                    Add password to your video. Only people with
                                    the password can watch the video
                                </Text>
                                <FormControl
                                    display="flex"
                                    flexDir="column"
                                    alignItems="left"
                                >
                                    <Input
                                        type={"text"}
                                        mb={3}
                                        mt={3}
                                        value={meta.password_protection}
                                        onChange={(e) =>
                                            setVideoMeta({
                                                ...meta,
                                                password_protection:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Type a strong passwrod"
                                        cursor="text"
                                        border="1px solid #ccc"
                                        p={4}
                                    />
                                </FormControl>
                                <Button
                                    colorScheme="green"
                                    variant="solid"
                                    bg={"#055256"}
                                    onClick={onClose}
                                >
                                    Save
                                </Button>
                                <Button
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => {
                                        setVideoMeta({
                                            ...meta,
                                            password_protection: "",
                                        });
                                        onClose();
                                    }}
                                >
                                    Remove Password
                                </Button>
                            </Box>
                        )}

                        {type === "branding" && (
                            <>
                                <Text fontWeight="thin" fontSize="12">
                                    Make your player look like your own. Remove
                                    Videco logo from the player
                                </Text>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="branding" mb="0">
                                        Remove videco branding
                                    </FormLabel>
                                    <Switch
                                        onChange={(e) => {
                                            setVideoMeta({
                                                ...meta,
                                                remove_logo: e.target.checked,
                                            });
                                        }}
                                        defaultChecked={
                                            meta.remove_logo ?? false
                                        }
                                        my={3}
                                        colorScheme="green"
                                        id="branding"
                                    />
                                </FormControl>
                            </>
                        )}

                        {type === "cta" && (
                            <>
                                <Text fontWeight="thin" fontSize="12">
                                    Once the video is finished this button will
                                    be shown in the video
                                </Text>
                                <FormControl
                                    display="flex"
                                    flexDir="column"
                                    alignItems="left"
                                >
                                    <FormLabel htmlFor="branding" my="2">
                                        Title for end screen
                                    </FormLabel>
                                    <Input
                                        type={"text"}
                                        mb={3}
                                        value={meta?.endCTAtitle}
                                        onChange={(e) =>
                                            setVideoMeta({
                                                ...meta,
                                                endCTAtitle: e.target.value,
                                            })
                                        }
                                        placeholder="Thank you for watching"
                                        cursor="text"
                                        border="1px solid #ccc"
                                        p={4}
                                    />
                                    <FormLabel htmlFor="branding" my="2">
                                        CTA Text
                                    </FormLabel>
                                    <Input
                                        type={"text"}
                                        mb={3}
                                        value={meta?.endCTAtext}
                                        onChange={(e) =>
                                            setVideoMeta({
                                                ...meta,
                                                endCTAtext: e.target.value,
                                            })
                                        }
                                        placeholder="Learn more"
                                        cursor="text"
                                        border="1px solid #ccc"
                                        p={4}
                                    />
                                    <FormLabel htmlFor="branding" my="2">
                                        CTA URL
                                    </FormLabel>
                                    <Input
                                        type={"text"}
                                        mb={3}
                                        value={meta?.endCTAlink}
                                        onChange={(e) =>
                                            setVideoMeta({
                                                ...meta,
                                                endCTAlink: e.target.value,
                                            })
                                        }
                                        placeholder="https://videco.io"
                                        cursor="text"
                                        border="1px solid #ccc"
                                        p={4}
                                    />
                                </FormControl>
                                <Button
                                    colorScheme="green"
                                    variant="solid"
                                    bg={"#055256"}
                                    onClick={onClose}
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
