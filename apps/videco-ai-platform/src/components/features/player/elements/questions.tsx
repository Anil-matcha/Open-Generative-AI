import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import { Box, Button, Input, Link } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import { Formik } from "formik";
import { FiCheck, FiCheckCircle } from "react-icons/fi";

export const InteractiveQuestions = ({
    setFormSubmitting,
    element,
    isLargerThan800,
    submitFormData,
    id,
    setAnswerSubmitted,
    setActiveAnswerType,
    setHideQuestion,
    answerSubmitted,
    activeAnswerType,
}: any) => (
    <Box
        key={element.id}
        zIndex={990}
        border="1px solid"
        borderColor="gray.500"
        cursor={"move"}
        backgroundColor="white"
        pos="absolute"
        flexDirection={"column"}
        display={"flex"}
        px={isLargerThan800 ? "4" : "12"}
        bg="#055256"
        color={"black"}
        minW={isLargerThan800 ? "300px" : "100%"}
        py={2}
        height={"100%"}
        maxWidth={"32%"}
        opacity={0.9}
        justifyContent="center"
        alignItems={"center"}
        rounded="md"
        right={0}
        top={0}
    >
        <>
            <Formik
                initialValues={{
                    question: element?.name,
                    answer: "",
                }}
                onSubmit={async (values) => {
                    setFormSubmitting(true);
                    try {
                        const video_session =
                            localStorage.getItem("video_session") || false;
                        const session_id = uuidv4() + Date.now();

                        if (!video_session) {
                            localStorage.setItem("video_session", session_id);
                        }

                        await submitFormData("/api/feedback/submit", {
                            session_id: video_session ?? session_id,
                            question: element?.name,
                            answer: values.answer,
                            video_id: id,
                            user_id: element?.user_id,
                        });
                    } catch (e) {
                        console.log(e);
                    } finally {
                        setAnswerSubmitted(true);
                        setActiveAnswerType(element?.answer_type);
                        setTimeout(() => {
                            setHideQuestion(true);
                        }, 1000);
                    }
                }}
            >
                {({ handleChange, setFieldValue, handleSubmit, values }) => (
                    <form
                        style={{
                            width: "100%",
                        }}
                        onSubmit={handleSubmit}
                    >
                        <Box
                            position="absolute"
                            top={5}
                            left={2}
                            w="100%"
                            p={3}
                            color={"white"}
                            fontSize="xl"
                            fontWeight={"semibold"}
                            roundedTopRight="md"
                            roundedBottomRight="md"
                            textAlign="left"
                        >
                            {element?.name}
                        </Box>
                        <Box
                            w="full"
                            p={3}
                            zIndex={4}
                            color={"white"}
                            fontSize="xl"
                            fontWeight={"semi-bold"}
                            textAlign="center"
                        >
                            {element?.answer_type === "list" &&
                                element?.answers &&
                                element?.answers
                                    ?.toString()
                                    .split(",")
                                    .map((answer) => (
                                        <Box
                                            key={element.id}
                                            cursor={"pointer"}
                                            _hover={{
                                                bg: "#14213D",
                                                color: "white",
                                            }}
                                            color={
                                                answerSubmitted &&
                                                values.answer === answer
                                                    ? "white"
                                                    : "#055256"
                                            }
                                            bg={
                                                answerSubmitted &&
                                                values.answer === answer
                                                    ? "#14213D"
                                                    : "#ffffffb7"
                                            }
                                            onClick={() =>
                                                setFieldValue("answer", answer)
                                            }
                                            display="flex"
                                            justifyContent="space-between"
                                            px={4}
                                            w="100%"
                                            fontSize="sm"
                                            as="button"
                                            type="submit"
                                            py={2}
                                            rounded="full"
                                            mt={3}
                                        >
                                            {answer}

                                            {answerSubmitted &&
                                                values.answer === answer && (
                                                    <FiCheck
                                                        style={{
                                                            marginTop: "2px",
                                                        }}
                                                    />
                                                )}
                                        </Box>
                                    ))}
                            {element?.answer_type === "text" && (
                                <>
                                    <Input
                                        bg={"#000000d4"}
                                        p={6}
                                        mt={1}
                                        minW="100%"
                                        roundedBottomRight="full"
                                        roundedTopRight="full"
                                        border={"none"}
                                        name="answer"
                                        onChange={handleChange}
                                        type="text"
                                        placeholder={
                                            element?.answer_placeholder
                                        }
                                    />
                                    <Button
                                        bg={"#000000d4"}
                                        rounded="full"
                                        border={"none"}
                                        type="submit"
                                        color={"white"}
                                        mt={3}
                                        minW="100%"
                                        _hover={{
                                            bg: "gray.900",
                                            border: "1px solid blue",
                                        }}
                                    >
                                        Submit
                                        {answerSubmitted &&
                                            activeAnswerType === "text" && (
                                                <FiCheckCircle
                                                    style={{
                                                        marginLeft: "8px",
                                                    }}
                                                />
                                            )}
                                    </Button>
                                </>
                            )}
                        </Box>
                    </form>
                )}
            </Formik>
        </>
    </Box>
);
