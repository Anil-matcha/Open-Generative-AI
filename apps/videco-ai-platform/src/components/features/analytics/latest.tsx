import { Divider, Box, Text } from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Tooltip,
    CartesianGrid,
    XAxis,
    YAxis,
    Area,
} from "recharts";

type VideoData = {
    filterById?: any;
    range?: number;
};
export const LatestAnalytics: React.FC<VideoData> = ({
    filterById,
    range = 7,
}) => {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [videoData, setVideoData] = useState<any>([]);
    const [formattedVideoData, setFormattedVideoData] = useState<any>([]);
    const session = useSession();
    const user = session?.user;
    const data = [
        {
            name: "Mar 1",
            views: 200,
        },
        {
            name: "2",
            views: 100,
        },
        {
            name: "3",
            views: 10,
        },
        {
            name: "4",
            views: 300,
        },
        {
            name: "5",
            views: 100,
        },
        {
            name: "6",
            views: 100,
        },
        {
            name: "7",
            views: 200,
        },
    ];
    const [loading, setLoading] = useState(true);
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from("videos")
                .select(
                    "name, id, size, status, analytics ( id, data, event, created_at )",
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
    }, [user, supabase, filterById, range]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile, filterById, range]);
    useEffect(() => {
        const processedVideoData = videoData.map((item) => ({
            ...item,
            analytics: item.analytics
                .filter((item) => item.event === "view")
                .map((analytic) => ({
                    ...analytic,
                })),
            count: item.analytics[0]?.data.count,
            user_agent: item.analytics[0]?.data.user_agent,
        }));
        // Initialize an object to hold the count of analytics events for each day
        const analyticsCounts = {};

        // Get today's date
        const today: any = new Date();

        // Iterate through each item in the data array
        processedVideoData &&
            processedVideoData.forEach((item) => {
                // Iterate through the analytics array of the item
                item.analytics.forEach((analytic) => {
                    // Extract the date from the created_at field
                    const createdDate: any = new Date(analytic.created_at);

                    // Calculate the difference in days between today and the analytics date
                    const dayDiff = Math.ceil(
                        (today - createdDate) / (1000 * 60 * 60 * 24),
                    );
                    // Check if the analytics event occurred within the last 7 days
                    if (dayDiff >= 1 && dayDiff <= 7) {
                        // Get the date string in the format "YYYY-MM-DD"
                        const dateString = createdDate
                            .toISOString()
                            .split("T")[0];

                        // Increment the count for the corresponding date in the analyticsCounts object
                        analyticsCounts[dateString] =
                            (analyticsCounts[dateString] || 0) + 1;
                    }
                });
            });

        // Generate the data array based on the counted events for each day
        const finalData = [];
        for (let i = 0; i < range; i++) {
            // Calculate the date for each of the last 7 days
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split("T")[0];

            // Push an object representing the date and its corresponding views count
            finalData.push({
                date: dateString,
                name: dateString.split("-")[2],
                views: analyticsCounts[dateString] || 0,
            });
        }
        setFormattedVideoData(finalData);
    }, [user, getProfile, filterById, videoData, range]);

    return (
        <Box
            shadow="sm"
            rounded="md"
            border="1px solid #dcdcdc"
            w="full"
            mr={4}
            pt={6}
            mb={6}
        >
            <Text as="h2" fontSize="lg" fontWeight="semibold" mb={5} ml={5}>
                Total views last {range} days
            </Text>
            <Divider mb={5} />
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart
                    width={500}
                    height={360}
                    data={formattedVideoData}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid vertical={false} stroke="#e2f6f5" />
                    <defs>
                        <linearGradient
                            id="colorUv"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#129a74"
                                stopOpacity={0.1}
                            />
                            <stop
                                offset="95%"
                                stopColor="#FFFFFF"
                                stopOpacity={0.1}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />

                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey="views"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorUv)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};
