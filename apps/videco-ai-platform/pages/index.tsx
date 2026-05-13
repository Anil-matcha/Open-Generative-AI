import React from "react";
import { Spacer, Flex } from "@chakra-ui/react";
const Home: React.FC = () => {
    return (
        <Flex direction="column" minH="100vh">
            <Spacer />
        </Flex>
    );
};

export default Home;

export const getServerSideProps = async (ctx: any) => {
    const { res } = ctx;

    res.setHeader("location", "/auth/login");
    res.statusCode = 302;
    res.end();

    return {
        props: {
            data: [],
        },
    };
};
