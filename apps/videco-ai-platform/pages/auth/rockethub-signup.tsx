import React, { useEffect } from "react";
import {
    Grid,
    GridItem,
    Image,
    FormControl,
    FormLabel,
    Input,
    Text,
    Container,
    Button,
    FormErrorMessage,
    Box,
} from "@chakra-ui/react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Formik, Form, Field, FormikHelpers } from "formik";
const Login: any = () => {
    const session = useSession();
    const [error, setError] = React.useState(null);
    const supabase = useSupabaseClient();
    const router = useRouter();
    interface FormValues {
        email: string;
        password: string;
        rockethub_code: string;
    }
    const initialValues: FormValues = {
        email: "",
        password: "",
        rockethub_code: "",
    };

    useEffect(() => {
        session && !router.query.reset && router.push("/campaign");
    }, [session]);
    useEffect(() => {
        // Wait for the input to be in the DOM, then prefill it
        setTimeout(() => {
            const emailInput: any = document.getElementById("email");
            if (emailInput) {
                emailInput.value = router.query.email ?? "";
            }
        }, 500);
    }, [router.query]); // Run this effect once after the component mounts
    function validateInput(value) {
        let error;
        if (!value) {
            error = "This is required";
        }
        return error;
    }
    function validateEmail(value) {
        let error;
        if (!value) {
            error = "This is required";
        } else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value)) {
            error = "Invalid email address";
        }
        return error;
    }
    async function validateCode(value) {
        let error = null;
        if (!value) {
            error = "This is required";
        }
        if (value) {
            const { data } = await supabase
                .from("ltd_codes")
                .select()
                .eq("Code", value)
                .eq("status", "");
            if (data.length === 0) {
                error = "Invalid code";
            } else {
                return data[0];
            }
        }
        return error;
    }

    return (
        <Grid
            templateColumns={[null, "repeat(1, 1fr)", "repeat(2, 1fr)"]}
            h="full"
            textColor="white"
            bg="white"
        >
            <GridItem
                p="12 "
                w="100%"
                h="full"
                bg="white"
                color="black"
                ml={["0", "0", "16"]}
            >
                <Image src="/logo.svg" ml={["0", "0", "14"]} w="100px" />
                <Container mt="20" maxW="xl">
                    <Box>
                        <Text fontSize="2xl" textAlign="left" m={0} p={0}>
                            Get Started Now
                        </Text>
                        <Text fontSize="sm" textAlign="left" mb={4}>
                            Enter your credentials to access your account
                        </Text>
                        <Formik
                            initialValues={initialValues}
                            onSubmit={(
                                values,
                                {
                                    setErrors,
                                    setSubmitting,
                                }: FormikHelpers<FormValues>,
                            ) => {
                                setTimeout(async () => {
                                    const code = await validateCode(
                                        values.rockethub_code,
                                    );

                                    if (!code?.Code) {
                                        setErrors({
                                            rockethub_code:
                                                "Invalid rockethub code",
                                        });
                                        setSubmitting(false);
                                    } else {
                                        const { data, error } =
                                            await supabase.auth.signUp({
                                                email: values.email,
                                                password: values.password,
                                            });

                                        if (!error) {
                                            await supabase
                                                .from("plan")
                                                .upsert({
                                                    plan_name:
                                                        code?.plan_type.toLowerCase(),
                                                    user_id: data?.user.id,
                                                    status: "active",
                                                })
                                                .select();
                                            await supabase
                                                .from("ltd_codes")
                                                .update({
                                                    status: "active",
                                                })
                                                .eq("Code", code.Code);
                                        }
                                        if (error) {
                                            setError(error);
                                            console.log(
                                                "Error signing up:",
                                                error,
                                            );
                                        }
                                    }

                                    setSubmitting(false);
                                }, 1000);
                            }}
                        >
                            {({
                                values,
                                isSubmitting,
                                handleChange,
                                handleBlur,
                                handleSubmit,
                            }) => (
                                <Form onSubmit={handleSubmit}>
                                    <Box color="red">
                                        {error && String(error)}
                                    </Box>
                                    <Field
                                        name="email"
                                        validate={validateEmail}
                                    >
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors.email &&
                                                    form.touched.email
                                                }
                                            >
                                                <FormLabel
                                                    mt={3}
                                                    fontSize="small"
                                                >
                                                    Email
                                                </FormLabel>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="example@example.com"
                                                />
                                                <FormErrorMessage>
                                                    {form.errors.email}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field
                                        name="password"
                                        validate={validateInput}
                                    >
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors.password &&
                                                    form.touched.password
                                                }
                                            >
                                                <FormLabel
                                                    mt={3}
                                                    fontSize="small"
                                                >
                                                    Password
                                                </FormLabel>
                                                <Input
                                                    type="password"
                                                    {...field}
                                                    placeholder="********"
                                                />
                                                <FormErrorMessage>
                                                    {form.errors.password}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field
                                        name="rockethub_code"
                                        validate={validateInput}
                                    >
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors
                                                        .rockethub_code &&
                                                    form.touched.rockethub_code
                                                }
                                            >
                                                <FormLabel
                                                    mt={3}
                                                    fontSize="small"
                                                >
                                                    Rockethub Code
                                                </FormLabel>
                                                <Input
                                                    {...field}
                                                    placeholder="xxxxxxxx"
                                                />
                                                <FormErrorMessage>
                                                    {form.errors.rockethub_code}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Button
                                        w="full"
                                        mt={4}
                                        variant="videco"
                                        isLoading={isSubmitting}
                                        onClick={() => handleSubmit()}
                                    >
                                        Sign up
                                    </Button>
                                </Form>
                            )}
                        </Formik>
                    </Box>
                </Container>
            </GridItem>
            <GridItem
                w="78%"
                h="98%"
                display={["none", "none", "block"]}
                margin="auto"
                mr="10px"
                rounded="md"
                backdropBlur={5}
                backgroundSize="cover !important"
                bg="url('/assets/bg-login.png')"
                // backgroundColor="red"
                backgroundRepeat="no-repeat"
                backgroundPosition="center"
            >
                <Container mt={["10", null, "60"]}>
                    <Image
                        pos="absolute"
                        right={8}
                        top={10}
                        height="35px"
                        src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=477400&theme=light&period=daily"
                    />
                    <Text fontSize="2xl" textAlign="center" mt={-100}>
                        Stand out effortlessly with personalized videos.
                    </Text>
                    <Text fontSize="sm" textAlign="center">
                        Grow 147% Reply Rate with AI Personalised Videos
                    </Text>
                    <Image
                        src="/assets/login-element.png"
                        margin="auto"
                        mt={12}
                        w="55%"
                        height="auto"
                    />
                </Container>
            </GridItem>
            <Script
                id="partnero-integration"
                strategy="afterInteractive" // Ensure it runs after page load
                dangerouslySetInnerHTML={{
                    __html: `po('integration', 'universal', null);`,
                }}
            />
        </Grid>
    );
};

export default Login;
