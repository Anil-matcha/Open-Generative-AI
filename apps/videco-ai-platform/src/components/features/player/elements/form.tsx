import { Box, Text, Input, Textarea, Button } from "@chakra-ui/react";
import { Formik } from "formik";
import { FiArrowRight } from "react-icons/fi";

export const InteractiveForm = ({
    element,
    isLargerThan800,
    setFormSubmitting,
    submitFormData,
    id,
    setFormSubmitted,
    setHideForm,
    formSubmitted,
    formSubmitting,
    setUpdatedPlaying,
    isEditor,
}: any) => (
    <Box
        key={element.id}
        zIndex={990}
        border="1px solid"
        borderColor="gray.500"
        backgroundColor="white"
        pos="absolute"
        flexDirection={"column"}
        display={"flex"}
        px={6}
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
        <Formik
            initialValues={{
                name: "",
                email: "",
                message: "",
            }}
            onSubmit={async (values) => {
                setFormSubmitting(true);
                try {
                    await submitFormData("/api/submissions/submit", {
                        ...values,
                        form_id: element?.id,
                        form_name: element?.name,
                        video_id: id,
                        user_id: element?.user_id,
                    });
                } catch (e) {
                    console.log(e);
                } finally {
                    setFormSubmitted(true);
                    setTimeout(() => {
                        setHideForm(true);
                    }, 1000);
                }
            }}
        >
            {({ handleChange, handleSubmit, values }) => (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        width: "100%",
                    }}
                >
                    <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color={"white"}
                        w="full"
                        mt={2}
                        mb={2}
                        lineHeight="1.2"
                    >
                        {element?.name}
                    </Text>
                    {element?.form_enable_name && (
                        <Box position="relative" w="full">
                            <Text
                                rounded="lg"
                                color="white"
                                zIndex={9}
                                fontSize="xs"
                                px={3}
                                pb={1}
                            >
                                Your Name
                            </Text>
                            <Input
                                bg="white"
                                fontSize="sm"
                                rounded="3xl"
                                padding="10px"
                                color="blak"
                                required
                                placeholder="Name"
                                name="name"
                                type="text"
                                onChange={handleChange}
                                value={values.name}
                            />
                        </Box>
                    )}
                    {element?.form_enable_email && (
                        <Box position="relative" w="full" mt={2}>
                            <Text
                                rounded="lg"
                                color="white"
                                zIndex={9}
                                fontSize="xs"
                                px={3}
                                pb={1}
                            >
                                Your Email
                            </Text>
                            <Input
                                bg="white"
                                fontSize="sm"
                                required
                                rounded="3xl"
                                padding="10px"
                                color="blak"
                                type="textarea"
                                onChange={handleChange}
                                value={values.email}
                                name="email"
                                placeholder="hello@videco.io"
                            />
                        </Box>
                    )}
                    {element?.form_enable_message && (
                        <Box position="relative" w="full" mt={2}>
                            <Text
                                rounded="lg"
                                color="white"
                                zIndex={9}
                                fontSize="xs"
                                px={3}
                                pb={1}
                            >
                                Message{" "}
                            </Text>
                            <Textarea
                                bg="white"
                                fontSize="sm"
                                rounded="2xl"
                                padding="10px"
                                color="blak"
                                height={20}
                                onChange={handleChange}
                                value={values.message}
                                name="message"
                                placeholder="Why do you love us?"
                            />
                        </Box>
                    )}
                    {formSubmitted && (
                        <Text color="white" mt={6}>
                            Thank you for submitting this form!
                        </Text>
                    )}
                    <Button
                        bg="white"
                        w="full"
                        fontSize="sm"
                        rounded="3xl"
                        type="submit"
                        fontWeight="normal"
                        padding="2px"
                        mt={6}
                        isLoading={formSubmitting}
                        variant="outline"
                    >
                        {element?.form_submit_text}
                    </Button>
                    <Text
                        as="span"
                        w="full"
                        cursor={"pointer"}
                        my={2}
                        fontSize="sm"
                        textAlign="right"
                        color="white"
                        display="flex"
                        onClick={() => {
                            setUpdatedPlaying(true);
                            if (!isEditor) {
                                setHideForm(true);
                            }
                        }}
                        justifyContent="flex-end"
                        alignItems="center"
                    >
                        Skip{" "}
                        <FiArrowRight
                            style={{
                                marginLeft: "3px",
                            }}
                        />
                    </Text>
                </form>
            )}
        </Formik>
    </Box>
);
