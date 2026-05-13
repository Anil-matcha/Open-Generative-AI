// create a simple functional component that will be used to display the top analytics

import {
    Divider,
    TableContainer,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Table,
    Flex,
    Box,
    Text,
    Link,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import { FiPlay } from "react-icons/fi";

export const TopAnalytics: React.FC = () => {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [videoData, setVideoData] = useState<any>();
    const session = useSession();
    const user = session?.user;
    const [loading, setLoading] = useState(true);
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("videos")
                .select("name, size, status, analytics ( id, data, event )")
                .neq("status", "deleted")
                .eq("user_id", user?.id);

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
    }, [user, supabase]);

    useEffect(() => {
        getProfile();
    }, [user, getProfile]);

    const processedVideoData = videoData?.map((item) => ({
        ...item,
        analytics: item.analytics
            .filter((item) => item.event === "view")
            .map((analytic) => ({
                ...analytic,
            })),
        count: item.analytics[0]?.data.count,
        user_agent: item.analytics[0]?.data.user_agent,
    }));

    const longestAnalyticsLength =
        processedVideoData &&
        Math.max(...processedVideoData.map((item) => item.analytics.length));

    const withPercentage =
        longestAnalyticsLength &&
        processedVideoData.map((item) => {
            const percentage =
                (item.analytics.length / longestAnalyticsLength) * 100;
            return { ...item, percentage: percentage };
        });

    return (
        <Box
            w="full"
            mr={4}
            pt={6}
            ml={6}
            mb={6}
            shadow="sm"
            rounded="md"
            border="1px solid #dcdcdc"
        >
            <Text as="h2" fontSize="lg" fontWeight="semibold" mb={5} ml={5}>
                Top videos (all time)
            </Text>
            <Divider mb={5} />
            <TableContainer mb={4}>
                <Table size="md" variant="unstyled">
                    <Thead>
                        <Tr>
                            <Th>Video name</Th>
                            <Th justifyContent="end" display="flex">
                                Views
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {withPercentage?.length ? (
                            withPercentage
                                .sort(
                                    (a, b) =>
                                        b.analytics.length - a.analytics.length,
                                )
                                .slice(0, 3)
                                .map((video) => (
                                    <Tr key={video.id}>
                                        <Td p={2}>
                                            <Box
                                                rounded="md"
                                                display="flex"
                                                ml={3}
                                                _hover={{ bg: "#6EC2D4" }}
                                                bg="#6EC2D4"
                                                w={video.percentage + "%"}
                                                alignItems="center"
                                            >
                                                <Box
                                                    p={2}
                                                    rounded="md"
                                                    color="#061819"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    <FiPlay
                                                        style={{
                                                            marginRight: "8px",
                                                        }}
                                                    />
                                                    {video.name}
                                                </Box>
                                            </Box>
                                        </Td>
                                        <Td justifyContent="end" display="flex">
                                            <Flex color="gray">
                                                {video.analytics.length}
                                            </Flex>
                                        </Td>
                                    </Tr>
                                ))
                        ) : (
                            <Text ml={6} mt={3}>
                                No data available. Start{" "}
                                <Link
                                    textDecor="underline"
                                    href="/videos/edit?type=upload"
                                >
                                    creating videos
                                </Link>{" "}
                                to see data here.
                            </Text>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
};
