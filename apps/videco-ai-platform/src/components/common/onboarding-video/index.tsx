import { FC, useCallback, useEffect, useState } from "react";
import { OnBoardingVideoLoader } from "./loader";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { OnBoardingVideoFrame } from "./video";

export const OnBoardingVideo: FC<{
    helpOff?: boolean;
}> = ({ helpOff = false }) => {
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [onboardingVideo, setOnboardingVideo] = useState("");
    const [name, setName] = useState("There");
    const [fetchAgain, setFetchAgain] = useState(false);
    const session = useSession();
    const user = session?.user;
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            setFetchAgain(false);
            const { data, error, status } = await supabase
                .from("profiles")
                .select(`onboarding_video, full_name`)
                .eq("id", user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }
            setName(data?.full_name);
            if (data.onboarding_video === "in_progress") {
                //@TODO: fetch again
                //WAITING
                setFetchAgain(true);
                setLoading(true);
            }
            if (
                data.onboarding_video &&
                data.onboarding_video !== "in_progress"
            ) {
                setLoading(false);
                setOnboardingVideo(data.onboarding_video);
            }

            if (!data.onboarding_video) {
                setOnboardingVideo(
                    "https://res.cloudinary.com/dhd6m0fh3/video/upload/v1739281468/videcoteam_kuwe0v.mov",
                );
            }
        } catch (error) {
            console.log(error);
        }
    }, [user, supabase]);
    useEffect(() => {
        getProfile();
    }, [user, getProfile, fetchAgain]);
    return onboardingVideo ? (
        <OnBoardingVideoFrame
            name={name}
            helpOff={helpOff}
            video={onboardingVideo}
        />
    ) : (
        <OnBoardingVideoLoader />
    );
};
