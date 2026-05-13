import { Box, Flex, GridItem, Text } from "@chakra-ui/react";
import { FiCalendar, FiDatabase, FiMessageSquare } from "react-icons/fi";
import React, { useEffect } from "react";
import { LinkIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useSession } from "@supabase/auth-helpers-react";
import Pricing from "@components/common/pricing";
import { rem } from "polished";

type NewElementsProps = {
    onSettingsActive?: any;
};

export const NewElements = ({
    onSettingsActive,
}: NewElementsProps): JSX.Element => {
    const router = useRouter();
    const session = useSession();
    const user = session?.user;
    const [plan, setPlan] = React.useState<any>();
    const [active, setActive] = React.useState<string>("");
    const [isHovered, setIsHovered] = React.useState("");
    const { getPlan } = useUserPlan();
    const [showPricing, setShowPricing] = React.useState<any>(false);
    const { setVideoMeta, meta } = useEditorStore();
    const supabase = createClientComponentClient();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, []);

    //Updating the db when theme is changed
    useEffect(() => {
        const updateDb = async () => {
            try {
                await supabase
                    .from("videos")
                    .update({
                        meta_data: {
                            player: {
                                bg: meta.player?.bg,
                                color: meta.player?.color,
                            },
                        },
                        endCTAlink: meta.endCTAlink,
                        endCTAtitle: meta.endCTAtitle,
                        endCTAtext: meta.endCTAtext,
                    })
                    .eq("id", router.query.id)
                    .select()
                    .then((res) => {
                        console.log("success..");
                    });
            } catch (error) {
                console.log("error..", error);
            }
        };
        updateDb();
    }, [
        meta.player?.bg,
        meta.player?.color,
        meta.endCTAlink,
        meta.endCTAtitle,
        meta.endCTAtext,
    ]);

    return (
        <GridItem rowSpan={3}>
            {showPricing && (
                <Pricing hidePiricng={() => setShowPricing(false)} />
            )}
            <Flex
                mt={[rem(10), 0, rem(50)]}
                bg="white"
                boxShadow="sm"
                rounded="8px"
                p={1}
                id="interactive-elements-new"
                py={4}
                justifyContent="center"
                alignItems={"center"}
                alignContent={"center"}
                overflowX="auto"
            >
                <Box
                    display="flex"
                    cursor="pointer"
                    border="1px solid #dddddd"
                    pos="relative"
                    onMouseEnter={() => setIsHovered("link")}
                    onMouseLeave={() => {
                        setIsHovered("");
                        setTimeout(() => {
                            setActive("");
                        }, 1000);
                    }}
                    _hover={{ bg: "gray.100" }}
                    onClick={() => {
                        onSettingsActive({ type: "link" });
                        setActive("link");
                    }}
                    shadow="md"
                    py={3}
                    mr={5}
                    px={6}
                    rounded="full"
                >
                    <Box zIndex={2} display="flex" alignItems="center">
                        <LinkIcon mr={2} />
                        <Text>Link</Text>
                    </Box>
                </Box>
                <Box
                    onClick={() => {
                        if (plan === "free" || plan === undefined) {
                            setShowPricing(true);
                        } else {
                            onSettingsActive({ type: "form" });
                            setActive("form");
                        }
                    }}
                    display="flex"
                    onMouseEnter={() => setIsHovered("form")}
                    onMouseLeave={() => {
                        setIsHovered("");
                        setTimeout(() => {
                            setActive("");
                        }, 1000);
                    }}
                    _hover={{ bg: "gray.100" }}
                    position="relative"
                    border="1px solid #dddddd"
                    cursor="pointer"
                    shadow="md"
                    py={3}
                    px={6}
                    rounded="full"
                >
                    <Box zIndex={2} display="flex" alignItems={"center"}>
                        <FiDatabase /> <Text ml={2}>Signup Form</Text>
                    </Box>
                </Box>
                <Box
                    display="flex"
                    cursor="pointer"
                    pos="relative"
                    onMouseEnter={() => setIsHovered("questions")}
                    onMouseLeave={() => {
                        setIsHovered("");
                        setTimeout(() => {
                            setActive("");
                        }, 1000);
                    }}
                    _hover={{ bg: "gray.100" }}
                    border="1px solid #dddddd"
                    shadow="md"
                    py={3}
                    ml={5}
                    px={6}
                    rounded="full"
                >
                    <Box
                        zIndex={2}
                        onClick={() => {
                            if (plan === "free" || plan === undefined) {
                                setShowPricing(true);
                            } else {
                                onSettingsActive({ type: "questions" });
                                setActive("questions");
                            }
                        }}
                        display="flex"
                        alignItems={"center"}
                    >
                        <FiMessageSquare /> <Text ml={2}>Survey</Text>
                    </Box>
                </Box>
                <Box
                    display="flex"
                    cursor="pointer"
                    pos="relative"
                    onMouseEnter={() => setIsHovered("calander")}
                    onMouseLeave={() => {
                        setIsHovered("");
                        setTimeout(() => {
                            setActive("");
                        }, 1000);
                    }}
                    border="1px solid #dddddd"
                    onClick={() => {
                        if (plan === "free" || plan === undefined) {
                            setShowPricing(true);
                        } else {
                            onSettingsActive({ type: "calander" });
                            setActive("calander");
                        }
                    }}
                    shadow="md"
                    py={3}
                    ml={5}
                    _hover={{ bg: "gray.100" }}
                    px={6}
                    rounded="full"
                >
                    <Box
                        zIndex={2}
                        onClick={() => {
                            if (plan === "free" || plan === undefined) {
                                setShowPricing(true);
                            } else {
                                onSettingsActive({ type: "calander" });
                                setActive("calander");
                            }
                        }}
                        display="flex"
                        alignItems={"center"}
                    >
                        <FiCalendar /> <Text ml={2}>Calendly</Text>
                    </Box>
                </Box>
            </Flex>
        </GridItem>
    );
};
