import React, { useCallback, useState } from "react";
import {
    Box,
    Heading,
    Flex,
    Card,
    CardBody,
    Text,
    Button,
    Container,
    Image,
    Link,
    Spinner,
    SimpleGrid,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const Integrations: React.FC = () => {
    const supabase = createClientComponentClient();
    const session = useSession();
    const [fullname, setFullname] = useState<any>("");
    const [loading, setLoading] = useState(true);
    const user = session?.user;
    const getFullName = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`full_name, onboard_completed`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (data.full_name) {
                setFullname(data.full_name);
                setLoading(false);
            }
        } catch (error) {
            console.log(error);
        }
    }, [user, supabase]);
    return (
        <>
            <Head>
                {/* Load the Zapier Elements styles */}
                <link
                    rel="stylesheet"
                    href="https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.css"
                />
            </Head>

            {/* Load the Zapier Elements script */}
            <Script
                type="module"
                src="https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.esm.js"
                strategy="lazyOnload"
            />
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    flexDirection="column"
                    height="full"
                    width="full"
                >
                    <Spinner size="xl" />
                    <Link mt={7} href="/auth/login">
                        Please Login
                    </Link>
                </Box>
            ) : (
                <Sidebar>
                    <Box w="full" h="full" bg="white">
                        <Flex
                            direction="column"
                            bg="white"
                            mb={6}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Automation" />
                        </Flex>

                        <Container
                            bg="white"
                            w="full"
                            maxW="97%"
                            rounded="md"
                            boxShadow={"md"}
                            m={6}
                            p={4}
                            overflow="hidden"
                        >
                            <zapier-workflow
                                sign-up-email={user.email}
                                sign-up-first-name={fullname}
                                client-id={process.env.NEXT_PUBLIC_ZAPIER_CLIENT_ID}
                                intro-copy-display="show"
                                guess-zap-display="show"
                            />
                        </Container>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default Integrations;
