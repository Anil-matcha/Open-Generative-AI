import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { isRestExpired } from "src/utils/isTrialExpierd";
import { planUsage } from "src/utils/plans";

async function handleDeduct(req, res) {
    if (req.method === "POST") {
        const { user_id } = req.body;
        try {
            const supabase = createClientComponentClient();
            //Video Limit update
            const videos = await supabase
                .from("videos")
                .select()
                .eq("user_id", user_id);
            //AI Video Limit update
            const ai_videos = await supabase
                .from("ai_videos")
                .select()
                .eq("user_id", user_id);
            //Sub account Limit update
            const sub_accounts = await supabase
                .from("sub_accounts")
                .select()
                .eq("main_account", user_id);

            const currentPlan = await supabase
                .from("plan")
                .select()
                .eq("user_id", user_id);

            const resetExpired = isRestExpired(
                currentPlan.data[0].last_reset_date,
            );

            const { error, data } = await supabase
                .from("plan")
                .update({
                    dynamic_videos_limit: resetExpired
                        ? planUsage(currentPlan.data[0].plan_name)
                              .dynamicVideos[1]
                        : planUsage(currentPlan.data[0].plan_name)
                              .dynamicVideos[1] - ai_videos.data.length,
                    video_limit: resetExpired
                        ? planUsage(currentPlan.data[0].plan_name).videos[1]
                        : Number(
                              planUsage(currentPlan.data[0].plan_name)
                                  .videos[1],
                          ) - videos.data.length,
                    seat_limit: resetExpired
                        ? planUsage(currentPlan.data[0].plan_name).seat[1]
                        : planUsage(currentPlan.data[0].plan_name).seat[1] -
                          sub_accounts.data.length,
                    credits: 0,
                    last_reset_date: resetExpired
                        ? new Date().toJSON().slice(0, 10)
                        : currentPlan.data[0].last_reset_date,
                })
                .eq("user_id", user_id)
                .select();

            if (data) {
                res.status(200).json({
                    data,
                });
            }
            if (error) {
                res.status(500).json({
                    status: "credit usage errored",
                });
            }
        } catch (err) {
            res.status(500).json({ error: err });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}

export default handleDeduct;
