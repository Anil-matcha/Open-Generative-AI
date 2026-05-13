import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Heading,
    StatLabel,
    Stat,
    StatNumber,
    StatHelpText,
    Flex,
    Link,
    Spinner,
    Button,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import "ka-table/style.css";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { LatestAnalytics } from "@components/features/analytics/latest";
import { TopAnalytics } from "@components/features/analytics/top";
import Select from "react-select";
import { useUserPlan } from "src/hooks/useUserPlan";
import { ClickAnalytics } from "@components/features/analytics/click";
import { FiArrowRight } from "react-icons/fi";
const Analytics: React.FC = () => {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [videoData, setVideoData] = useState<any>();
    const [videoViews, setVideoViews] = useState<number>(0);
    const [videoPlays, setVideoPlays] = useState<number>(0);
    const [videoLeads, setVideoLeads] = useState<number>(0);
    const [videoFeedback, setVideoFeedback] = useState<number>(0);
    const [filterById, setFilterById] = useState<any>(null);
    const [filterByRange, setFilterByRange] = useState<any>(7);
    const [videoOptionsList, setVideoOptionsList] = useState<any>([]);
    const session = useSession();
    const user = session?.user;
    const { getPlan } = useUserPlan();
    const [plan, setPlan] = useState<any>();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, [user]);
    const [loading, setLoading] = useState(true);
    const videoOptions = [
        { value: 7, label: "Last 7 days" },
        { value: 30, label: "Last 30 days" },
        {
            value: `${plan !== "growth" ? "any" : 90}`,
            label: `Last 90 days ${
                plan !== "growth" ? "- Upgrade to Growth" : ""
            }`,
        },
    ];
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from("videos")
                .select(
                    "name, id, size, status, analytics ( id, data, event ), leads (id), feedback (id)",
                )
                .neq("status", "deleted")
                .eq("user_id", user?.id);

            if (filterById) {
                query = query.eq("id", filterById);
            }

            const { data, error, status } = await query;

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setVideoData(data ?? []);
                if (!filterById) {
                    setVideoOptionsList(
                        data
                            ?.map((item) => ({
                                value: item.id,
                                label: item.name,
                            }))
                            .concat([
                                {
                                    value: null,
                                    label: "All Videos",
                                },
                            ]),
                    );
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [user, supabase, filterById]);

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user, getProfile]);
    const processedVideoData = videoData?.map((item) => ({
        ...item,
        count: item.analytics[0]?.data.count,
        user_agent: item.analytics[0]?.data.user_agent,
    }));

    useEffect(() => {
        let viewsCount = 0;
        let playCount = 0;
        let leadsCount = 0;
        let feedbackCount = 0;
        if (processedVideoData) {
            processedVideoData.forEach((item) => {
                // Iterate through the analytics array of the item
                item.analytics.forEach((analytic) => {
                    // set the lenght as view count
                    if (analytic.event === "view") viewsCount += 1;
                    if (analytic.event === "video_play") playCount += 1;
                });
                item.leads.forEach((analytic) => {
                    leadsCount += 1;
                });
                item.feedback.forEach((analytic) => {
                    feedbackCount += 1;
                });
            });
        }
        setVideoViews(viewsCount);
        setVideoPlays(playCount);
        setVideoLeads(leadsCount);
        setVideoFeedback(feedbackCount);
    }, [processedVideoData]);

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
                    <Box h="full" bg="white">
                        <Flex
                            direction="column"
                            bg="white"
                            mb={6}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Analytics" />
                        </Flex>
                        <Flex
                            justifyContent="space-between"
                            w="full"
                            bg="white"
                        >
                            <Flex
                                direction={["column", "column", "column"]}
                                w="800px"
                                mr={2}
                            >
                                <Box ml={6} mb={4}>
                                    <Select
                                        placeholder="Select a video"
                                        options={videoOptionsList}
                                        onChange={(e: { value: number }) =>
                                            setFilterById(e.value)
                                        }
                                    />
                                </Box>
                                <Box ml={5} mb={4}>
                                    <Button
                                        onClick={() => router.push("/leads")}
                                        fontWeight="normal"
                                        variant="ghost"
                                        rightIcon={<FiArrowRight />}
                                    >
                                        {" "}
                                        In video form submissions
                                    </Button>
                                    <Button
                                        fontWeight="normal"
                                        variant="ghost"
                                        onClick={() => router.push("/feedback")}
                                        rightIcon={<FiArrowRight />}
                                    >
                                        {" "}
                                        In video feedback{" "}
                                    </Button>
                                </Box>
                                <Heading
                                    as="h1"
                                    mb={4}
                                    ml={6}
                                    w="full"
                                    size="full"
                                    display="flex"
                                    justifyContent="space-between"
                                >
                                    <Stat
                                        border={"1px solid #dcdcdc"}
                                        mr={5}
                                        bg="white"
                                        p="4"
                                        rounded="md"
                                    >
                                        <StatLabel mb="2">
                                            Total Plays
                                        </StatLabel>
                                        <StatNumber>
                                            {videoPlays ?? 0}
                                        </StatNumber>
                                        <StatHelpText
                                            mt="3"
                                            color="gray.600"
                                            fontWeight="light"
                                        >
                                            10 - Left
                                        </StatHelpText>
                                    </Stat>
                                    <Stat
                                        bg="white"
                                        p="4"
                                        rounded="md"
                                        border={"1px solid #dcdcdc"}
                                    >
                                        {(plan === "free" ||
                                            plan === undefined) && (
                                            <Box
                                                pos="absolute"
                                                bg="#a0a0a0"
                                                rounded="md"
                                                display="flex"
                                                alignItems="center"
                                                textAlign="center"
                                                justifyContent="center"
                                                color="white"
                                                flexDir="column"
                                                left={0}
                                                border="1px solid"
                                                top={0}
                                                w="full"
                                                h="full"
                                            >
                                                <StatLabel mb="2">
                                                    Total Views
                                                </StatLabel>
                                                <Link href="/pricing">
                                                    Upgrade
                                                </Link>{" "}
                                                to view more analytics
                                            </Box>
                                        )}
                                        <StatLabel mb="2">
                                            Total Views (all time)
                                        </StatLabel>
                                        <StatNumber>
                                            {videoViews ?? 0}
                                        </StatNumber>
                                    </Stat>
                                </Heading>
                                <Heading
                                    as="h1"
                                    mb={4}
                                    ml={6}
                                    w="full"
                                    size="full"
                                    display="flex"
                                    justifyContent="space-between"
                                >
                                    <Stat
                                        border={"1px solid #dcdcdc"}
                                        mr={5}
                                        bg="white"
                                        p="4"
                                        rounded="md"
                                    >
                                        <StatLabel mb="2">
                                            Total Form Submissions
                                        </StatLabel>
                                        {(plan === "free" ||
                                            plan === undefined) && (
                                            <Box
                                                pos="absolute"
                                                bg="#a0a0a0"
                                                rounded="md"
                                                display="flex"
                                                alignItems="center"
                                                textAlign="center"
                                                justifyContent="center"
                                                color="white"
                                                flexDir="column"
                                                left={0}
                                                border="1px solid"
                                                top={0}
                                                w="full"
                                                h="full"
                                            >
                                                <StatLabel mb="2">
                                                    Total Leads
                                                </StatLabel>
                                                <Link href="/pricing">
                                                    Upgrade
                                                </Link>{" "}
                                                to view more analytics
                                            </Box>
                                        )}
                                        <StatNumber>
                                            {videoLeads ?? 0}
                                        </StatNumber>
                                    </Stat>
                                    <Stat
                                        bg="white"
                                        p="4"
                                        rounded="md"
                                        border={"1px solid #dcdcdc"}
                                        minH="140px"
                                    >
                                        <StatLabel mb="2">
                                            Total Survey Submissions
                                        </StatLabel>
                                        {(plan === "free" ||
                                            plan === undefined) && (
                                            <Box
                                                pos="absolute"
                                                bg="#a0a0a0"
                                                rounded="md"
                                                display="flex"
                                                alignItems="center"
                                                textAlign="center"
                                                justifyContent="center"
                                                color="white"
                                                flexDir="column"
                                                left={0}
                                                border="1px solid"
                                                top={0}
                                                w="full"
                                                h="full"
                                            >
                                                <StatLabel mb="2">
                                                    Total survey submissions
                                                </StatLabel>
                                                <Link href="/pricing">
                                                    Upgrade
                                                </Link>{" "}
                                                to view more analytics
                                            </Box>
                                        )}
                                        <StatNumber>
                                            {videoFeedback ?? 0}
                                        </StatNumber>
                                    </Stat>
                                </Heading>
                                {processedVideoData && <TopAnalytics />}
                            </Flex>
                            <Flex
                                flexDir="column"
                                p={"7"}
                                pt={0}
                                w="full"
                                // height="422px"
                                mr="6"
                            >
                                <Box mb={4}>
                                    <Select
                                        placeholder="Select a range"
                                        options={videoOptions}
                                        onChange={(e: {
                                            value: number | string;
                                        }) => setFilterByRange(e.value)}
                                    />
                                </Box>
                                {videoData && (
                                    <LatestAnalytics
                                        filterById={filterById}
                                        range={filterByRange}
                                    />
                                )}{" "}
                                {videoData && (
                                    <ClickAnalytics
                                        filterById={filterById}
                                        range={filterByRange}
                                        plan={plan}
                                    />
                                )}
                            </Flex>
                        </Flex>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default Analytics;
