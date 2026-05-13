import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Circle from "react-color/lib/components/circle/Circle";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useSession } from "@supabase/auth-helpers-react";
import { useEditorStore } from "src/store/editor";
import Pricing from "@components/common/pricing";

const ThemeSidebar: React.FC = () => {
    const { setVideoMeta, meta } = useEditorStore();
    const session = useSession();
    const [showPricing, setShowPricing] = useState<any>(false);
    const user = session?.user;
    const { getPlan } = useUserPlan();
    const [plan, setPlan] = useState<any>();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, []);
    return (
        <Box>
            {showPricing && (
                <Pricing hidePiricng={() => setShowPricing(false)} />
            )}
            <Circle
                width="20px"
                color={meta.player?.bg ?? "#2F855A"}
                circleSize={20}
                colors={[
                    "#2F855A",
                    "#C53030",
                    "#ECC94B",
                    "#2B6CB0",
                    "#B2F5EA",
                    "#76E4F7",
                    "#6B46C1",
                    "#ED64A6",
                ]}
                circleSpacing={25}
                onChangeComplete={(color) => {
                    if (plan === "free" || plan === undefined) {
                        setShowPricing(true);
                    } else {
                        setVideoMeta({
                            ...meta,
                            player: {
                                bg: color.hex,
                                color: color.hex,
                            },
                        });
                    }
                }}
            />
        </Box>
    );
};
export default ThemeSidebar;
