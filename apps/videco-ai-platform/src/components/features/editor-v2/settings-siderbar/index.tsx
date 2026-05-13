import {
    Box,
    Button,
    Checkbox,
    Flex,
    GridItem,
    Heading,
    IconButton,
    Input,
    Select,
    Text,
} from "@chakra-ui/react";
import React from "react";
import { CloseIcon } from "@chakra-ui/icons";
import { Formik } from "formik";
import { useEditorStore } from "src/store/editor";

type SettingsSidebarProps = {
    toggleSettingsWindow?: any;
    activeElement?: any;
};

export const SettingsSidebar = ({
    toggleSettingsWindow,
    activeElement,
}: SettingsSidebarProps): JSX.Element => {
    const { updateInteractiveElements, deleteInteractiveElement } =
        useEditorStore();

    const ACTIVE_END_TIME = activeElement?.endTime;

    return (
        <Box
            border="2px solid"
            pos="absolute"
            zIndex={99}
            bg="white"
            height="full"
            minW="xs"
            p={6}
        >
            <Heading
                display="flex"
                textAlign="left"
                justifyContent="space-between"
                alignItems="center"
                as="h3"
                fontSize="xl"
                pb={4}
            >
                Element Settings
                <IconButton
                    maxW="4"
                    variant="solid"
                    onClick={toggleSettingsWindow}
                    color="black"
                    ml={1}
                    aria-label="Close"
                    icon={<CloseIcon w={3} />}
                />
            </Heading>
            <Formik
                initialValues={{
                    name: activeElement?.name,
                    url: activeElement?.url,
                    form_submit_text: activeElement?.form_submit_text,
                    answers: activeElement?.answers,
                    endTime: activeElement?.endTime,
                    answer_placeholder: activeElement?.answer_placeholder,
                    answer_type: activeElement?.answer_type,
                    form_enable_name: activeElement?.form_enable_name,
                    form_enable_email: activeElement?.form_enable_email,
                    form_enable_message: activeElement?.form_enable_message,
                    color_mode: "dark",
                }}
                onSubmit={async (values) => {
                    // set global state
                    updateInteractiveElements({ ...activeElement, ...values });
                }}
            >
                {({ handleChange, handleSubmit, handleBlur, values }) => (
                    <form onSubmit={handleSubmit}>
                        {activeElement?.type === "link" && (
                            <>
                                <Flex flexDir="column">
                                    <Text fontWeight="semibold" mb={1}>
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
                                    <Text fontWeight="semibold" mb={1}>
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
                                <Flex flexDir="column" mt={4}>
                                    <Text fontWeight="semibold" mb={1}>
                                        Position:
                                    </Text>
                                    <Select
                                        placeholder="Select position"
                                        name="butonPosition"
                                        defaultValue={
                                            activeElement?.butonPosition ??
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
                        {activeElement?.type === "calendar" && (
                            <>
                                <Flex flexDir="column" mt={4}>
                                    <Text fontWeight="semibold" mb={1}>
                                        Your calendar URL
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
                                    <Text fontWeight="semibold" mb={1}>
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
                                    <Text fontWeight="semibold" mb={1}>
                                        Action button text
                                    </Text>
                                    <Input
                                        name="url"
                                        type="text"
                                        onChange={handleChange}
                                        value={"Submit"}
                                        placeholder="https://www.videco.io/"
                                    />
                                </Flex>
                                <Flex flexDir="column" mt={4}>
                                    <Checkbox
                                        onChange={handleChange}
                                        name="form_enable_name"
                                        defaultChecked
                                    >
                                        Enable Name
                                    </Checkbox>
                                    <Checkbox
                                        defaultChecked
                                        onChange={handleChange}
                                        name="form_enable_email"
                                    >
                                        Enable Email
                                    </Checkbox>
                                    <Checkbox
                                        defaultChecked
                                        onChange={handleChange}
                                        name="form_enable_subject"
                                    >
                                        Enable Subject
                                    </Checkbox>
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
                                    <Text fontWeight="semibold" mb={1}>
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
                                    <Text fontWeight="semibold" mt={3}>
                                        Answer type
                                    </Text>
                                    <Select
                                        onBlur={handleBlur}
                                        name="answer_type"
                                        placeholder={"Select an answer type"}
                                        onChange={handleChange}
                                        defaultValue={values.answer_type}
                                    >
                                        <option value="list">List</option>
                                        <option value="text">Text</option>
                                    </Select>
                                </Flex>
                                {values.answer_type === "text" ? (
                                    <Flex flexDir="column" mt={4}>
                                        <Text fontWeight="semibold" mb={1}>
                                            Answer Placeholder
                                        </Text>
                                        <Input
                                            name="answer_placeholder"
                                            type="text"
                                            onChange={handleChange}
                                            value={values.answer_placeholder}
                                            placeholder="What's your email address?"
                                        />
                                    </Flex>
                                ) : (
                                    <Flex flexDir="column" mt={4}>
                                        <Text fontWeight="semibold" mb={1}>
                                            Answers (comma separated)
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
                        <Flex flexDir="column" mt={4}>
                            <Text fontWeight="semibold" mb={1}>
                                End Timestamp (When to hide the element):
                            </Text>
                            <Input
                                name="endTime"
                                type="text"
                                onChange={handleChange}
                                value={values.endTime}
                                placeholder="10"
                            />
                        </Flex>
                        <Flex flexDir="column" mt={4}>
                            <Button type="submit"> Save </Button>
                        </Flex>
                        <Flex flexDir="column" mt={4}>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    deleteInteractiveElement(activeElement)
                                }
                                colorScheme="red"
                            >
                                Delete Element
                            </Button>
                        </Flex>
                    </form>
                )}
            </Formik>
        </Box>
    );
};
