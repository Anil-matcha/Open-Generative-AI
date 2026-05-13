import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import { Box, Text } from "@chakra-ui/react";

export const InteractiveCalendar = ({ element, isLargerThan800 }: any) => (
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
        bg="#055256"
        color={"black"}
        p={0}
        height={"100%"}
        minW={isLargerThan800 ? "400px" : "100%"}
        opacity={0.9}
        justifyContent="center"
        alignItems={"center"}
        rounded="md"
        right={0}
        top={0}
    >
        {!element?.url && (
            <>
                <Text color="white" mt={36} fontSize="lg" fontWeight="bold">
                    Please add your calendar link in the settings
                </Text>
                <Text color="white" mt={2} fontSize="sm">
                    You can find settings in the interactive elements log
                </Text>
            </>
        )}
        <iframe src={element?.url} width="100%" height="100%"></iframe>
    </Box>
);
