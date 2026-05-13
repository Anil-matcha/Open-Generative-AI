import React, { useEffect, useState } from "react";
import {
    Input,
    Box,
    Heading,
    Flex,
    Card,
    CardBody,
    CardHeader,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
const Leads: React.FC = () => {
    const session = useSession();
    const router = useRouter();
    return (
        <Sidebar>
            <Box h="full" bg="white">
                <Flex
                    direction="column"
                    bg="white"
                    mb={6}
                    boxShadow="sm"
                    w="full"
                >
                    <Header pageTitle="Leads" />
                </Flex>
                <Flex ml={5} justifyContent="space-between" w="full" bg="white">
                    <Box>Coming soon</Box>
                </Flex>
            </Box>
        </Sidebar>
    );
};

export default Leads;
