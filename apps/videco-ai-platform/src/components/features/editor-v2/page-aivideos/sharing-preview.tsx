import { Box, Text } from "@chakra-ui/react";
import Image from "next/image";

interface StepImportProps {
    id: string;
}
export const SharingPreview: React.FC<StepImportProps> = ({ id }) => {
    return (
        <Box mt={12} w="full" height={450}>
            <iframe
                src={`/embed/player/${id}`}
                style={{
                    width: "850px",
                    overflow: "hidden",
                    height: "100%",
                    padding: "0",
                    minHeight: "100%",
                    border: "none",
                }}
            />
        </Box>
    );
};
