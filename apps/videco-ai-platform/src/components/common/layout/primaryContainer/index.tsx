import React, { FC } from "react";
import { FlexProps, GridItem } from "@chakra-ui/react";

export const PrimaryContainer: FC<PrimaryContainerProps> = ({
    imageSrc,
    imagePortraitSrc,
    children,
    ...props
}) => {
    return (
        <GridItem
            display="flex"
            backgroundImage={imageSrc}
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            flex="1"
            flexDirection="column"
            {...props}
            sx={{
                backgroundImage: imageSrc,
                paddingTop: "16",
                px: "20",
                paddingBottom: "18",
                marginTop: "72px",
                "@media (max-width: 992px)": {
                    backgroundImage: imagePortraitSrc,
                    paddingTop: "12",
                    px: "8",
                    paddingBottom: "14",
                    marginTop: "0px",
                },
            }}
        >
            {children}
        </GridItem>
    );
};

type PrimaryContainerProps = FlexProps & {
    imageSrc?: string;
    imagePortraitSrc?: string;
};
