import React, { useEffect, useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { AppProps } from "next/app";
import { Box, ChakraProvider } from "@chakra-ui/react";
import { useLanguageStore } from "src/store/language";
import { ILanguage } from "src/store/types";
import Head from "next/head";
import { appWithTranslation } from "@i18n";
// import posthog from "posthog-js";
import { theme } from "src/utils/theme";
import TagManager from "react-gtm-module";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
declare global {
    interface Window {
        Trengo: {
            key: string;
        };
        usetifulTags: any;
        $crisp: any[];
        shotstack: any;
        po: any;
        CRISP_WEBSITE_ID: string;
    }
}

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
    const [supabase] = useState(() => createPagesBrowserClient());
    const router = useRouter();
    const env = process.env.NODE_ENV;

    const { language, languages, setLanguage } = useLanguageStore();
    const [currentLanguage, setCurrentLanguage] = useState<
        ILanguage | undefined
    >();
    // if (env !== "development") {
    //     posthog?.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    //         api_host: "https://eu.i.posthog.com",
    //     });
    // }

    const tagManagerArgs = {
        gtmId: "GTM-KG3QRFCQ",
    };

    useEffect(() => {
        setCurrentLanguage(language);
    }, [language]);
    const authRegex = /^\/auth\//;
    const embedRegex = /^\/embed\//;
    useEffect(() => {
        const isAuthPath = authRegex.test(router.pathname);
        const isEmbedRegexPath = embedRegex.test(router.pathname);
        if (!isAuthPath && !isEmbedRegexPath) {
            window.$crisp = [];
            window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

            (function () {
                const d = document;
                const s = d.createElement("script");
                s.src = "https://client.crisp.chat/l.js";
                s.async = true;
                d.getElementById("CHAT").appendChild(s);
            })();
        }
    }, [router]);
    useEffect(() => {
        TagManager.initialize(tagManagerArgs);
    }, []);
    const AnyComponent = Component as any;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
            }}
            height="100vh"
            width={["initial", "initial", null]}
        >
            <style jsx global>{`
                @font-face {
                    font-family: "Inter", sans-serif;
                }
                html {
                    font-family: "Inter", sans-serif;
                }
            `}</style>
            <Head>
                <title>Videco</title>
            </Head>
            <ChakraProvider theme={theme}>
                <SessionContextProvider
                    supabaseClient={supabase}
                    initialSession={pageProps.initialSession}
                >
                    {/* <Alert
                        textAlign="center"
                        justifyContent="center"
                        p={6}
                        status="info"
                    >
                        <AlertIcon />
                        Get 60% off on all plans. Use code{" "}
                    </Alert> */}
                    <AnyComponent {...pageProps} />
                </SessionContextProvider>
            </ChakraProvider>
            <Box id="CHAT" />
        </Box>
    );
}

export default appWithTranslation(MyApp);
