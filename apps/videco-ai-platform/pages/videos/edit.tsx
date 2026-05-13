import React from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { useSession } from "@supabase/auth-helpers-react";
import { Editor } from "@components/features/editor-v2";

const Edit: React.FC = () => {
    const session = useSession();
    return (
        <>
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="fixed"
                    height="full"
                    width="full"
                >
                    <Spinner size="xl" />
                </Box>
            ) : (
                <Box bg="#E6E7EA" height="full" overflow="auto">
                    <Editor />
                </Box>
            )}
        </>
    );
};

export default Edit;
