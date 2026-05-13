import React, { useEffect } from "react";
import { Box, Flex, Text, chakra, useToast } from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { useSession } from "@supabase/auth-helpers-react";
import { useUserPlan } from "src/hooks/useUserPlan";
import { PricingTable } from "@components/common/pricing/table";
const Pricing: React.FC = () => {
    const [plan, setPlan] = React.useState<any>();
    const session = useSession();
    const { getPlan } = useUserPlan();
    const user = session?.user;
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]);
        };
        user?.id && plan();
    }, [user]);

    return (
        <Sidebar>
            <Box mt={0} h="full" bg="white">
                <Flex
                    w="full"
                    bg="white"
                    _dark={{
                        bg: "white",
                    }}
                    p={50}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        px="10"
                        bg="white"
                        _dark={{
                            bg: "white",
                        }}
                    >
                        <Box
                            w="full"
                            px={[10, null, 4]}
                            mx="auto"
                            textAlign="left"
                        >
                            <Text
                                mb={2}
                                textAlign="center"
                                fontSize="4xl"
                                fontWeight="bold"
                                lineHeight="tight"
                            >
                                Find a plan to power your videos
                            </Text>
                            <chakra.p
                                mb={2}
                                fontSize="md"
                                maxW="xl"
                                margin="auto"
                                color="gray.600"
                                textAlign="center"
                                _dark={{
                                    color: "gray.400",
                                }}
                            >
                                Discover how Videco can improve your B2B
                                company’s engagement, conversions, and revenue
                                with interactive video and easy to use platform.
                            </chakra.p>
                            <PricingTable
                                expanded
                                freeLitePlan={false}
                                user={user}
                            />
                        </Box>
                    </Box>
                </Flex>
            </Box>
        </Sidebar>
    );
};

export default Pricing;
