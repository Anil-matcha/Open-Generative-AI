import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    Heading,
    Table,
    TableContainer,
    Tag,
    Tbody,
    Td,
    Text,
    Tfoot,
    Th,
    Thead,
    Tr,
    useDisclosure,
} from "@chakra-ui/react";
import { useSession } from "@supabase/auth-helpers-react";
import { useEffect, useRef, useState } from "react";
import { FiEdit, FiUserPlus } from "react-icons/fi";
import { useFetchTeamData } from "src/hooks/useFetchTeamData";
import { Invite } from ".";

type InviteListProps = {
    open?: boolean;
};

export const InviteList: React.FC<InviteListProps> = () => {
    const [teamMembers, setTeamMembers] = useState<any>();
    const [memberEmail, setMemberEmail] = useState<string | null>(null);
    const [canInvite, setCanInvite] = useState<any>(false);
    const [inviteUpdated, setInviteUpdated] = useState(false);
    const [inviteApproved, setInviteApproved] = useState<any>(true);
    const { getTeamUserIds, getData } = useFetchTeamData();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const session = useSession();
    const user = session?.user;
    const getFullTeamMembers = async () => {
        const team = await getTeamUserIds();
        if (team) {
            team.filter((member) => {
                if (
                    member?.role === "owner" &&
                    member?.shared_account === user?.email
                ) {
                    setCanInvite(true);
                }
                if (
                    member?.role !== "owner" &&
                    member?.shared_account === user?.email &&
                    !member?.shared_account_user
                ) {
                    setInviteApproved(false);
                }
            });
            setTeamMembers(team ?? []);
        }
    };
    const inviteUserButtonRef = useRef();

    useEffect(() => {
        getFullTeamMembers();
        setInviteUpdated(false);
        setMemberEmail(null);
    }, [user, inviteUpdated]);
    return (
        <Box mt={2}>
            <Drawer
                isOpen={isOpen}
                placement="right"
                onClose={onClose}
                size="md"
                finalFocusRef={inviteUserButtonRef}
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader mb={3}>
                        Invite a user to your project
                        <Text fontSize="sm" fontWeight="normal">
                            Add an email address and select a role for the user.
                            Make sure to double check the email address
                        </Text>
                    </DrawerHeader>

                    <DrawerBody>
                        <Invite
                            setInviteUpdated={setInviteUpdated}
                            memberEmail={memberEmail}
                            onClose={onClose}
                        />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Heading size="sm" fontWeight="semibold">
                Invite Users
            </Heading>
            <Text mt={1} fontSize="sm" as="span">
                Manage or add users to the active workspaces
            </Text>
            <TableContainer border="1px solid #DADADA" rounded="lg" mt={4}>
                <Table size="md">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Role</Th>
                            <Th>Action</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {teamMembers ? (
                            teamMembers.map((member) => (
                                <Tr>
                                    <Td>{member?.name}</Td>
                                    <Td>{member?.shared_account}</Td>
                                    <Td>{member?.role}</Td>
                                    <Td>
                                        {canInvite &&
                                            member?.role !== "owner" && (
                                                <Box cursor="pointer">
                                                    <FiEdit
                                                        onClick={() => {
                                                            setMemberEmail(
                                                                member?.shared_account,
                                                            );
                                                            onOpen();
                                                        }}
                                                        size="15px"
                                                        color="gray"
                                                    />
                                                </Box>
                                            )}
                                    </Td>
                                </Tr>
                            ))
                        ) : (
                            <Box>
                                <Alert rounded="md" bg="#e2ffe6">
                                    You don't have any team members yet
                                </Alert>
                            </Box>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
            <Button
                mt={2}
                onClick={() => onOpen()}
                leftIcon={<FiUserPlus size="20px" color="black" />}
            >
                Invite a new user{" "}
            </Button>
        </Box>
    );
};
