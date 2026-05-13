import { extendTheme } from "@chakra-ui/react";
import "@fontsource/urbanist";
import "@fontsource/urbanist/500.css";
import "@fontsource/urbanist/600.css";
import "@fontsource/urbanist/700.css";
import "@fontsource/urbanist/800.css";

// 2. Call `extendTheme` and pass your custom values
export const theme = extendTheme({
    initialColorMode: "light",
    useSystemColorMode: false,
    components: {
        Button: {
            variants: {
                videco: {
                    bg: "#05405A",
                    color: "white",
                    fontWeight: "normal",
                    _hover: {
                        bg: "#166183",
                    },
                },
            },
        },
    },
    colors: {
        black: "#383F40",
        darkBlue: "#1C1A2E",
        brand: {
            100: "#05405A",
            200: "#166183",
            300: "#3086AC",
            400: "#3086AC",
            500: "#3086AC",
            800: "#53ADD4",
        },
    },
    fonts: {
        heading: "Urbanist",
        body: "Urbanist",
        html: "Urbanist",
    },
    styles: {
        global: {
            // styles for the `body`
            body: {
                bg: "#F8F8F8",
                fontSize: "16px",
            },
        },
    },
});
