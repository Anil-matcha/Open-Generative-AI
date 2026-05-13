import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import { Box, Link } from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

export const InteractiveButton = ({
    handleDragEnd,
    element,
    handleDragStart,
    embeded,
    constraintsRef,
    isLargerThan800,
    id,
    updateClickAnalytics,
}: any) => {
    let buttonPositionTop: any = "auto";
    let buttonPositionLeft: any = "auto";
    let buttonPositionRight: any = "auto";
    let buttonPositionBottom: any = "auto";
    if (element?.butonPosition === "bottom-right") {
        buttonPositionBottom = 16;
        buttonPositionRight = 5;
    } else if (element?.butonPosition === "top-right") {
        buttonPositionTop = 5;
        buttonPositionRight = 5;
    } else if (element?.butonPosition === "top-left") {
        buttonPositionTop = 1;
        buttonPositionLeft = 1;
    } else if (element?.butonPosition === "bottom-left") {
        buttonPositionBottom = 16;
        buttonPositionLeft = 5;
    }
    return (
        // <Rnd
        //     onDragStop={(e, d) => {
        //         handleDragEnd(element, d);
        //     }}
        //     onDragStart={(e, d) => {
        //         handleDragStart(element, d);
        //     }}
        //     style={{
        //         display: "flex",
        //         zIndex: 999,
        //         justifyContent: "center",
        //         alignItems: "center",
        //     }}
        //     disableDragging={true}
        //     bounds={constraintsRef.current}
        //     position={{
        //         ...(isLargerThan800
        //             ? {
        //                   x: element?.defaultPosition?.x ?? 10,
        //                   y: element?.defaultPosition?.y ?? 10,
        //               }
        //             : { x: 10, y: 10 }),
        //     }}
        //     default={{
        //         x: element?.defaultPosition?.x ?? 100,

        //         y: element?.defaultPosition?.y ?? 70,

        //         width: "auto",
        //         height: "auto",
        //     }}
        // >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
                left={buttonPositionLeft}
                top={buttonPositionTop}
                right={buttonPositionRight}
                bottom={buttonPositionBottom}
                key={element.id}
                zIndex={4}
                marginTop={5}
                marginLeft={5}
                color={"black"}
                shadow="md"
                border={"1px solid #3b3b3b80"}
                // cursor={embeded ? "pointer" : "move"}
                cursor="pointer"
                onClick={async () => {
                    if (embeded) {
                        await updateClickAnalytics(id, element?.name);
                        window.open(element?.url);
                    }
                }}
                pos="absolute"
                backgroundColor="#FFFFFF"
                fontWeight="semibold"
                display="inline-flex"
                width="max-content"
                _hover={{
                    textDecoration: "none",
                    backgroundColor: "#e4f2ee",
                }}
                px={12}
                target="_new"
                href={element?.link}
                py={2}
                justifyContent="center"
                alignItems={"center"}
                rounded="lg"
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    w="full"
                    alignItems="center"
                >
                    {element?.name}{" "}
                    <FiArrowRight
                        style={{
                            marginLeft: "5px",
                            marginTop: "2px",
                        }}
                    />
                    {console.log("element", element)}
                </Box>
            </Link>
        </motion.div>
        // </Rnd>
    );
};
