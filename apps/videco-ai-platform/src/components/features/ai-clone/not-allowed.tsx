import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Text,
    Box,
    Link,
} from "@chakra-ui/react";
import { useState } from "react";

type TemplatesTypes = {
    getSelectedScript?: any;
};
export const NotAllowed: React.FC<TemplatesTypes> = ({ getSelectedScript }) => {
    const [updatedModalOpen, setUpdatedModalOpen] = useState(false);

    const onSelectScript = (text: string) => {
        getSelectedScript(text);
        setUpdatedModalOpen(false);
    };

    const onOpen = () => setUpdatedModalOpen(!updatedModalOpen);
    const onClose = () => setUpdatedModalOpen(!updatedModalOpen);
    return (
        <>
            <Modal
                closeOnOverlayClick={false}
                isOpen={true}
                onClose={onClose}
                size="3xl"
            >
                <ModalOverlay />
                <ModalContent rounded="lg" bg="#f7f9fa">
                    <ModalBody pb={6} bg="#f7f9fa" rounded="lg">
                        <Box
                            bg="#f7f9fa"
                            pos="relative"
                            zIndex={9}
                            m="auto"
                            maxW="1000px"
                            w="full"
                            px={4}
                            py={2}
                            rounded="lg"
                        >
                            <Text
                                color="#05405A"
                                fontSize="30"
                                fontWeight="semibold"
                                textAlign="left"
                            >
                                Limit exceeded
                            </Text>
                            <Text
                                color="#05405A"
                                fontSize="16"
                                textAlign="left"
                                mb={4}
                            >
                                Please upgrade your plan to create more clones
                            </Text>
                            <Link
                                mt={5}
                                href="/pricing"
                                textDecor="underline"
                                float="right"
                            >
                                <Button
                                    variant="solid"
                                    bg="#05405A"
                                    _hover={{
                                        bg: "#166183",
                                    }}
                                    color="white"
                                >
                                    {" "}
                                    Check our pricing{" "}
                                </Button>
                            </Link>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
