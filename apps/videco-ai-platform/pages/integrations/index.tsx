import React, { useState } from "react";
import {
    Box,
    Heading,
    Flex,
    Card,
    CardBody,
    Text,
    Button,
    Container,
    Image,
    Link,
    Spinner,
    SimpleGrid,
    Input,
    InputGroup,
    InputLeftElement,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { FiHelpCircle, FiSearch, FiSettings } from "react-icons/fi";
import { MdCreate } from "react-icons/md";

const Integrations: React.FC = () => {
    const session = useSession();
    const [search, setSearch] = useState("");
    const router = useRouter();
    const intagrationsList = [
        {
            name: "Zapier",
            dec: "Automate as fast as you can type. You can setup automation directly from Videco",
            isActive: false,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "/automation",
            icon: "/assets/intagrations/zapier.png",
        },
        {
            name: "Apollo",
            dec: "Add your videos into Apollo email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/appolo.png",
        },
        {
            name: "ActiveCampaign",
            dec: "Add your videos into ActiveCampaign email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/activeCampaign.png",
        },
        {
            name: "AWeber",
            dec: "Add your videos into AWeber email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/aweber.png",
        },
        {
            name: "Brevo",
            dec: "Add your videos into Brevo email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/brevo.png",
        },
        {
            name: "Lemlist",
            dec: "Add your videos into Lemlist email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/lemlist.png",
        },
        {
            name: "La Growth Machine",
            dec: "Add your videos into La Growth Machine email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/lagrowthmachine.png",
        },
        {
            name: "Go High Level",
            dec: "Add your videos into Go High Level email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/gohighlevel.png",
        },
        {
            name: "Mailchimp",
            dec: "Add your videos into Mailchimp email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/mailchimp.png",
        },
        {
            name: "Smart Lead",
            dec: "Add your videos into Smart Lead email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/smartlead.png",
        },
        {
            name: "Sales Flow",
            dec: "Add your videos into Sales Flow email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/salesflow.png",
        },
        {
            name: "Woodpecker",
            dec: "Add your videos into Woodpecker email campaigns/landing pages and/or use their forms to track interactions and analyze your audience.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/woodpecker.png",
        },
        {
            name: "Calendly",
            dec: "Embed calendars directly in your video and use it for faster appointments with prospects.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/calandly.png",
        },
        {
            name: "Hubspot",
            dec: "Track conversions and survey responses in Hubspot. Capture leads with your videos and automatically Hubspot.",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/hubspot.png",
        },
        {
            name: "Youtube",
            dec: "Import videos from Youtube and customize it according to your design. And share it using Videco landing page",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/youtube.png",
        },
        {
            name: "Vimeo",
            dec: "Import videos from Vimeo and customize it according to your design. And share it using Videco landing page",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/vimeo.png",
        },
        {
            name: "Vidyard",
            dec: "Import videos from Vidyard and customize it according to your design. And share it using Videco landing page",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/vidyard.png",
        },
        {
            name: "Streamable",
            dec: "Import videos from Streamable and customize it according to your design. And share it using Videco landing page",
            isActive: true,
            helpLink:
                "https://roadmap.videco.io/t/knowledgebase#13787-integrations",
            configLink: "",
            icon: "/assets/intagrations/streamable.png",
        },
    ];
    const filteredIntagrationsList = intagrationsList.filter((int) =>
        int.name.toLowerCase().includes(search.toLowerCase()),
    );
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
                    <Box w="full" h="full">
                        <Flex
                            direction="column"
                            // bg="white"
                            mb={6}
                            boxShadow="sm"
                            w="full"
                        >
                            <Header pageTitle="Integrations" />
                        </Flex>

                        <Container
                            // bg="white"
                            w="3xl"
                            maxW="97%"
                            rounded="md"
                            // boxShadow={"md"}
                            m="6 auto"
                            p={4}
                            overflow="hidden"
                        >
                            <Box
                                bg="#05405A"
                                rounded="lg"
                                px={12}
                                py={6}
                                mb={3}
                            >
                                <Text
                                    color="white"
                                    fontSize="3xl"
                                    fontWeight="semibold"
                                >
                                    Unlock the full power of Videco with
                                    additonal apps to make every video a
                                    connection
                                </Text>
                                <Button
                                    mt={4}
                                    fontSize="sm"
                                    onClick={() =>
                                        window?.open(
                                            "https://roadmap.videco.io/",
                                        )
                                    }
                                >
                                    <MdCreate
                                        style={{
                                            marginRight: "4px",
                                        }}
                                    />{" "}
                                    Request integration
                                </Button>
                                <Button
                                    mt={4}
                                    variant="ghost"
                                    color="white"
                                    ml={2}
                                    onClick={() =>
                                        window?.open(
                                            "https://roadmap.videco.io/t/knowledgebase",
                                        )
                                    }
                                    _hover={{
                                        bg: "transparent",
                                    }}
                                >
                                    <FiHelpCircle />
                                </Button>
                            </Box>
                            <InputGroup mb={3}>
                                <InputLeftElement pointerEvents="none">
                                    <FiSearch color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    onChange={(e) => setSearch(e.target.value)}
                                    type="text"
                                    placeholder="Search your integration"
                                />
                            </InputGroup>

                            <SimpleGrid
                                spacing={4}
                                // templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                            >
                                {filteredIntagrationsList.map((item) => {
                                    return (
                                        <Card
                                            boxShadow="none"
                                            border="1px solid #dfdfdf"
                                            rounded="xl"
                                            mt={2}
                                        >
                                            <CardBody
                                                display="flex"
                                                flexDirection="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                px={2}
                                                py={4}
                                            >
                                                <Image
                                                    src={item.icon}
                                                    alt="Calendly"
                                                    borderRadius="lg"
                                                    w={"60px"}
                                                    mb={2}
                                                />
                                                <Box ml={4}>
                                                    <Heading
                                                        size="md"
                                                        color="#383F40"
                                                    >
                                                        {item.name}
                                                    </Heading>
                                                    <Text
                                                        mt={2}
                                                        size="sm"
                                                        color="#9C9F9F"
                                                    >
                                                        {item.dec}
                                                    </Text>
                                                </Box>
                                                {item.isActive ? (
                                                    <Text
                                                        as="span"
                                                        bg="#4991A1"
                                                        color="white"
                                                        rounded="md"
                                                        px={2}
                                                        fontSize="sm"
                                                    >
                                                        Active
                                                    </Text>
                                                ) : (
                                                    <Button
                                                        leftIcon={
                                                            <FiSettings />
                                                        }
                                                        onClick={() =>
                                                            (window.location.href =
                                                                item.configLink)
                                                        }
                                                        variant="ghost"
                                                    >
                                                        Configure
                                                    </Button>
                                                )}
                                                <Button
                                                    ml="3"
                                                    bg="white"
                                                    onClick={() =>
                                                        window.open(
                                                            item.helpLink,
                                                        )
                                                    }
                                                    variant="ghost"
                                                    p={0}
                                                    // border="1px solid #dfdfdf"
                                                >
                                                    <FiHelpCircle />
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        </Container>
                    </Box>
                </Sidebar>
            )}
        </>
    );
};

export default Integrations;
