import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Spinner,
    Text,
    Link,
    Button,
    useToast,
    Textarea,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import {
    FiArrowLeft,
    FiHelpCircle,
    FiPlay,
    FiStopCircle,
} from "react-icons/fi";
import { useUserPlan } from "src/hooks/useUserPlan";
import { Templates } from "@components/features/ai-clone/templates";

const Teleprompter: React.FC = () => {
    const supabase = createClientComponentClient();
    const [plan, setPlan] = useState<any>();
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);

    const [videoData, setVideoData] = useState<any>();
    const [aiCloneText, setAiCloneText] = useState<string>("");

    const [fullname, setFullname] = useState<any>("");

    const { getPlan } = useUserPlan();

    const session = useSession();
    const toast = useToast();
    const user = session?.user;
    const scrollRef = useRef(null);
    const [speed, setSpeed] = useState(1); // Adjust speed here (higher is faster)
    const [isScrolling, setIsScrolling] = useState(false);

    const getScript = (text) => {
        setAiCloneText(text);
    };

    useEffect(() => {
        let interval;
        if (isScrolling) {
            interval = setInterval(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop += speed; // Scroll smoothly
                }
            }, 50); // Adjust interval for smoothness
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isScrolling, speed]);

    const getFullName = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`full_name, onboard_completed`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            if (data.full_name) {
                setFullname(data.full_name);
                setLoading(false);
            }
        } catch (error) {
            console.log(error);
        }
    }, [user, supabase]);

    const router = useRouter();
    const { getData } = useFetchTeamData();
    const { clearVideo } = useEditorStore();

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);

            setPlan(fetchPlan?.[0]);
        };
        plan();
    }, [user, supabase]);
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            getFullName();
            const data = await getData("videos", {
                col: "status",
                val: "deleted",
            });

            if (data) {
                setVideoData(data ?? []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        clearVideo();
    }, [user, supabase]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);

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
                <Box>
                    <Box
                        bg="#05405A"
                        rounded="lg"
                        px={12}
                        py={6}
                        maxW="900"
                        m="12px auto"
                    >
                        <Text
                            color="white"
                            fontSize="3xl"
                            fontWeight="semibold"
                        >
                            Videco is there for you from the step 1. Let's
                            create your video together.
                        </Text>
                        <Button
                            mt={4}
                            fontSize="sm"
                            onClick={() => router.push("/campaign")}
                        >
                            <FiArrowLeft
                                style={{
                                    marginRight: "4px",
                                }}
                            />{" "}
                            Back to Videco
                        </Button>
                        <Button
                            mt={4}
                            variant="ghost"
                            color="white"
                            ml={2}
                            onClick={() =>
                                window?.open(
                                    "https://roadmap.videco.io/t/knowledgebase",
                                )
                            }
                            _hover={{
                                bg: "transparent",
                            }}
                        >
                            <FiHelpCircle />
                        </Button>
                    </Box>
                    {started && (
                        <>
                            <Button
                                mt={2}
                                position="fixed"
                                bg="white"
                                right={4}
                                zIndex={999}
                                top={0}
                                onClick={() => {
                                    setStarted(false);
                                    setIsScrolling(false);
                                }}
                            >
                                <FiStopCircle />
                            </Button>
                            <Box
                                pos="fixed"
                                height="full"
                                p={12}
                                color="white"
                                bg="black"
                                top={0}
                                overflowY="scroll"
                                fontSize={90}
                                ref={scrollRef}
                                left={0}
                                w="full"
                                zIndex={998}
                            >
                                {aiCloneText}
                            </Box>
                        </>
                    )}
                    <Box
                        pos="relative"
                        zIndex={9}
                        m="22px auto"
                        maxW="920px"
                        w="full"
                        px={6}
                        py={6}
                        mt={10}
                        border={"1px solid #DDEAF1"}
                        rounded="3xl"
                        bg="#FBFBFB"
                    >
                        <Templates getSelectedScript={getScript} />
                        <Box pos="relative">
                            <Textarea
                                placeholder="Type your script here"
                                onChange={(e) => setAiCloneText(e.target.value)}
                                border="1px solid"
                                minH="200px"
                                maxLength={650}
                                borderColor={
                                    aiCloneText.length === 650 ? "red" : "black"
                                }
                                value={aiCloneText}
                                bg="white"
                            />
                        </Box>
                        <Box display="flex" alignItems="center" mt={2}>
                            Speed:
                            <NumberInput
                                defaultValue={speed}
                                max={30}
                                onChange={(valueString) =>
                                    setSpeed(Number(valueString))
                                }
                                ml={1}
                                clampValueOnBlur={false}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Button
                                ml={2}
                                variant="videco"
                                onClick={() => {
                                    setStarted(true);
                                    setIsScrolling(true);
                                }}
                            >
                                <FiPlay />
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </>
    );
};
export default Teleprompter;
