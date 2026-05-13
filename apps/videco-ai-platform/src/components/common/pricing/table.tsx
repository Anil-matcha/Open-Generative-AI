import {
    Box,
    Button,
    Flex,
    Input,
    Link,
    List,
    ListIcon,
    ListItem,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { PiCheckCircleFill } from "react-icons/pi";
import getStripe from "src/utils/load-stripe";
import { startTrial } from "src/services/api/startTrial";
import { CloseIcon } from "@chakra-ui/icons";
import { internalAPIRequest } from "src/services/api/stripe-event";
import { planSelector } from "src/utils/plans";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface PricingTableProps {
    freeLitePlan: boolean;
    user: any;
    expanded?: any;
}
const stripePromise = getStripe();

export const PricingTable = ({ user, expanded }: PricingTableProps) => {
    const [selectedPlan, setSelectedPlan] = useState("growth");
    const [showPaymentElement, setShowPaymentElement] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const supabase = createClientComponentClient();
    const [frequency, setFrequency] = useState("month");
    const [clientSecret, setClientSecret] = useState(null);
    const handleClose = () => {
        setShowPaymentElement(false); // Hide the Payment Element
    };

    const handleBuy = async () => {
        setIsLoading(true);
        await handleSubscriptions();
    };
    const handleSubscriptions = async () => {
        //check if user selected scale plan
        const isScalePlan = selectedPlan === "scale";
        const customer = await internalAPIRequest("/api/stripe/customer", {
            email: user.email,
            user_id: user.id,
        });
        if (!isScalePlan) {
            const subscribtion = await internalAPIRequest(
                "/api/stripe/subscribe",
                {
                    customer: customer.data.id,
                    user_id: user.id,
                    stripe_plan_id: planSelector(selectedPlan, frequency),
                    plan_name: selectedPlan,
                    promoCode: promoCode,
                },
            );

            setClientSecret(subscribtion.data.clientSecret);
            setShowPaymentElement(true); // Show the Payment Element
            setIsLoading(false);
        } else {
            setIsLoading(false);
            alert("this plan is coming soon. Please select another plan");
        }
    };

    return (
        <Flex direction="column" alignContent="center" w="full" mt={3}>
            {expanded && (
                <Flex justify="center" mx={["auto", 0]} mb={-2}>
                    <Stack
                        direction="row"
                        justify="space-between"
                        p="2"
                        textAlign="center"
                        rounded="xl"
                        bg="#F8F8F8"
                    >
                        <Button
                            colorScheme="teal"
                            rounded="xl"
                            fontWeight="normal"
                            variant={frequency === "month" ? "videco" : "ghost"}
                            onClick={() => setFrequency("month")}
                            px={6}
                        >
                            Monthly
                        </Button>
                        <Button
                            colorScheme="teal"
                            fontWeight="normal"
                            rounded="xl"
                            variant={frequency === "year" ? "videco" : "ghost"}
                            onClick={() => setFrequency("year")}
                            px={6}
                        >
                            Annually{" "}
                            <Text
                                as="span"
                                ml={2}
                                bg="#DADADA"
                                px={1}
                                py="1px"
                                rounded="md"
                                color="#05405A"
                                fontSize="xs"
                            >
                                save 10%
                            </Text>
                        </Button>
                    </Stack>
                </Flex>
            )}
            <Flex maxW="990px" w="full" mt={5}>
                <Box
                    border={`2px solid ${
                        selectedPlan === "lite" ? "#383F40" : "#dfdfdf"
                    }`}
                    bg={selectedPlan === "lite" ? "#F6F6F6" : "white"}
                    onClick={() => setSelectedPlan("lite")}
                    rounded="xl"
                    px={10}
                    py={6}
                    cursor="pointer"
                    minW={0}
                >
                    <Box>
                        <Text color="#383F40">For individuals</Text>
                        <Text fontWeight="bold" fontSize="24" color="#166183">
                            Lite
                        </Text>
                        <Text fontWeight="bold" color="#383F40">
                            €{frequency === "month" ? 19 : 17} / mo{" "}
                        </Text>
                    </Box>
                    <Box>
                        <List mt={3} spacing={3}>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />
                                1 workspace
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                100 dynamic videos
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                1 AI avatar
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                Video analytics{" "}
                            </ListItem>
                            {expanded && (
                                <>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        20 hosted videos
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Storage: 10GB
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Unlimited landing pages
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Interactive elements
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Basic integrations
                                    </ListItem>
                                </>
                            )}
                        </List>
                        <Button
                            bg="white"
                            rounded="full"
                            p={0}
                            m="24px auto 0"
                            border="2px solid #05405A"
                            width="20px"
                            height="20px"
                            maxW="full"
                            as="span"
                            minW="10px"
                            display="flex"
                        >
                            {selectedPlan === "lite" && (
                                <Button
                                    bg="#05405A"
                                    rounded="full"
                                    p={1}
                                    m="0 auto"
                                    as="span"
                                    width="12px"
                                    height="12px"
                                    maxW="full"
                                    minW="10px"
                                    display="flex"
                                ></Button>
                            )}
                        </Button>
                    </Box>
                </Box>
                <Box
                    border={`2px solid ${
                        selectedPlan === "growth" ? "#05405A" : "#dfdfdf"
                    }`}
                    bg={selectedPlan === "growth" ? "#F7F9FA" : "white"}
                    onClick={() => setSelectedPlan("growth")}
                    rounded="xl"
                    px={10}
                    py={6}
                    minW={0}
                    mx={6}
                    cursor="pointer"
                >
                    <Box>
                        <Text
                            rounded="md"
                            fontSize="sm"
                            as="span"
                            px={3}
                            py="4px"
                            color="white"
                            bg="#2B626E"
                        >
                            🔥 Popular
                        </Text>
                        <Text fontWeight="bold" fontSize="24" color="#166183">
                            Growth
                        </Text>
                        <Text fontWeight="bold" color="#383F40">
                            €{frequency === "month" ? 79 : 71} / mo{" "}
                        </Text>
                    </Box>
                    <Box>
                        <List mt={3} spacing={3}>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />
                                5 workspaces
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                1500 dynamic videos
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                5 AI avatars
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                Video analytics{" "}
                            </ListItem>
                            {expanded && (
                                <>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        100 hosted videos
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Storage: 100GB
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Interactive elements
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Zapier integrations
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        API access
                                    </ListItem>
                                </>
                            )}
                        </List>
                        <Button
                            bg="white"
                            rounded="full"
                            p={0}
                            m="24px auto 0"
                            border="2px solid #05405A"
                            width="20px"
                            height="20px"
                            maxW="full"
                            as="span"
                            minW="10px"
                            display="flex"
                        >
                            {selectedPlan === "growth" && (
                                <Button
                                    bg="#05405A"
                                    rounded="full"
                                    p={1}
                                    m="0 auto"
                                    as="span"
                                    width="12px"
                                    height="12px"
                                    maxW="full"
                                    minW="10px"
                                    display="flex"
                                ></Button>
                            )}
                        </Button>
                    </Box>
                </Box>
                <Box
                    border={`2px solid ${
                        selectedPlan === "scale" ? "#05405A" : "#dfdfdf"
                    }`}
                    bg={selectedPlan === "scale" ? "#F7F9FA" : "white"}
                    onClick={() => setSelectedPlan("scale")}
                    rounded="xl"
                    minW={0}
                    px={10}
                    py={6}
                    cursor="pointer"
                >
                    <Box>
                        <Text color="#383F40">For larger teams</Text>
                        <Text fontWeight="bold" fontSize="24" color="#166183">
                            Lifetime
                        </Text>
                        <Text fontWeight="bold" color="#383F40">
                            Coming soon
                        </Text>
                    </Box>

                    <Box>
                        <List mt={3} spacing={3}>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />
                                10 workspaces
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                3000 dynamic videos
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                10 AI avatars
                            </ListItem>
                            <ListItem>
                                <ListIcon
                                    as={PiCheckCircleFill}
                                    color="#383F40"
                                />{" "}
                                Video analytics{" "}
                            </ListItem>
                            {expanded && (
                                <>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        250 hosted videos
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Storage: 400GB
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Custom domain
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Brand kit
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon
                                            as={PiCheckCircleFill}
                                            color="#383F40"
                                        />{" "}
                                        Advanced integrations
                                    </ListItem>
                                </>
                            )}
                        </List>
                        <Button
                            bg="white"
                            rounded="full"
                            p={0}
                            m="24px auto 0"
                            border="2px solid #05405A"
                            width="20px"
                            height="20px"
                            maxW="full"
                            as="span"
                            minW="10px"
                            display="flex"
                        >
                            {selectedPlan === "scale" && (
                                <Button
                                    bg="#05405A"
                                    rounded="full"
                                    p={1}
                                    m="0 auto"
                                    as="span"
                                    width="12px"
                                    height="12px"
                                    maxW="full"
                                    minW="10px"
                                    display="flex"
                                ></Button>
                            )}
                        </Button>
                    </Box>
                </Box>
            </Flex>

            <Button
                zIndex={999}
                outline={0}
                px={20}
                className="buy-button"
                w={expanded ? "40%" : "60%"}
                py={6}
                fontWeight="normal"
                colorScheme="teal"
                bg="#05405A"
                variant="videco"
                rounded="md"
                fontSize="20px"
                display="flex"
                margin="32px auto"
                isLoading={isLoading}
                color="white"
                onClick={handleBuy}
            >
                {expanded ? "Upgrade" : "Get started now"}
            </Button>
            <Link
                margin="0 auto"
                href="https://videco.io/demo/"
                target="_blank"
            >
                Need more? Book a meeting with us
            </Link>

            {showPaymentElement && clientSecret && (
                <Box
                    position="fixed"
                    bg="white"
                    width={expanded ? "100%" : "65%"}
                    boxShadow="lg"
                    border="1px solid"
                    rounded="md"
                    zIndex={999}
                    p={12}
                    pt={32}
                    height="full"
                    w="full"
                    left={0}
                    top={0}
                >
                    <Input
                        display="flex"
                        maxW="md"
                        margin="12px auto"
                        width={expanded ? "50%" : "85%"}
                        type="text"
                        placeholder="Promo Code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <PaymentElementWrapper
                        handleClose={handleClose}
                        clientSecret={clientSecret}
                        expanded={expanded}
                    />
                </Box>
            )}
        </Flex>
    );
};
export default function PaymentForm({ handleClose, expanded }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
            toast({
                title: "Stripe has not loaded yet. Please try again later.",
                status: "error",
                duration: 500,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/campaign`, // Optional success page
            },
        });

        if (error) {
            toast({
                title: error.message,
                status: "error",
                duration: 500,
                isClosable: true,
            });
        } else {
            setMessage("Payment succeeded!");
        }

        setLoading(false);
    };

    return (
        <Box maxW="4xl" m="0 auto">
            {/* Close Button */}
            <Button
                onClick={handleClose}
                position="absolute"
                left={10}
                top={10}
            >
                <CloseIcon />
            </Button>

            <form
                onSubmit={handleSubmit}
                style={{
                    width: expanded ? "50%" : "85%",
                    margin: expanded ? "0 auto" : "auto",
                }}
            >
                <PaymentElement />
                <Button
                    zIndex={999}
                    outline={0}
                    px={20}
                    className="buy-button"
                    w="80%"
                    py={6}
                    fontWeight="normal"
                    colorScheme="teal"
                    bg="#05405A"
                    rounded="full"
                    fontSize="20px"
                    display="flex"
                    margin="32px auto"
                    _hover={{
                        bgGradient: "linear(to-l, #7928CA, #FF0080)",
                    }}
                    color="white"
                    type="submit"
                    disabled={!stripe || loading}
                >
                    {loading ? "Processing..." : "Pay and start creating"}
                </Button>
                {message && <div>{message}</div>}
            </form>
        </Box>
    );
}
// Wrapper to pass clientSecret to the PaymentForm
export function PaymentElementWrapper({ clientSecret, handleClose, expanded }) {
    const options = {
        clientSecret,
        defaultValues: {
            email: "", // Leave email blank to disable Link
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm handleClose={handleClose} expanded={expanded} />
        </Elements>
    );
}
