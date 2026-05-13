import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    Text,
    Box,
    Card,
    Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";

type TemplatesTypes = {
    getSelectedScript: any;
};
export const Templates: React.FC<TemplatesTypes> = ({ getSelectedScript }) => {
    const [updatedModalOpen, setUpdatedModalOpen] = useState(false);

    const onSelectScript = (text: string) => {
        getSelectedScript(text);
        setUpdatedModalOpen(false);
    };

    const onOpen = () => setUpdatedModalOpen(!updatedModalOpen);
    const onClose = () => setUpdatedModalOpen(!updatedModalOpen);
    return (
        <>
            <Text fontSize="16" textAlign="left" mt={1} mb={6}>
                Write the script exactly as you want your clone to speak, or use
                one of the provided script templates as a guide.
                <Text
                    fontWeight="bold"
                    textDecor="underline"
                    cursor="pointer"
                    onClick={onOpen}
                >
                    Use a template
                </Text>
            </Text>
            <Modal
                closeOnOverlayClick={false}
                isOpen={updatedModalOpen}
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
                                mt={6}
                            >
                                Choose a script
                            </Text>
                            <Text
                                color="#05405A"
                                fontSize="16"
                                textAlign="left"
                            >
                                Select the script you want to use
                            </Text>
                            <ModalCloseButton />

                            <Flex
                                pb={6}
                                flexDir="column"
                                mt={6}
                                justifyContent="space-between"
                            >
                                <Card
                                    pl={5}
                                    mb="4"
                                    bg="white"
                                    color="#383F40"
                                    border="2px solid #00000012"
                                    boxShadow="md"
                                    _hover={{
                                        border: "2px solid #4991A1",
                                        boxShadow: "md",
                                    }}
                                    rounded="lg"
                                    onClick={() =>
                                        onSelectScript(
                                            "Hey [Recipient’s Name], I wanted to take a moment to give you a quick preview of how [Your Product] can help address [specific challenge]. This feature, [Feature], is designed to streamline [specific pain point], helping you save time and resources. As you can see in this demo, [brief explanation of how it works]. If this is something that could fit into your current workflow, I’d be more than happy to schedule a more in-depth walkthrough. We can go over how this feature, and others, can directly benefit your team. Let me know if you’d like to take the next step!",
                                        )
                                    }
                                    cursor="pointer"
                                    mr={5}
                                    display="flex"
                                    flexDir="column"
                                >
                                    <Box mt={6}>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="semibold"
                                            color="#05405A"
                                        >
                                            Product Demo’s
                                        </Text>
                                        <Text fontSize="15">
                                            Demo videos should focus on the
                                            features that align with the
                                            prospect’s specific needs.
                                        </Text>
                                        <Button
                                            variant="ghost"
                                            fontWeight="semibold"
                                            _hover={{
                                                bg: "white",
                                                fontWeight: "bold",
                                            }}
                                            fontSize="14"
                                            mt={4}
                                            p={0}
                                            color="#4991A1"
                                            rightIcon={
                                                <FiArrowRight
                                                    style={{
                                                        marginLeft: "2px",
                                                    }}
                                                />
                                            }
                                        >
                                            Use this script
                                        </Button>
                                    </Box>
                                </Card>
                                <Card
                                    pl={5}
                                    mb="4"
                                    bg="white"
                                    color="#383F40"
                                    border="2px solid #00000012"
                                    boxShadow="md"
                                    _hover={{
                                        border: "2px solid #4991A1",
                                        boxShadow: "md",
                                    }}
                                    rounded="lg"
                                    cursor="pointer"
                                    onClick={() =>
                                        onSelectScript(
                                            "Hi [Recipient’s Name], I wanted to follow up on the message I sent a few days ago. I know your time is valuable, so I thought sending a quick video might be a more engaging way to show my interest in helping your team with [specific challenge]. At [Your Company], we’ve worked with clients facing similar challenges, and we’ve been able to help them achieve [specific result]. If you have a few minutes, I’d love to continue the conversation. Whether it’s to answer questions or explore how our solution could fit within your current strategy, I’m here to help. Let me know what works best for you.",
                                        )
                                    }
                                    mr={5}
                                    display="flex"
                                    flexDir="column"
                                >
                                    <Box mt={6}>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="semibold"
                                            color="#05405A"
                                        >
                                            Follow-up personalized video
                                        </Text>
                                        <Text fontSize="15">
                                            Following up with prospects after
                                            sending a cold email can be
                                            challenging, but a follow-up video
                                            can make a big difference.
                                        </Text>
                                        <Button
                                            variant="ghost"
                                            fontWeight="semibold"
                                            _hover={{
                                                bg: "white",
                                                fontWeight: "bold",
                                            }}
                                            fontSize="14"
                                            mt={4}
                                            p={0}
                                            color="#4991A1"
                                            rightIcon={
                                                <FiArrowRight
                                                    style={{
                                                        marginLeft: "2px",
                                                    }}
                                                />
                                            }
                                        >
                                            Use this script
                                        </Button>
                                    </Box>
                                </Card>
                                <Card
                                    pl={5}
                                    mb="4"
                                    bg="white"
                                    color="#383F40"
                                    border="2px solid #00000012"
                                    boxShadow="md"
                                    _hover={{
                                        border: "2px solid #4991A1",
                                        boxShadow: "md",
                                    }}
                                    onClick={() =>
                                        onSelectScript(
                                            "Hey [Recipient’s Name], I wanted to quickly share a success story from a client of ours, [Client Name], who faced challenges similar to yours. After working with us, they were able to [specific result, e.g., increase revenue by X% or improve efficiency by Y%] thanks to [Your Product]. Their experience really demonstrates the kind of value we bring to businesses like yours. If you’re open to it, I’d love to discuss how we could apply the same strategies to help you achieve similar success. I believe our approach can make a real impact for your team, and I’m excited about the possibilities. Looking forward to connecting soon!",
                                        )
                                    }
                                    rounded="lg"
                                    cursor="pointer"
                                    mr={5}
                                    display="flex"
                                    flexDir="column"
                                >
                                    <Box mt={6}>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="semibold"
                                            color="#05405A"
                                        >
                                            Case Study Videos
                                        </Text>
                                        <Text fontSize="15">
                                            When incorporated into a cold email,
                                            a case study video presents
                                            undeniable evidence of a company’s
                                            ability to deliver results.
                                        </Text>
                                        <Button
                                            variant="ghost"
                                            fontWeight="semibold"
                                            _hover={{
                                                bg: "white",
                                                fontWeight: "bold",
                                            }}
                                            fontSize="14"
                                            mt={4}
                                            p={0}
                                            color="#4991A1"
                                            rightIcon={
                                                <FiArrowRight
                                                    style={{
                                                        marginLeft: "2px",
                                                    }}
                                                />
                                            }
                                        >
                                            Use this script
                                        </Button>
                                    </Box>
                                </Card>
                            </Flex>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
