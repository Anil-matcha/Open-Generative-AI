import React, { ReactElement } from "react";
import {
    render as baseRender,
    RenderOptions,
    RenderResult,
} from "@testing-library/react";

import { ChakraProvider } from "@chakra-ui/react";

/**
 * Custom renderer example with @testing-library/react
 * You can customize it to your needs.
 *
 * To learn more about customizing renderer,
 * please visit https://testing-library.com/docs/react-testing-library/setup
 */

export const AllTheProviders = ({ children }: any) => {
    return (
        <>
            <ChakraProvider theme={{}}>{children}</ChakraProvider>
        </>
    );
};

const render = (ui: ReactElement, options?: Omit<RenderOptions, "queries">) =>
    baseRender(ui, { wrapper: AllTheProviders, ...options }) as RenderResult;

// re-export everything
export * from "@testing-library/react";

// override render method
export { render };
