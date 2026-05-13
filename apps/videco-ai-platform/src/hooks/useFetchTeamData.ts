import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { useWorkspaces } from "src/store/workspace";

export function useFetchTeamData() {
    const supabase = createClientComponentClient();
    const session = useSession();
    const user = session?.user;
    const { workspace } = useWorkspaces();
    // get team user ids including owner
    const getTeamUserIds = async () => {
        try {
            return await supabase
                .from("sub_accounts")
                .select("main_account")
                .eq("shared_account", user.email)
                .then((res) => {
                    const team = supabase
                        .from("sub_accounts")
                        .select(
                            "shared_account, name, role, shared_account_user",
                        )
                        .eq("main_account", res.data[0].main_account)
                        .eq("workspace_id", workspace.id)
                        .order("role", { ascending: false });

                    return team.then((res) => {
                        return res.data;
                    });
                });
        } catch (error) {
            console.log("error..", error);
        }
    };

    // fetch data from all team members
    const getData = async (
        scheam: string,
        neq: { col: string; val: string },
    ) => {
        try {
            const teamIdResponse = await getTeamUserIds();
            const teamIds = teamIdResponse
                .filter((item) => item.shared_account_user !== null)
                .map((item) => item.shared_account_user);
            return await supabase
                .from(scheam)
                .select()
                .in("user_id", [teamIds])
                .neq(neq.col, neq.val)
                .eq("workspace_id", workspace.id)
                .order("created_at", { ascending: false })
                .then((res) => {
                    return res.data;
                });
        } catch (error) {
            console.log("error..", error);
        }
    };

    return {
        getData,
        getTeamUserIds,
    };
}
