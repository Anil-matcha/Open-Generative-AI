import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";

export function useUserPlan() {
    const supabase = createClientComponentClient();
    const session = useSession();
    const user = session?.user;
    const getPlan = async (user_id?: string) => {
        try {
            return await supabase
                .from("plan")
                .select()
                .eq("user_id", user_id)
                .then((res) => {
                    return res.data;
                });
        } catch (error) {
            console.log("error..", error);
        }
    };
    const currentUserPlan = async () => {
        try {
            const fetchPlan = await supabase
                .from("plan")
                .select()
                .eq("user_id", user?.id)
                .then((res) => {
                    return res.data;
                });
            return fetchPlan?.[0];
        } catch (error) {
            console.log("error..", error);
        }
    };

    return {
        getPlan,
        currentUserPlan,
    };
}
