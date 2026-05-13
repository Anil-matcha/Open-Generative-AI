import { ArrowUpDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Menu,
    MenuButton,
    Button,
    Text,
    Stack,
    Avatar,
    MenuList,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    useToast,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiPlus, FiSettings } from "react-icons/fi";
import { useUserPlan } from "src/hooks/useUserPlan";
import { useWorkspaces } from "src/store/workspace";

export const WokspaceSwitcher = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const supabase = createClientComponentClient();
    const session = useSession();
    const { currentUserPlan } = useUserPlan();
    const router = useRouter();
    const { setWorkspace, workspace } = useWorkspaces();
    const toast = useToast();
    const [workspaces, setWorkspaces] = useState([]);
    const [isUpdate, setIsUpdate] = useState<any>(); //Workspace data as a json {id,name,image}
    const user = session?.user;
    const fetchWorkspaces = async () => {
        await supabase
            .from("workspace")
            .select()
            .eq("owner", user?.id)
            .then((res) => {
                setWorkspaces(res.data);
            });
    };
    const deleteWorkspaces = async (id: string) => {
        await supabase
            .from("workspace")
            .delete()
            .eq("id", id)
            .eq("owner", user?.id)
            .then((res) => {
                onClose();
                fetchWorkspaces();
                toast({
                    title: "Workspace deleted!",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
            });
    };

    const switchWorkspace = (name, id) => {
        setWorkspace({
            name: name,
            id: id,
        });
        router.reload();
    };
    useEffect(() => {
        fetchWorkspaces();
    }, [user]);

    const handleLimits = async () => {
        const plan = await currentUserPlan();
        if (plan) {
            if (plan?.plan_name === "lite") {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                router.push("/pricing");
            } else if (plan?.plan_name === "growth" && workspaces.length >= 5) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                router.push("/pricing");
            } else if (plan?.plan_name === "scale" && workspaces.length >= 10) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                router.push("/pricing");
            } else if (
                plan?.plan_name === "enterprise" &&
                workspaces.length >= 25
            ) {
                toast({
                    title: "Upgrade to premium to create more workspaces",
                    status: "warning",
                    duration: 1500,
                    isClosable: true,
                });
                router.push("/pricing");
            } else {
                onOpen();
            }
        }
    };
    const handleWorkspace = async (name: string, image: string) => {
        try {
            await supabase
                .from("workspace")
                .insert([
                    {
                        owner: user?.id,
                        name: name,
                        image: image,
                    },
                ])
                .select()
                .then((res) => {
                    onClose();
                    fetchWorkspaces();
                    toast({
                        title: "Workspace created!",
                        status: "success",
                        duration: 1500,
                        isClosable: true,
                    });
                });
        } catch (error) {
            console.log("error..", error);
        }
    };

    return (
        <Box justifyContent="center" display="flex" my={2} mt={10} w="full">
            <Modal
                isOpen={isOpen}
                onClose={() => {
                    onClose();
                    setIsUpdate("");
                }}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Workspace settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Formik
                            initialValues={{ name: isUpdate && isUpdate.name }}
                            onSubmit={(values, actions) => {
                                setTimeout(async () => {
                                    await handleWorkspace(values.name, "test");
                                    actions.setSubmitting(false);
                                }, 1000);
                            }}
                        >
                            {(props) => (
                                <Form>
                                    <Field name="name">
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors.name &&
                                                    form.touched.name
                                                }
                                            >
                                                <FormLabel>
                                                    Workspace name
                                                </FormLabel>
                                                <Input
                                                    {...field}
                                                    placeholder="default"
                                                />
                                                <FormErrorMessage>
                                                    {form.errors.name}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Button
                                        mt={4}
                                        mb={4}
                                        colorScheme="teal"
                                        bg="#05405A"
                                        isLoading={props.isSubmitting}
                                        type="submit"
                                    >
                                        Save
                                    </Button>
                                    {isUpdate && (
                                        <Button
                                            mt={4}
                                            mb={4}
                                            ml={3}
                                            colorScheme="red"
                                            isLoading={props.isSubmitting}
                                            onClick={() =>
                                                deleteWorkspaces(isUpdate.id)
                                            }
                                        >
                                            Delete Workspace
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </Formik>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Menu>
                <MenuButton
                    mx={3}
                    bg="white"
                    border="0.5px solid #b9b9b9"
                    color="#383F40"
                    py="6"
                    textAlign="left"
                    _hover={{
                        bg: "#F8F8F8",
                    }}
                    w="full"
                    as={Button}
                    fontWeight="semibold"
                    fontSize="md"
                    rightIcon={
                        <ArrowUpDownIcon
                            fontWeight="normal"
                            w="3"
                            color="#383F40"
                        />
                    }
                >
                    <Stack direction="row" align="center">
                        <Avatar
                            border="1px solid #F8F8F8"
                            size="sm"
                            mr={2}
                            name={workspace.name}
                            src="/default_icon.png"
                        />
                        <Text as="span" height="full">
                            {workspace.name}
                        </Text>
                    </Stack>
                </MenuButton>
                <MenuList
                    bg="white"
                    color="#383F40"
                    maxH={400}
                    overflowY="scroll"
                    overflowX="hidden"
                >
                    {!!workspaces?.length &&
                        [{ name: "Default", id: 1 }, ...workspaces].map(
                            (workspace) => (
                                <Stack
                                    direction="row"
                                    align="center"
                                    mx={2}
                                    mt={1}
                                    key={workspace.id}
                                    position="relative"
                                    zIndex={2}
                                    cursor="pointer"
                                    _hover={{
                                        bg: "#DADADA",
                                    }}
                                    bg="#F8F8F8"
                                    p={2}
                                    rounded="md"
                                >
                                    <>
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            w="full"
                                            alignItems="center"
                                            onClick={() =>
                                                switchWorkspace(
                                                    workspace.name,
                                                    workspace.id,
                                                )
                                            }
                                        >
                                            <Avatar
                                                border="1px solid #DADADA"
                                                size="sm"
                                                mr={2}
                                                name="Dan Abrahmov"
                                                src="/default_icon.png"
                                            />
                                            <Text
                                                as="span"
                                                height="full"
                                                display="flex"
                                                justifyContent="space-between"
                                                w="full"
                                                flexDir="row"
                                                alignItems="center"
                                            >
                                                {workspace.name}
                                            </Text>
                                        </Box>
                                        <Text
                                            as="span"
                                            cursor="pointer"
                                            onClick={() => {
                                                onOpen();
                                                setIsUpdate({
                                                    id: workspace.id,
                                                    name: workspace.name,
                                                    image: workspace.image,
                                                });
                                            }}
                                        >
                                            <FiSettings />
                                        </Text>
                                    </>
                                </Stack>
                            ),
                        )}
                    <Button
                        mt={2}
                        mx={2}
                        w="93%"
                        fontWeight="normal"
                        onClick={handleLimits}
                        color="#05405A"
                        border="1px solid #05405A"
                        leftIcon={<FiPlus />}
                        bg="white"
                    >
                        New workspace
                    </Button>
                </MenuList>
            </Menu>
        </Box>
    );
};
