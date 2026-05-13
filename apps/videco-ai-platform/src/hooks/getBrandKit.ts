import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useBrandKit() {
    const supabase = createClientComponentClient();

    const getBrandKit = async (user_id: string) => {
        try {
            return await supabase
                .from("brand_kit")
                .select()
                .eq("user_id", user_id)
                .then((res) => {
                    return res.data;
                });
        } catch (error) {
            console.log("error..", error);
        }
    };

    return {
        getBrandKit,
    };
}
