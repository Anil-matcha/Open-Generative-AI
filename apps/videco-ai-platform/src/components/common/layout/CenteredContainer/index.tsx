import React, { FC } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";
import { rem } from "polished";

export const CenteredContainer: FC<CenteredContainerProps> = ({
    imageSrc,
    children,
    ...props
}) => {
    return (
        <Flex
            backgroundImage={imageSrc}
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            flex="1"
            direction="column"
            {...props}
            py={rem(72)}
            px={[rem(40), rem(71)]}
        >
            {children}
        </Flex>
    );
};

type CenteredContainerProps = FlexProps & {
    imageSrc?: string;
    imageProtrailSrc?: string;
};
