import {
    Box,
    Heading,
    Text,
    Divider,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    chakra,
    Container,
    Flex,
    useColorModeValue,
    Tag,
} from "@chakra-ui/react";
import { LatestAnalytics } from "@components/features/analytics/latest";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import "ka-table/style.css";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FiEye, FiPlay } from "react-icons/fi";

import { useBrandKit } from "src/hooks/getBrandKit";
import { useUserPlan } from "src/hooks/useUserPlan";

type PageInsightsProps = {
    videoUrl: string;
    videoType: string;
    meta: any;
};
export const PageInsights: React.FC<PageInsightsProps> = ({
    videoUrl,
    videoType,
    meta,
}) => {
    const router = useRouter();
    const { getBrandKit } = useBrandKit();
    const [videoData, setVideoData] = useState<any>();
    const [videoViews, setVideoViews] = useState<number>(0);
    const [leadsData, setLeadsData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [videoPlays, setVideoPlays] = useState<number>(0);
    const [linkClicks, setLinkClicks] = useState<number>(0);
    const [videoLeads, setVideoLeads] = useState<number>(0);
    const [videoFeedback, setVideoFeedback] = useState<number>(0);
    const [filterById, setFilterById] = useState<any>(router.query?.id);
    const [filterByRange, setFilterByRange] = useState<any>(7);
    const [brandKit, setBrandKit] = useState({
        primary_color: "#05405A",
        secondary_color: "#1A202C",
        primary_text_color: "#ffffff",
        secondary_text_color: "#ffffff",
    });
    const supabase = createClientComponentClient();
    const [plan, setPlan] = useState<any>();
    const session = useSession();
    const user = session?.user;
    const { getPlan } = useUserPlan();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]);
        };
        plan();
        getBrandKit(user?.id).then((res) => {
            if (res?.[0]) {
                setBrandKit(res?.[0]);
            }
        });
    }, []);

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
        let clickCount = 0;
        let leadsCount = 0;
        let feedbackCount = 0;
        if (processedVideoData) {
            processedVideoData.forEach((item) => {
                // Iterate through the analytics array of the item
                item.analytics.forEach((analytic) => {
                    // set the lenght as view count
                    if (analytic.event === "view") viewsCount += 1;
                    if (analytic.event === "video_play") playCount += 1;
                    if (analytic.event === "link_click") clickCount += 1;
                });
                item.leads.forEach((analytic) => {
                    leadsCount += 1;
                });
                item.feedback.forEach((analytic) => {
                    feedbackCount += 1;
                });
            });
        }
        const statusMapping: Record<string, string> = {
            page_view: "Landing Page Visit",
            video_play: "Landing Page Visit",
            view: "Video Played",
            link_click: "Link Clicked",
        };
        const uniqueLeads = new Set<string>();

        const leads = processedVideoData?.[0].analytics
            .filter((item) => item.data.lead) // Get only events with a lead property
            .filter((item) => {
                const key = `${item.data.lead}-${item.event}`; // Unique key for each lead-event pair
                if (uniqueLeads.has(key)) return false; // Skip duplicates
                uniqueLeads.add(key);
                return true;
            })
            .map((item) => ({
                name: item.data.lead,
                status: statusMapping[item.event] || "Unknown Event",
            }));
        setLeadsData(leads);
        setLinkClicks(clickCount);
        setVideoViews(viewsCount);
        setVideoPlays(playCount);
        setVideoLeads(leadsCount);
        setVideoFeedback(feedbackCount);
    }, [videoData]);

    return (
        <Box
            bg="#ffffff"
            height="full"
            overflow="auto"
            mt={0}
            w="full"
            pt={82}
            display="flex"
            flexDir="column"
            alignItems="left"
        >
            <>
                <Box
                    w="full"
                    m={0}
                    height="full"
                    p={0}
                    display="flex"
                    flexDirection="row"
                >
                    <Box w="60%" pl={12}>
                        <Container maxW="full" py={10} px={4}>
                            <Box
                                border="1px solid"
                                borderColor="gray.400"
                                rounded="md"
                                boxShadow="lg"
                                overflow="hidden"
                            >
                                <Flex justifyContent="left" p={5}>
                                    <chakra.h3
                                        fontSize="xl"
                                        fontWeight="bold"
                                        textAlign="center"
                                    >
                                        Analytics by leads
                                    </chakra.h3>
                                </Flex>
                                <Divider />
                                <TableContainer>
                                    {leadsData && !leadsData.length ? (
                                        <Box textAlign="center" w="full" p={12}>
                                            Not enough data
                                        </Box>
                                    ) : (
                                        <Table size="md">
                                            <Thead>
                                                <Tr fontWeight="900">
                                                    <Th>Lead</Th>
                                                    {/* <Th>Play Time</Th> */}
                                                    <Th>Status</Th>
                                                    <Th>Play time</Th>
                                                    <Th>Visits</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {leadsData &&
                                                    leadsData.map(
                                                        (network, index) => (
                                                            <Tr key={index}>
                                                                <Td fontSize="sm">
                                                                    {
                                                                        network.name
                                                                    }
                                                                </Td>
                                                                <Td>
                                                                    <Tag
                                                                        bg="#4991A1"
                                                                        color="white"
                                                                    >
                                                                        {
                                                                            network.status
                                                                        }
                                                                    </Tag>
                                                                </Td>
                                                                <Td
                                                                    fontSize="sm"
                                                                    color="gray.500"
                                                                >
                                                                    Coming soon
                                                                </Td>
                                                                <Td
                                                                    fontSize="sm"
                                                                    color="gray.500"
                                                                >
                                                                    Coming soon
                                                                </Td>
                                                            </Tr>
                                                        ),
                                                    )}
                                            </Tbody>
                                        </Table>
                                    )}
                                </TableContainer>
                            </Box>
                        </Container>
                    </Box>
                    <Divider ml={10} mr={3} orientation="vertical" />

                    <Box
                        ml={5}
                        // bg="#F6F6F6"
                        w="40%"
                        pl={2}
                        height="100vh"
                        color="#383F40"
                    >
                        <Box
                            mt={4}
                            fontSize="3xl"
                            fontWeight="semibold"
                            display="flex"
                            alignItems="center"
                            pr={8}
                            justifyContent="space-evenly"
                        >
                            <Box
                                display="flex"
                                bg="#2B626E"
                                color="white"
                                alignItems="left"
                                flexDir="column"
                                px={5}
                                py={2}
                                rounded="md"
                                w="full"
                            >
                                <Text
                                    fontSize="sm"
                                    fontWeight="normal"
                                    mt={2}
                                    as="span"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiEye fontWeight="bold" fontSize="20px" />
                                    <Text as="span" ml={2} color="white">
                                        Total Views
                                    </Text>
                                </Text>
                                <Box
                                    flexDir="row"
                                    display="flex"
                                    mt={1}
                                    alignItems="center"
                                >
                                    <Text> {videoViews} </Text>
                                </Box>
                            </Box>
                            <Box
                                display="flex"
                                bg="#CDD9DE"
                                alignItems="left"
                                flexDir="column"
                                px={5}
                                py={2}
                                ml={4}
                                rounded="md"
                                w="full"
                            >
                                <Text
                                    fontSize="sm"
                                    fontWeight="normal"
                                    mt={2}
                                    as="span"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiPlay fontWeight="bold" fontSize="20px" />
                                    <Text as="span" ml={2} color="#383F40">
                                        Total Plays
                                    </Text>
                                </Text>
                                <Box
                                    flexDir="row"
                                    display="flex"
                                    mt={1}
                                    alignItems="center"
                                >
                                    <Text> {videoPlays} </Text>
                                </Box>
                            </Box>
                            <Box
                                display="flex"
                                bg="#adeee1"
                                alignItems="left"
                                flexDir="column"
                                px={5}
                                py={2}
                                ml={4}
                                rounded="md"
                                w="full"
                            >
                                <Text
                                    fontSize="sm"
                                    fontWeight="normal"
                                    mt={2}
                                    as="span"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiPlay fontWeight="bold" fontSize="20px" />
                                    <Text as="span" ml={2} color="#383F40">
                                        CTA Clicks
                                    </Text>
                                </Text>
                                <Box
                                    flexDir="row"
                                    display="flex"
                                    mt={1}
                                    alignItems="center"
                                >
                                    <Text> {linkClicks} </Text>
                                </Box>
                            </Box>
                        </Box>
                        <Flex
                            flexDir="column"
                            p={"0"}
                            pt={0}
                            mt={5}
                            w="95%"
                            height="522px"
                            mr="0"
                        >
                            <LatestAnalytics
                                filterById={filterById}
                                range={filterByRange}
                            />
                        </Flex>
                    </Box>
                </Box>
            </>
        </Box>
    );
};
