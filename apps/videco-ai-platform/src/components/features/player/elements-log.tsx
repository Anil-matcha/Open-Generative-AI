import {
    Box,
    Text,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverBody,
    Button,
    Checkbox,
    Flex,
    useToast,
    Input,
    Select,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    useDisclosure,
} from "@chakra-ui/react";
import { Formik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import {
    FiArchive,
    FiCalendar,
    FiDatabase,
    FiLink,
    FiMessageSquare,
} from "react-icons/fi";
import { useEditorStore } from "src/store/editor";
import { motion } from "framer-motion";
import React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";

const ElementsLog = () => {
    const {
        updateInteractiveElements,
        deleteInteractiveElement,
        interactiveElements,
    } = useEditorStore();

    const [elements, setElements] = useState(interactiveElements);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef();
    const router = useRouter();
    const supabase = createClientComponentClient();
    const deleteVideoFromId = useCallback(async () => {
        try {
            await supabase
                .from("videos")
                .update({ status: "deleted" })
                .eq("id", router.query.id)
                .select()
                .then((res) => {
                    toast({
                        title: "Deleted",
                        description: "Your video was deleted",
                        status: "error",
                        duration: 1000,
                        isClosable: true,
                    });
                    onClose();
                    setTimeout(() => {
                        router.push("/videos");
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
    const deleteVideo = () => {
        deleteVideoFromId();
    };

    useEffect(() => {
        setElements(interactiveElements);
    }, [interactiveElements, updateInteractiveElements]);
    return (
        <Box p={2} maxW="xl" position="relative" height="full">
            <Text as="h2" fontSize="xl" fontWeight="bold">
                Interactive elements
            </Text>
            <Text as="span" fontSize="sm">
                Edit all of your interactive video elements.
            </Text>
            <Box mt={7} height="80%" overflowY="auto">
                {!elements.length && (
                    <Box color="gray" mt={10} id="empty-elements-log">
                        + Add your first element from the options above the
                        video
                    </Box>
                )}
                {elements &&
                    elements.map((element, index) => (
                        <Popover
                            defaultIsOpen={false}
                            trigger="click"
                            strategy="absolute"
                        >
                            <PopoverContent
                                bg="#fcfcfc"
                                zIndex={900}
                                rounded="md"
                                color="black"
                                border="black"
                                height="full"
                                overflowY="scroll"
                                boxShadow="md"
                            >
                                <PopoverArrow bg="#ffffff" />
                                <PopoverBody
                                    rounded="md"
                                    pb={2}
                                    opacity={1}
                                    bg="#ffffff"
                                >
                                    <Text mt={3} fontWeight="bold">
                                        Update element
                                    </Text>
                                    <Text
                                        fontWeight="thin"
                                        fontSize="12"
                                        mb={3}
                                    >
                                        Settings related to your interactive
                                        element
                                    </Text>
                                    <Formik
                                        initialValues={{
                                            name: element?.name,
                                            url: element?.url,
                                            butonPosition:
                                                element?.butonPosition,
                                            form_submit_text:
                                                element?.form_submit_text,
                                            answers: element?.answers,
                                            time: element?.time,
                                            endTime: element?.endTime,
                                            answer_placeholder:
                                                element?.answer_placeholder,
                                            answer_type: element?.answer_type,
                                            form_enable_name:
                                                element?.form_enable_name,
                                            form_enable_email:
                                                element?.form_enable_email,
                                            form_enable_message:
                                                element?.form_enable_message,
                                            color_mode: "dark",
                                        }}
                                        enableReinitialize={true}
                                        onSubmit={async (values) => {
                                            if (element?.type === "calander") {
                                                if (
                                                    !values.url.includes(
                                                        "calendly",
                                                    )
                                                ) {
                                                    toast({
                                                        title: "Invalid URL! We support only Calendly links",
                                                        status: "error",
                                                        duration: 1000,
                                                        isClosable: true,
                                                    });
                                                    return;
                                                }
                                            }
                                            const formattedVlaues = values;
                                            formattedVlaues.endTime =
                                                Number(element?.time) +
                                                Number(values.endTime);
                                            // set global state
                                            updateInteractiveElements({
                                                ...element,
                                                ...formattedVlaues,
                                            });
                                            toast({
                                                title: "Element Updated!",
                                                status: "success",
                                                duration: 1000,
                                                isClosable: true,
                                            });
                                        }}
                                    >
                                        {({
                                            handleChange,
                                            handleSubmit,
                                            handleBlur,
                                            values,
                                        }) => (
                                            <form onSubmit={handleSubmit}>
                                                {element?.type === "link" && (
                                                    <>
                                                        <Flex flexDir="column">
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Text
                                                            </Text>
                                                            <Input
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                name="name"
                                                                value={
                                                                    values.name
                                                                }
                                                                placeholder="Link Name"
                                                            />
                                                        </Flex>
                                                        <Flex
                                                            flexDir="column"
                                                            mt={4}
                                                        >
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                URL
                                                            </Text>
                                                            <Input
                                                                name="url"
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    values.url
                                                                }
                                                                placeholder="https://www.videco.io/"
                                                            />
                                                        </Flex>
                                                        <Flex
                                                            flexDir="column"
                                                            mt={4}
                                                        >
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Position:
                                                            </Text>
                                                            <Select
                                                                placeholder="Select position"
                                                                name="butonPosition"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                defaultValue={
                                                                    values?.butonPosition ??
                                                                    "top-left"
                                                                }
                                                            >
                                                                <option value="top-left">
                                                                    Top Left
                                                                </option>
                                                                <option value="top-right">
                                                                    Top Right
                                                                </option>
                                                                <option value="bottom-left">
                                                                    Bottom Left
                                                                </option>
                                                                <option value="bottom-right">
                                                                    Bottom Right
                                                                </option>
                                                            </Select>
                                                        </Flex>
                                                    </>
                                                )}
                                                {element?.type ===
                                                    "calander" && (
                                                    <>
                                                        <Flex
                                                            flexDir="column"
                                                            mt={4}
                                                        >
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Add your
                                                                calendar URL
                                                            </Text>
                                                            <Input
                                                                name="url"
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    values.url
                                                                }
                                                                placeholder="https://calendly.com/malith-dgos/30min?month=2024-05"
                                                            />
                                                        </Flex>
                                                    </>
                                                )}
                                                {element?.type === "form" && (
                                                    <>
                                                        <Flex flexDir="column">
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Form Title
                                                            </Text>
                                                            <Input
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                name="name"
                                                                value={
                                                                    values.name
                                                                }
                                                                placeholder="Link Name"
                                                            />
                                                        </Flex>
                                                        <Flex
                                                            flexDir="column"
                                                            mt={4}
                                                        >
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Action button
                                                                text
                                                            </Text>
                                                            <Input
                                                                name="form_submit_text"
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    values.form_submit_text
                                                                }
                                                                placeholder="Submit"
                                                            />
                                                        </Flex>
                                                        <Flex
                                                            flexDir="column"
                                                            mt={4}
                                                        >
                                                            <Checkbox
                                                                defaultChecked
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                name="form_enable_message"
                                                            >
                                                                Enable Message
                                                            </Checkbox>
                                                        </Flex>
                                                    </>
                                                )}
                                                {element?.type ===
                                                    "questions" && (
                                                    <>
                                                        <Flex flexDir="column">
                                                            <Text
                                                                fontWeight="semibold"
                                                                mb={1}
                                                            >
                                                                Your question
                                                            </Text>
                                                            <Input
                                                                type="text"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                name="name"
                                                                value={
                                                                    values.name
                                                                }
                                                                placeholder="Link Name"
                                                            />
                                                        </Flex>
                                                        <Flex flexDir="column">
                                                            <Text
                                                                fontWeight="semibold"
                                                                mt={3}
                                                            >
                                                                Answer type
                                                            </Text>
                                                            <Select
                                                                onBlur={
                                                                    handleBlur
                                                                }
                                                                name="answer_type"
                                                                placeholder={
                                                                    "Select an answer type"
                                                                }
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                defaultValue={
                                                                    values.answer_type
                                                                }
                                                            >
                                                                <option value="list">
                                                                    List
                                                                </option>
                                                                <option value="text">
                                                                    Text
                                                                </option>
                                                            </Select>
                                                        </Flex>
                                                        {values.answer_type ===
                                                        "text" ? (
                                                            <Flex
                                                                flexDir="column"
                                                                mt={4}
                                                            >
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    mb={1}
                                                                >
                                                                    Answer
                                                                    Placeholder
                                                                </Text>
                                                                <Input
                                                                    name="answer_placeholder"
                                                                    type="text"
                                                                    onChange={
                                                                        handleChange
                                                                    }
                                                                    value={
                                                                        values.answer_placeholder
                                                                    }
                                                                    placeholder="What's your email address?"
                                                                />
                                                            </Flex>
                                                        ) : (
                                                            <Flex
                                                                flexDir="column"
                                                                mt={4}
                                                            >
                                                                <Text
                                                                    fontWeight="semibold"
                                                                    mb={1}
                                                                >
                                                                    Answers
                                                                    (comma
                                                                    separated)
                                                                </Text>
                                                                <Input
                                                                    name="answers"
                                                                    type="text"
                                                                    onChange={
                                                                        handleChange
                                                                    }
                                                                    value={values.answers?.toString()}
                                                                    placeholder="https://www.videco.io/"
                                                                />
                                                            </Flex>
                                                        )}
                                                    </>
                                                )}
                                                <Box mb={5} display="flex">
                                                    <Text
                                                        fontSize="sm"
                                                        mb={-4}
                                                        mt="4"
                                                    >
                                                        Duration
                                                    </Text>
                                                    <Input
                                                        type={"text"}
                                                        h="22px"
                                                        mt={4}
                                                        name="endTime"
                                                        ml={1}
                                                        mr={1}
                                                        p="0"
                                                        pl="1"
                                                        w="full"
                                                        maxW="32px"
                                                        defaultValue={
                                                            values?.endTime -
                                                            values?.time
                                                        }
                                                        onChange={handleChange}
                                                        placeholder="5"
                                                        cursor="text"
                                                        border="1px solid #ccc"
                                                    />
                                                    <Text
                                                        fontSize="sm"
                                                        mb={-4}
                                                        mt="4"
                                                    >
                                                        seconds
                                                    </Text>
                                                </Box>
                                                <Box
                                                    display="flex"
                                                    justifyContent="right"
                                                    alignItems="center"
                                                    w="full"
                                                >
                                                    <Button
                                                        w="full"
                                                        color="white"
                                                        colorScheme="green"
                                                        type="submit"
                                                        bg="#055256"
                                                    >
                                                        Save
                                                    </Button>
                                                </Box>
                                            </form>
                                        )}
                                    </Formik>
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        textDecor="underline"
                                        mt={6}
                                        onClick={() => {
                                            deleteInteractiveElement(element);
                                        }}
                                    >
                                        <FiArchive
                                            style={{
                                                marginRight: "12px",
                                                cursor: "pointer",
                                            }}
                                            color="red"
                                        />
                                        Delete this element
                                    </Box>
                                </PopoverBody>
                            </PopoverContent>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: [1, 1.2, 1] }}
                                transition={{ duration: 1 }}
                            >
                                <Box
                                    display="flex"
                                    rounded="md"
                                    border="1px solid #E2E8F0"
                                    padding={4}
                                    mt={4}
                                    _hover={{
                                        bg: "#F7FAFC",
                                    }}
                                    key={index}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Text
                                        display="flex"
                                        alignItems="center"
                                        maxW="200"
                                        w="full"
                                    >
                                        {element.type === "form" && (
                                            <FiDatabase
                                                style={{
                                                    marginRight: "8px",
                                                }}
                                            />
                                        )}
                                        {element.type === "link" && (
                                            <FiLink
                                                style={{
                                                    marginRight: "8px",
                                                }}
                                            />
                                        )}
                                        {element?.type === "questions" && (
                                            <FiMessageSquare
                                                style={{
                                                    marginRight: "8px",
                                                }}
                                            />
                                        )}
                                        {element?.type === "calander" && (
                                            <FiCalendar
                                                style={{
                                                    marginRight: "8px",
                                                }}
                                            />
                                        )}
                                        {element.type?.toUpperCase()}
                                    </Text>
                                    <Text
                                        color="#CFD4D4"
                                        cursor="pointer"
                                        maxW="200"
                                        mr={6}
                                    >
                                        {element.time}
                                    </Text>
                                    <Text
                                        as="span"
                                        fontSize="sm"
                                        display="flex"
                                    >
                                        <PopoverTrigger>
                                            <HiDotsHorizontal
                                                style={{
                                                    cursor: "pointer",
                                                }}
                                            />
                                        </PopoverTrigger>
                                    </Text>
                                </Box>
                            </motion.div>
                        </Popover>
                    ))}
                <AlertDialog
                    isOpen={isOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Delete Video
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure? You can't undo this action
                                afterwards.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={deleteVideo}
                                    ml={3}
                                >
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
                <Button
                    onClick={onOpen}
                    variant="outline"
                    position={"absolute"}
                    bottom={2}
                    border={0}
                    fontWeight="normal"
                    fontSize={14}
                    bg="transparent"
                    _hover={{ bg: "transparent", color: "red" }}
                    w="full"
                    color="gray.500"
                >
                    <FiArchive />
                    <Text ml={2}>Archive video</Text>
                </Button>
            </Box>
        </Box>
    );
};

export default ElementsLog;
