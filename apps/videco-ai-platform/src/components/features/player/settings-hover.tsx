import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverBody,
    Text,
    Button,
    Input,
    useToast,
    Box,
    Checkbox,
    Flex,
    Select,
} from "@chakra-ui/react";
import { Formik } from "formik";
import React from "react";
import { useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useEditorStore } from "src/store/editor";

export const SettingsHover = ({ activeElement, playerRef }: any) => {
    const { updateInteractiveElements, deleteInteractiveElement } =
        useEditorStore();
    const [isLoaded, setIsLoaded] = React.useState(false);
    const toast = useToast();

    useEffect(() => {
        setIsLoaded(true);
    }, []);
    return (
        <Box
            bg="red"
            pos="absolute"
            bottom="22px"
            left={`${
                (Number(activeElement.time) /
                    playerRef.current?.getDuration()) *
                100
            }%`}
            zIndex={209}
            transform="translateX(-12px)"
        >
            <Popover
                defaultIsOpen={isLoaded ? true : false}
                trigger="hover"
                placement="auto"
            >
                <PopoverTrigger>
                    <Box
                        rounded="md"
                        background="#055256"
                        w="23px"
                        h="12px"
                        cursor="pointer"
                        position="absolute"
                        zIndex={8}
                        left="2"
                        border="1px solid white"
                        top="0.5"
                    ></Box>
                </PopoverTrigger>
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
                    <PopoverBody rounded="md" pb={2} opacity={1} bg="#ffffff">
                        <Text mt={3} fontWeight="bold">
                            Update element
                        </Text>
                        <Text fontWeight="thin" fontSize="12" mb={3}>
                            Settings related to your interactive element
                        </Text>
                        <Formik
                            initialValues={{
                                name: activeElement?.name,
                                url: activeElement?.url,
                                form_submit_text:
                                    activeElement?.form_submit_text,
                                answers: activeElement?.answers,
                                endTime: activeElement?.endTime,
                                answer_placeholder:
                                    activeElement?.answer_placeholder,
                                answer_type: activeElement?.answer_type,
                                time: activeElement?.time,
                                form_enable_name:
                                    activeElement?.form_enable_name,
                                form_enable_email:
                                    activeElement?.form_enable_email,
                                form_enable_message:
                                    activeElement?.form_enable_message,
                                color_mode: "dark",
                            }}
                            enableReinitialize={true}
                            onSubmit={async (values) => {
                                if (activeElement?.type === "calander") {
                                    if (!values.url.includes("calendly")) {
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
                                    Number(activeElement?.time) +
                                    Number(values.endTime);
                                // set global state
                                updateInteractiveElements({
                                    ...activeElement,
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
                                    {activeElement?.type === "link" && (
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
                                                    onChange={handleChange}
                                                    name="name"
                                                    value={values.name}
                                                    placeholder="Link Name"
                                                />
                                            </Flex>
                                            <Flex flexDir="column" mt={4}>
                                                <Text
                                                    fontWeight="semibold"
                                                    mb={1}
                                                >
                                                    URL
                                                </Text>
                                                <Input
                                                    name="url"
                                                    type="text"
                                                    onChange={handleChange}
                                                    value={values.url}
                                                    placeholder="https://www.videco.io/"
                                                />
                                            </Flex>
                                        </>
                                    )}
                                    {activeElement?.type === "calander" && (
                                        <>
                                            <Flex flexDir="column" mt={4}>
                                                <Text
                                                    fontWeight="semibold"
                                                    mb={1}
                                                >
                                                    Add your calendar URL
                                                </Text>
                                                <Input
                                                    name="url"
                                                    type="text"
                                                    onChange={handleChange}
                                                    value={values.url}
                                                    placeholder="https://calendly.com/malith-dgos/30min?month=2024-05"
                                                />
                                            </Flex>
                                        </>
                                    )}
                                    {activeElement?.type === "form" && (
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
                                                    onChange={handleChange}
                                                    name="name"
                                                    value={values.name}
                                                    placeholder="Link Name"
                                                />
                                            </Flex>
                                            <Flex flexDir="column" mt={4}>
                                                <Text
                                                    fontWeight="semibold"
                                                    mb={1}
                                                >
                                                    Action button text
                                                </Text>
                                                <Input
                                                    name="form_submit_text"
                                                    type="text"
                                                    onChange={handleChange}
                                                    value={
                                                        values.form_submit_text
                                                    }
                                                    placeholder="Submit"
                                                />
                                            </Flex>
                                            <Flex flexDir="column" mt={4}>
                                                <Checkbox
                                                    defaultChecked
                                                    onChange={handleChange}
                                                    name="form_enable_message"
                                                >
                                                    Enable Message
                                                </Checkbox>
                                            </Flex>
                                        </>
                                    )}
                                    {activeElement?.type === "questions" && (
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
                                                    onChange={handleChange}
                                                    name="name"
                                                    value={values.name}
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
                                                    onBlur={handleBlur}
                                                    name="answer_type"
                                                    placeholder={
                                                        "Select an answer type"
                                                    }
                                                    onChange={handleChange}
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
                                            {values.answer_type === "text" ? (
                                                <Flex flexDir="column" mt={4}>
                                                    <Text
                                                        fontWeight="semibold"
                                                        mb={1}
                                                    >
                                                        Answer Placeholder
                                                    </Text>
                                                    <Input
                                                        name="answer_placeholder"
                                                        type="text"
                                                        onChange={handleChange}
                                                        value={
                                                            values.answer_placeholder
                                                        }
                                                        placeholder="What's your email address?"
                                                    />
                                                </Flex>
                                            ) : (
                                                <Flex flexDir="column" mt={4}>
                                                    <Text
                                                        fontWeight="semibold"
                                                        mb={1}
                                                    >
                                                        Answers (comma
                                                        separated)
                                                    </Text>
                                                    <Input
                                                        name="answers"
                                                        type="text"
                                                        onChange={handleChange}
                                                        value={values.answers?.toString()}
                                                        placeholder="https://www.videco.io/"
                                                    />
                                                </Flex>
                                            )}
                                        </>
                                    )}
                                    {/* <Box mb={5} display="flex">
                                        <Text fontSize="sm" mb={-4} mt="4">
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
                                            value={
                                                values?.endTime - values?.time
                                            }
                                            onChange={handleChange}
                                            placeholder="5"
                                            cursor="text"
                                            border="1px solid #ccc"
                                        />
                                        <Text fontSize="sm" mb={-4} mt="4">
                                            seconds
                                        </Text>
                                    </Box> */}
                                    <Box
                                        display="flex"
                                        justifyContent="right"
                                        alignItems="center"
                                    >
                                        <FiTrash2
                                            onClick={() =>
                                                deleteInteractiveElement(
                                                    activeElement,
                                                )
                                            }
                                            cursor="pointer"
                                            color="red"
                                        />
                                        <Button
                                            ml={3}
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
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </Box>
    );
};
