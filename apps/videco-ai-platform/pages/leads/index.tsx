import React, { useCallback, useEffect, useState } from "react";
import { DataType, Table } from "ka-table";
import "ka-table/style.css";

import {
    Grid,
    GridItem,
    Input,
    Button,
    Box,
    Flex,
    Spinner,
    Text,
    Image,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEditorStore } from "src/store/editor";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FiFilm, FiSettings, FiUpload, FiYoutube } from "react-icons/fi";
import { useUserPlan } from "src/hooks/useUserPlan";
import Pricing from "@components/common/pricing";

const Leads: React.FC = () => {
    const supabase = createClientComponentClient();
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(true);
    const [leadsData, setLeadsData] = useState<any>();
    const session = useSession();
    const [showPricing, setShowPricing] = useState<any>(false);
    const user = session?.user;
    const router = useRouter();
    const { clearVideo } = useEditorStore();
    const { getPlan } = useUserPlan();
    const [plan, setPlan] = useState<any>();
    useEffect(() => {
        const plan = async () => {
            const fetchPlan = await getPlan(user?.id);
            setPlan(fetchPlan?.[0]?.plan_name);
        };
        plan();
    }, []);
    const getLeads = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from("leads")
                .select()
                .eq("user_id", user?.id);

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setLeadsData(data ?? []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        clearVideo();
    }, [user, supabase]);

    const toCSV = (data) => {
        if (data.length === 0) {
            return "";
        }
        const headers = Object.keys(data[0].data);
        const rows = data.map((item) =>
            headers.map((header) => item.data[header]),
        );
        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");
        return csvContent;
    };

    const downloadCSV = () => {
        if (plan !== "growth") {
            setShowPricing(true);
            return;
        }
        const csvContent = toCSV(leadsData ?? []);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leads.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        getLeads();
    }, [user, getLeads]);

    return (
        <>
            {!session ? (
                <Box
                    textAlign="center"
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    flexDirection="column"
                    height="full"
                    width="full"
                >
                    <Spinner size="xl" />
                    <Link mt={7} href="/auth/login">
                        Please Login
                    </Link>
                </Box>
            ) : (
                <Sidebar>
                    <Flex
                        direction="column"
                        bg="white"
                        mb={2}
                        boxShadow="sm"
                        w="full"
                    >
                        <Header pageTitle="Leads" />
                    </Flex>
                    <Grid
                        templateColumns={[
                            null,
                            "repeat(12, 1fr)",
                            "repeat(12, 1fr)",
                        ]}
                        h="full"
                        textColor="black"
                    >
                        <GridItem
                            pr={8}
                            w="full"
                            colSpan={12}
                            h="full"
                            bg="white"
                        >
                            <Flex
                                mt={12}
                                direction={["column", "column", "column"]}
                            >
                                <Box ml="7">
                                    {showPricing && (
                                        <Pricing
                                            hidePiricng={() =>
                                                setShowPricing(false)
                                            }
                                        />
                                    )}
                                    <Flex
                                        direction={["column", "column", "row"]}
                                    >
                                        <Input
                                            type="search"
                                            value={searchText}
                                            border={"1px solid black"}
                                            placeholder="Search for name, email message or the form name..."
                                            borderColor={"black"}
                                            onChange={(event) => {
                                                setSearchText(
                                                    event.currentTarget.value,
                                                );
                                            }}
                                            mb="5"
                                            mr={12}
                                        />

                                        <Menu>
                                            <MenuButton
                                                as={Button}
                                                color={"white"}
                                                bg={"#14213D"}
                                                fontWeight={"light"}
                                                px={2}
                                                py={2}
                                                zIndex={800}
                                                _hover={{
                                                    bg: "#1e6a57",
                                                    color: "white",
                                                }}
                                                variant="outline"
                                            >
                                                <FiSettings size="20" />
                                            </MenuButton>
                                            <MenuList zIndex={800}>
                                                <MenuItem
                                                    onClick={() =>
                                                        downloadCSV()
                                                    }
                                                    minH="48px"
                                                >
                                                    <FiUpload
                                                        color="green"
                                                        size="20"
                                                    />
                                                    <Text ml={3}>
                                                        Export to CSV
                                                    </Text>
                                                </MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Flex>
                                    <Box
                                        sx={{
                                            ".ka": {
                                                bg: "white",
                                                color: "gray.700",
                                                border: "1px solid #dcdcdc",
                                                rounded: "md",
                                            },
                                        }}
                                    >
                                        <Table
                                            columns={[
                                                {
                                                    key: "form_name",
                                                    title: "Form name",
                                                    dataType: DataType.String,
                                                    width: "15%",
                                                },
                                                {
                                                    key: "data.name",
                                                    title: "Name",
                                                    dataType: DataType.String,
                                                    width: "15%",
                                                },
                                                {
                                                    key: "data.email",
                                                    title: "Email",
                                                    dataType: DataType.String,
                                                    width: "30%",
                                                },
                                                {
                                                    dataType: DataType.String,
                                                    key: "data.message",
                                                    title: "Message",
                                                    width: "30%",
                                                },
                                            ]}
                                            data={leadsData ?? []}
                                            search={({
                                                searchText: searchTextValue,
                                                rowData,
                                                column,
                                            }) => {
                                                if (column.key === "passed") {
                                                    return (
                                                        (searchTextValue ===
                                                            "false" &&
                                                            !rowData.passed) ||
                                                        (searchTextValue ===
                                                            "true" &&
                                                            rowData.passed)
                                                    );
                                                }
                                            }}
                                            rowKeyField={"id"}
                                            childComponents={{
                                                dataRow: {
                                                    elementAttributes: () => ({
                                                        style: {
                                                            cursor: "pointer",
                                                        },
                                                        onClick: (
                                                            event,
                                                            extendedEvent,
                                                        ) => {
                                                            // router.push({
                                                            //     pathname: `/videos/edit`,
                                                            //     query: {
                                                            //         id: extendedEvent
                                                            //             .childProps
                                                            //             .rowData.id,
                                                            //     },
                                                            // });
                                                        },
                                                    }),
                                                },
                                            }}
                                            searchText={searchText}
                                            noData={{
                                                text: "No Data Found",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Flex>
                        </GridItem>
                    </Grid>
                </Sidebar>
            )}
        </>
    );
};
export default Leads;
