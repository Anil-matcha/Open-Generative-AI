import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useAnalytics() {
    const supabase = createClientComponentClient();

    const updateClickAnalytics = async (
        video_id: any,
        element_name: string,
    ) => {
        try {
            const click = localStorage.getItem("link_click") || false;
            const click_count = localStorage.getItem("link_click_count") || 1;
            if (click) {
                await supabase
                    .from("analytics")
                    .update([
                        {
                            data: {
                                user_agent: navigator.userAgent,
                                count: Number(click_count) + 1,
                                name: element_name,
                            },
                        },
                    ])
                    .eq("anoyomous_id", click)
                    .eq("event", "link_click");
            } else {
                localStorage.setItem("link_click_count", "1");
                await supabase
                    .from("analytics")
                    .insert([
                        {
                            video_id: video_id,
                            event: "link_click",
                            data: {
                                user_agent: navigator.userAgent,
                                count: click_count,
                                name: element_name,
                            },
                        },
                    ])
                    .select("anoyomous_id")
                    .then((res) => {
                        localStorage.setItem(
                            "link_click",
                            res.data[0].anoyomous_id,
                        );
                    });
            }
        } catch (error) {
            console.log("error..", error);
        }
    };

    return {
        updateClickAnalytics,
    };
}
