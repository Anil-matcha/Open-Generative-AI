import React, { FC } from "react";
import { Flex, FlexProps, Grid } from "@chakra-ui/react";

export const PageContainer: FC<PageContainerProps> = ({
    children,
    direction = "column",
    imageSrc,
    imagePortraitSrc,
    ...props
}) => {
    return (
        <Flex
            id="box"
            h="100vh"
            w="100%"
            bgRepeat="no-repeat"
            bgSize={["contain", "contain", "cover"]}
            sx={{
                flexDirection: direction,
                height: "100%",
                width: "100%",
                backgroundImage: imageSrc,
                "@media (max-width: 768px)": {
                    backgroundImage: imagePortraitSrc,
                    flexDirection: "column",
                },
            }}
        >
            <Grid
                templateColumns={[
                    "repeat(1, 1fr)",
                    "repeat(1, 1fr)",
                    "repeat(2, 1fr)",
                ]}
                w="100%"
                {...props}
            >
                {children}
            </Grid>
        </Flex>
    );
};

type PageContainerProps = FlexProps & {
    imageSrc?: string;
    imagePortraitSrc?: string;
};
