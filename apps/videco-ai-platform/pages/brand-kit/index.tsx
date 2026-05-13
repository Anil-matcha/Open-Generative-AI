import React, { useCallback, useEffect, useState } from "react";
import {
    Grid,
    GridItem,
    Button,
    Box,
    Flex,
    Spinner,
    Text,
    Link,
    Input,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Divider,
    SimpleGrid,
    useToast,
} from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { Sidebar } from "@components/common/sidebar";
import { BlockPicker, SketchPicker } from "react-color";

import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { Formik, Form, Field } from "formik";

const BrandKit: React.FC = () => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [noBrandkit, setNoBrandkit] = useState(false);
    const [primaryColor, setPrimaryColor] = useState("#05405A");
    const [primaryTextColor, setPrimaryTextColor] = useState("#ffffff");
    const [secondaryColor, setSecondaryColor] = useState("#4991A1");
    const [secondaryTextColor, setsecondaryTextColor] = useState("#000000");
    const session = useSession();
    const toast = useToast();
    const user = session?.user;
    const router = useRouter();
    const getBrandKit = async () => {
        try {
            const { data, error } = await supabase
                .from("brand_kit")
                .select()
                .eq("user_id", session?.user?.id)
                .single();
            if (data) {
                setPrimaryColor(data.primary_color ?? "#05405A");
                setSecondaryColor(data.secondary_color ?? "#4991A1");
                setPrimaryTextColor(data.primary_text_color ?? "#ffffff");
                setsecondaryTextColor(data.secondary_text_color ?? "#000000");
                setNoBrandkit(false);
            } else {
                setNoBrandkit(true);
            }
        } catch (error) {
            console.log("error..", error);
        }
    };
    useEffect(() => {
        getBrandKit();
    }, [session]);
    const updateDb = async (brandType, value) => {
        try {
            if (noBrandkit) {
                await supabase
                    .from("brand_kit")
                    .insert({
                        user_id: session?.user?.id,
                        [brandType]: value,
                    })
                    .then((res) => {
                        setNoBrandkit(true);
                        toast({
                            title: "Brand Kit updated",
                            status: "success",
                            duration: 500,
                            isClosable: true,
                        });
                    });
            } else {
                await supabase
                    .from("brand_kit")
                    .update({
                        [brandType]: value,
                    })
                    .eq("user_id", session?.user?.id)
                    .select()
                    .then((res) => {
                        toast({
                            title: "Brand Kit updated",
                            status: "success",
                            duration: 500,
                            isClosable: true,
                        });
                    });
            }
        } catch (error) {
            toast({
                title: "Brand Kit has an error",
                status: "error",
                duration: 500,
                isClosable: true,
            });
        }
    };
    const updateBrandKit = async (brandType, value) => {
        switch (brandType) {
            case "primaryColor":
                setPrimaryColor(value);
                updateDb("primary_color", value);
                break;
            case "secondaryColor":
                setSecondaryColor(value);
                updateDb("secondary_color", value);
                break;
            case "primaryTextColor":
                setPrimaryTextColor(value);
                updateDb("primary_text_color", value);
                break;
            case "secondaryTextColor":
                setsecondaryTextColor(value);
                updateDb("secondary_text_color", value);
                break;
        }
    };

    return (
        <>
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    flexDirection="column"
                    height="full"
                    width="full"
                >
                    <Spinner size="xl" />
                    <Link mt={7} href="/auth/login">
                        Please Login
                    </Link>
                </Box>
            ) : (
                <Sidebar>
                    <Flex
                        direction="column"
                        bg="white"
                        mb={1}
                        boxShadow="sm"
                        w="full"
                    >
                        <Header pageTitle="Brand Kit" />
                    </Flex>
                    <Grid
                        templateColumns={[
                            null,
                            "repeat(12, 1fr)",
                            "repeat(12, 1fr)",
                        ]}
                        h="full"
                        textColor="black"
                    >
                        <GridItem
                            pr={8}
                            w="full"
                            colSpan={12}
                            h="full"
                            bg="white"
                        >
                            <Flex
                                mt={12}
                                direction={["column", "column", "column"]}
                            >
                                <Box ml="7" margin="0 auto" w="lg">
                                    <Text
                                        fontSize="2xl"
                                        mb={6}
                                        fontWeight="bold"
                                    >
                                        Update your brand kit
                                    </Text>
                                    <Divider />
                                    <SimpleGrid columns={2} spacing={10} mt={5}>
                                        <Box>
                                            <Text
                                                textAlign="left"
                                                fontSize="lg"
                                                fontWeight="semibold"
                                                mb={2}
                                            >
                                                Primary Button Color
                                            </Text>
                                            <BlockPicker
                                                color={primaryColor}
                                                onChange={(color) =>
                                                    updateBrandKit(
                                                        "primaryColor",
                                                        color.hex,
                                                    )
                                                }
                                            />
                                        </Box>
                                        <Box>
                                            <Text
                                                textAlign="left"
                                                fontSize="lg"
                                                fontWeight="semibold"
                                                mb={2}
                                            >
                                                Secondary Button Color
                                            </Text>
                                            <BlockPicker
                                                color={secondaryColor}
                                                onChange={(color) =>
                                                    updateBrandKit(
                                                        "secondaryColor",
                                                        color.hex,
                                                    )
                                                }
                                            />
                                        </Box>
                                        <Box>
                                            <Text
                                                textAlign="left"
                                                fontSize="lg"
                                                fontWeight="semibold"
                                                mb={2}
                                            >
                                                Primary Text Color
                                            </Text>
                                            <BlockPicker
                                                color={primaryTextColor}
                                                onChange={(color) =>
                                                    updateBrandKit(
                                                        "primaryTextColor",
                                                        color.hex,
                                                    )
                                                }
                                            />
                                        </Box>
                                        <Box>
                                            <Text
                                                textAlign="left"
                                                fontSize="lg"
                                                fontWeight="semibold"
                                                mb={2}
                                            >
                                                Secondary Text Color
                                            </Text>
                                            <BlockPicker
                                                color={secondaryTextColor}
                                                onChange={(color) =>
                                                    updateBrandKit(
                                                        "secondaryTextColor",
                                                        color.hex,
                                                    )
                                                }
                                            />
                                        </Box>
                                    </SimpleGrid>
                                </Box>
                            </Flex>
                        </GridItem>
                    </Grid>
                </Sidebar>
            )}
        </>
    );
};
export default BrandKit;
