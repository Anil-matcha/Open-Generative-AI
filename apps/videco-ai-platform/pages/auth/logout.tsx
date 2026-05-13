import React, { useEffect } from "react";
import { Grid, GridItem, Image, Container, Heading } from "@chakra-ui/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
const Logout: any = () => {
    const supabase = useSupabaseClient();

    const router = useRouter();
    useEffect(() => {
        supabase.auth.signOut().finally(() => {
            router.query.reset
                ? router.push("/auth/login?reset=true")
                : router.push("/auth/login");
        });
    }, []);

    return (
        <Grid
            templateColumns={[null, "repeat(1, 1fr)", "repeat(2, 1fr)"]}
            h="full"
            textColor="white"
        >
            <GridItem p="12 " w="100%" h="full" bg="white">
                <Image src="/logo.svg" />
                <Container mt="28" maxW="xl" color="black">
                    You will be redirected to the login page
                </Container>
            </GridItem>
            <GridItem w="100%" h="full" bg="gray.700">
                <Container mt={["10", null, "60"]}>
                    <Heading as="h1" size="3xl">
                        Thanks for using Videco{" "}
                    </Heading>
                </Container>
            </GridItem>
        </Grid>
    );
};

export default Logout;
