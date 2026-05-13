import React, { useEffect, useRef, useState } from "react";
import { Box, Flex, Link, Spinner } from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { useUserPlan } from "src/hooks/useUserPlan";
const Recording: React.FC = () => {
    const session = useSession();
    const [plan, setPlan] = React.useState<any>();
    const user = session?.user;
    const router = useRouter();
    const [teamMembers, setTeamMembers] = useState<any>();
    const { getTeamUserIds, getData } = useFetchTeamData();
    const { getPlan } = useUserPlan();
    const supabase = createClientComponentClient();
    const [videos, setVideos] = React.useState<any>(0);
    const [videoSize, setVideoSize] = React.useState<any>(0);

    const getFullTeamMembers = async () => {
        const team = await getTeamUserIds();
        if (team) {
            setTeamMembers(team ?? []);
        }
    };
    const calculateTotalSize = (data) => {
        let totalSize = 0;
        data.forEach((item: { size: number }) => {
            totalSize += item.size;
        });
        return totalSize;
    };

    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
            const data = await getData("videos", {
                col: "status",
                val: "deleted",
            });
            data && setVideoSize(calculateTotalSize(data));
            setVideos(data?.length);
        };
        plan();
        getFullTeamMembers();
    }, [session, user]);
    useEffect(() => {
        window.onmessage = (event) => {
            event.source.window.postMessage("GOT_YOU_IFRAME", "*");
        };
    }, []);

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
                    <iframe
                        // src="https://videco-recording.vercel.app/"
                        src="http://localhost:5173/"
                        style={{ width: "100%", height: "100%" }}
                        allow="camera *;microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *; picture-in-picture *; "
                    ></iframe>
                </Sidebar>
            )}
        </>
    );
};

export default Recording;
