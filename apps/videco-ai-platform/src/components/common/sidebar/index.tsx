import React, { ReactNode, useEffect } from "react";
import {
    IconButton,
    Box,
    CloseButton,
    Flex,
    Icon,
    useColorModeValue,
    Link,
    Drawer,
    DrawerContent,
    Text,
    useDisclosure,
    BoxProps,
    FlexProps,
    Image,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Avatar,
    MenuDivider,
    Divider,
    Progress,
    useToast,
} from "@chakra-ui/react";
import {
    PiConfetti,
    PiFinnTheHuman,
    PiMagicWandBold,
    PiRobot,
} from "react-icons/pi";
import {
    FiHome,
    FiTrendingUp,
    FiVideo,
    FiSettings,
    FiMenu,
    FiMessageSquare,
    FiUpload,
    FiGitBranch,
    FiSlack,
    FiSend,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import { planUsage } from "src/utils/plans";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { WokspaceSwitcher } from "./workspace";
import { SupportIcon } from "../icons";

interface LinkItemProps {
    name: string;
    url: string;
    target: string;
    beta?: boolean;
    icon: IconType;
    type: "item" | "section";
}
const LinkItems: Array<LinkItemProps> = [
    {
        name: "Create",
        target: "_self",
        url: "/",
        icon: FiHome,
        type: "section",
    },
    {
        name: "Campaigns",
        target: "_self",
        url: "/campaign",
        icon: FiSend,
        type: "item",
    },
    {
        name: "AI Clones",
        target: "_self",
        url: "/clones",
        beta: true,
        icon: PiFinnTheHuman,
        type: "item",
    },
    {
        name: "Video Library",
        target: "_self",
        url: "/videos",
        icon: FiUpload,
        type: "item",
    },
    {
        name: "Data",
        target: "_self",
        url: "/analytics",
        icon: FiTrendingUp,
        type: "item",
    },
    {
        name: "Manage",
        target: "_self",
        url: "/",
        icon: FiHome,
        type: "section",
    },
    {
        name: "Automation",
        target: "_self",
        url: "/automation",
        beta: true,
        icon: PiRobot,
        type: "item",
    },
    {
        name: "Integrations",
        target: "_self",
        url: "/integrations",
        icon: FiGitBranch,
        type: "item",
    },
    {
        name: "Settings",
        target: "_self",
        url: "/settings",
        icon: FiSettings,
        type: "item",
    },
];

export function Sidebar({ children }: { children: ReactNode }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box minH="100vh">
            <SidebarContent
                onClose={() => onClose}
                display={{ base: "none", md: "block" }}
            />
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>
            {/* mobilenav */}
            <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
            <Box ml={{ base: 0, md: 60 }} h="full" zIndex={800} bg="white">
                {children}
            </Box>
        </Box>
    );
}

interface SidebarProps extends BoxProps {
    onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
    const router = useRouter();
    const session = useSession();
    const toast = useToast();

    const user = session?.user;
    const [plan, setPlan] = React.useState<any>();
    const { getPlan } = useUserPlan();
    const { getData } = useFetchTeamData();
    const [trail, setTrail] = React.useState<any>();
    const [videos, setVideos] = React.useState<any>(0);
    const [videoSize, setVideoSize] = React.useState<any>(0);
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
            setTrail(fetchPlan?.[0]);
            const data = await getData("videos", {
                col: "status",
                val: "deleted",
            });
            data && setVideoSize(calculateTotalSize(data));
            setVideos(data?.length);
        };
        plan();
    }, [user]);
    useEffect(() => {
        if (trail?.video_limit < 0) {
            toast({
                title: (
                    <>
                        You have reached your video limit.{" "}
                        <a href="/pricing">Upgrade your plan</a>
                    </>
                ),
                status: "error",
                duration: null,
                isClosable: false,
            });
        }
        if (trail?.dynamic_videos_limit < 0) {
            toast({
                title: (
                    <>
                        You have reached your dynamic video limit.{" "}
                        <a href="/pricing">Upgrade your plan</a>
                    </>
                ),
                status: "error",
                duration: null,
                isClosable: false,
            });
        }
    }, [plan]);

    useEffect(() => {
        // Load the ProductLift SDK script dynamically when the component is mounted
        const script = document.createElement("script");
        script.src = "https://roadmap.videco.io/widgets_sdk";
        script.defer = true;
        document.body.appendChild(script);

        // Cleanup function to remove the script when the component is unmounted
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleClick = (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        // ProductLift should handle the link click automatically based on the data-productlift-widget attribute
    };
    return (
        <Box
            bg="white"
            borderRight="1px"
            color="white"
            borderRightColor="gray.200"
            w={{ base: "full", md: 60 }}
            pos="fixed"
            overflowY="auto"
            h="full"
            {...rest}
        >
            <Flex h="20" alignItems="center" justifyContent="center" mb="-30px">
                <Text fontSize="2xl" fontFamily="Urbanist" fontWeight="bold">
                    <Image src="/logo.svg" />
                </Text>
                <CloseButton
                    display={{ base: "flex", md: "none" }}
                    onClick={onClose}
                />
            </Flex>
            <WokspaceSwitcher />
            {LinkItems.map((link) => {
                return link.type === "item" ? (
                    <NavItem
                        id={link.name}
                        target={link.target}
                        path={link.url}
                        fontWeight={
                            router.pathname === link.url ? "semibold" : "normal"
                        }
                        key={link.name}
                        bg={router.pathname === link.url ? "#f4f4f4" : "white"}
                        color={
                            router.pathname === link.url ? "#4991A1" : "#383F40"
                        }
                        border="1px solid transparent"
                        _hover={{
                            bg:
                                router.pathname === link.url
                                    ? "#f4f4f4"
                                    : "#f4f4f4",
                            color: "black",
                        }}
                        p="5px"
                        pl={5}
                        fontSize="16px"
                        icon={link.icon}
                    >
                        {link.name}
                        {link.beta && (
                            <Text
                                color="#5a5a5a"
                                as="span"
                                fontSize="10"
                                pos="relative"
                                right={-2}
                                bg="#dfdfdf"
                                px={2}
                                rounded="md"
                                top={-1}
                            >
                                Beta
                            </Text>
                        )}
                    </NavItem>
                ) : (
                    <Text
                        key={link.name}
                        fontSize="xs"
                        color="#05405A"
                        fontWeight="semibold"
                        px="4"
                        my="3"
                        ml="8px"
                        mt="20px"
                    >
                        {link.name}
                    </Text>
                );
            })}
            <Box
                color="black"
                pos="absolute"
                bottom={0}
                rounded="md"
                w="92%"
                mt={16}
                textAlign="left"
            >
                <Box
                    mt={1}
                    ml={4}
                    display="flex"
                    flexDirection="column"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    bg="#F8F8F8"
                    p={2}
                    boxShadow="sm"
                    color="#383F40"
                    rounded="md"
                    border="1px solid #e2e2e2"
                >
                    <Box
                        display="flex"
                        justifyContent="left"
                        flexDirection={["column", "column", "column"]}
                        alignItems="left"
                        mb={2}
                        w="full"
                    >
                        <Box
                            as="span"
                            fontSize="sm"
                            flexDir="row"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Text fontWeight="semibold" as="span">
                                {plan ? (
                                    <Text as="span" textTransform="capitalize">
                                        {plan} plan
                                    </Text>
                                ) : (
                                    <Link href="/pricing">Select a plan</Link>
                                )}
                            </Text>
                            <Text fontWeight="normal" fontSize="2xs">
                                Monthly Usage
                            </Text>
                        </Box>

                        <Text
                            w="full"
                            textAlign="left"
                            fontSize="xs"
                            mt={4}
                            as="span"
                        >
                            {trail ? trail?.dynamic_videos_limit : 0} Dynamic
                            videos left
                            <Progress
                                value={
                                    ((planUsage(plan).dynamicVideos[1] -
                                        trail?.dynamic_videos_limit) /
                                        planUsage(plan).dynamicVideos[1]) *
                                    100
                                }
                                bg="gray.300"
                                size="xs"
                                mt={1}
                                colorScheme="brand"
                                rounded="md"
                            />
                        </Text>
                        <Text
                            w="full"
                            textAlign="left"
                            fontSize="xs"
                            mt={4}
                            as="span"
                        >
                            {trail ? trail?.video_limit : 0} Videos left
                            <Progress
                                value={
                                    ((planUsage(plan).videos[1] -
                                        trail?.video_limit) /
                                        planUsage(plan).videos[1]) *
                                    100
                                }
                                size="xs"
                                bg="gray.300"
                                mt={1}
                                colorScheme="brand"
                                rounded="md"
                            />
                        </Text>
                    </Box>
                </Box>

                {/* <Box>
                        <Button
                            bg={"#ffffff"}
                            color={"black"}
                            size="sm"
                            border={"2px solid #202020"}
                            mr={4}
                            fontSize="xs"
                            mt={2}
                            _hover={{
                                bg: "#E5E5E5",
                            }}
                            onClick={() => {
                                window.location.href = "/pricing";
                            }}
                        >
                            <FaCrown
                                style={{
                                    marginRight: "5px",
                                }}
                            />{" "}
                            {plan && plan === "growth"
                                ? `Growth member`
                                : plan === "light"
                                ? `Lite member`
                                : "Start your 14 day free trial"}
                        </Button>
                    </Box> */}
                <Box>
                    <Menu computePositionOnMount={true}>
                        <Divider w="full" mt={3} ml={2} />
                        <MenuButton
                            cursor={"pointer"}
                            minW={0}
                            textAlign="left"
                            ml={5}
                            mb={4}
                            mt={4}
                        >
                            <Avatar
                                name={user?.email}
                                size={"xs"}
                                mr={2}
                                border="2px solid #DADADA"
                                src={
                                    user?.user_metadata?.picture ??
                                    `https://ui-avatars.com/api/?name=${user?.email}&size=128&background=05405A&color=fff&length=1`
                                }
                            />
                            {user?.email?.substring(0, 20) + "..."}
                        </MenuButton>
                        <MenuList zIndex={99} color="black" w="auto">
                            <MenuItem fontSize={14}>
                                <Link href="/settings">My account</Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link href="/pricing">Plan</Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link href="/settings">Billing</Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link
                                    href="https://videco.io/privacy-policy/"
                                    target="_blank"
                                >
                                    GDPR
                                </Link>
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem fontSize={14}>
                                <Link
                                    href="https://videco.io/demo/"
                                    target="_blank"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiVideo
                                        style={{
                                            marginRight: "5px",
                                        }}
                                        size="14"
                                        color="#383F40"
                                    />
                                    Strategy call
                                </Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link
                                    href={process.env.NEXT_PUBLIC_SLACK_INVITE_URL}
                                    target="_blank"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiSlack
                                        style={{
                                            marginRight: "5px",
                                        }}
                                        size="14"
                                        color="#383F40"
                                    />
                                    Join Slack
                                </Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link
                                    href="#"
                                    data-productlift-widget={process.env.NEXT_PUBLIC_PRODUCTLIFT_WIDGET_ID}
                                    onClick={handleClick}
                                    target="_blank"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <FiMessageSquare
                                        style={{
                                            marginRight: "5px",
                                        }}
                                        size="14"
                                        color="#383F40"
                                    />
                                    Send feedback
                                </Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <Link
                                    href="#"
                                    data-productlift-widget={process.env.NEXT_PUBLIC_PRODUCTLIFT_SIDEBAR_ID}
                                    onClick={handleClick}
                                >
                                    <SupportIcon
                                        style={{
                                            marginRight: "5px",
                                        }}
                                        fontSize="14"
                                        color="#383F40"
                                    />
                                    Support{" "}
                                </Link>
                            </MenuItem>
                            <MenuItem fontSize={14}>
                                <PiConfetti
                                    style={{
                                        marginRight: "5px",
                                    }}
                                    size="14"
                                    color="#383F40"
                                />
                                <Link
                                    href="https://videco.io/category/product-updates/"
                                    target="_blank"
                                >
                                    Changelog
                                </Link>
                            </MenuItem>

                            <Divider w="full" mt={2} />
                            <MenuItem>
                                <Link fontSize={14} href="/auth/logout">
                                    Logout
                                </Link>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Box>
            </Box>
        </Box>
    );
};

interface NavItemProps extends FlexProps {
    icon: IconType;
    path: string;
    target: string;
    children: any;
}
const NavItem = ({
    icon,
    path,
    target = "_blank",
    children,
    ...rest
}: NavItemProps) => {
    const router = useRouter();
    return (
        <Link
            href={path}
            target={target}
            style={{ textDecoration: "none" }}
            _focus={{ boxShadow: "none" }}
        >
            <Flex
                align="center"
                px="4"
                py="3"
                mb={2}
                mx="4"
                borderRadius="lg"
                bg={router.pathname === path ? "#14213D" : "transparent"}
                role="group"
                fontSize="sm"
                cursor="pointer"
                _hover={{
                    bg: "#14213D",
                    color: "white",
                }}
                {...rest}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16px"
                        style={{
                            color:
                                router.pathname === path
                                    ? "#4991A1"
                                    : "#8a8d8d",
                        }}
                        as={icon}
                    />
                )}
                {children}
            </Flex>
        </Link>
    );
};

interface MobileProps extends FlexProps {
    onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px={{ base: 4, md: 24 }}
            height="20"
            alignItems="center"
            bg={useColorModeValue("white", "gray.900")}
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue("gray.200", "gray.700")}
            justifyContent="flex-start"
            {...rest}
        >
            <IconButton
                variant="outline"
                onClick={onOpen}
                aria-label="open menu"
                icon={<FiMenu />}
            />

            <Text fontSize="2xl" ml="8" fontFamily="Urbanist" fontWeight="bold">
                <Image src="/logo.svg" />
            </Text>
        </Flex>
    );
};
