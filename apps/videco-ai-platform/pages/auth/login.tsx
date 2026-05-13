import React, { useEffect } from "react";
import {
    Grid,
    GridItem,
    Image,
    FormControl,
    FormLabel,
    Input,
    FormHelperText,
    Container,
    Button,
    Box,
    Text,
    Heading,
} from "@chakra-ui/react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import Script from "next/script";
import { motion } from "framer-motion";
const Login: any = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const [resetPassword, setResetPassword] = React.useState("");
    const router = useRouter();

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

    return (
        <Grid
            templateColumns={[null, "repeat(1, 1fr)", "repeat(2, 1fr)"]}
            h="full"
            textColor="white"
            bg="white"
            position="relative"
        >
            <GridItem
                p="12 "
                w="100%"
                h="full"
                bg="white"
                color="black"
                ml={["0", "0", "16"]}
            >
                <Container mt="10" maxW="xl">
                    <Image src="/logo.svg" ml={0} mb={10} w="100px" />
                    {router.query.reset ? (
                        <Box>
                            <Heading as="h2" size="lg">
                                Update your password
                            </Heading>
                            <Text>Type your password to reset it</Text>
                            <Input
                                mt={6}
                                type="password"
                                colorScheme="teal"
                                border="1px solid #14213D"
                                onChange={(e) =>
                                    setResetPassword(e.target.value)
                                }
                                placeholder="Type your new password"
                            />
                            <Button
                                mt={2}
                                colorScheme="teal"
                                variant="solid"
                                w="full"
                                onClick={async () => {
                                    const { error } =
                                        await supabase.auth.updateUser({
                                            password: resetPassword,
                                        });
                                    if (error) {
                                        alert(
                                            "Error updating password: " +
                                                error.message,
                                        );
                                    } else {
                                        alert("Password updated successfully");
                                        router.push("/auth/login");
                                    }
                                }}
                            >
                                Update password
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <Text
                                fontSize="2xl"
                                textAlign="left"
                                mt={1}
                                fontWeight="semibold"
                            >
                                Get Started Now
                            </Text>
                            <Text fontSize="sm" textAlign="left">
                                Enter your credentials to access your account
                            </Text>
                            <Auth
                                providers={["google"]}
                                supabaseClient={supabase}
                                view={
                                    router.query.reset
                                        ? "forgotten_password"
                                        : "sign_up"
                                }
                                queryParams={{
                                    prompt: "consent",
                                }}
                                redirectTo={
                                    process.env.NEXT_PUBLIC_SITE_URL +
                                    "/auth/login"
                                }
                                theme="default"
                                appearance={{
                                    theme: ThemeSupa,
                                    variables: {
                                        default: {
                                            colors: {
                                                brand: "#05405A",
                                                brandAccent: "#14213D",
                                                inputText: "#14213D",
                                                inputLabelText: "#14213D",
                                            },
                                        },
                                    },
                                }}
                            />
                        </Box>
                    )}
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
                        opacity={0.8}
                        height="35px"
                        src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=477400&theme=light&period=daily"
                    />
                    <Text
                        fontSize="2xl"
                        textAlign="center"
                        mt={-100}
                        fontWeight="semibold"
                    >
                        Stand out effortlessly with personalized videos.
                    </Text>
                    <Text fontSize="sm" textAlign="center">
                        Grow 147% Reply Rate with AI Personalised Videos
                    </Text>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.8,
                            scale: {
                                type: "spring",
                                visualDuration: 0.8,
                                bounce: 0.3,
                            },
                        }}
                    >
                        <Image
                            src="/assets/login-element.png"
                            margin="auto"
                            mt={12}
                            w="55%"
                            height="auto"
                        />
                        <Image
                            src="/assets/intagrationlogos.png"
                            margin="auto"
                            mt={12}
                            ml={4}
                            height="auto"
                        />
                    </motion.div>
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
