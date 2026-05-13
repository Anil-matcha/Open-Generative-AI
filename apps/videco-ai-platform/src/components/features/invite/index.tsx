import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Flex,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    Select,
    useToast,
} from "@chakra-ui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { Formik, Form, Field } from "formik";
import React from "react";
import { sendEmail } from "src/services/api/sendEmail";
import { useWorkspaces } from "src/store/workspace";

export const Invite: React.FC<InviteProps> = ({
    onClose,
    memberEmail,
    setInviteUpdated,
}) => {
    const supabase = createClientComponentClient();
    const [inviteSent, setInviteSent] = React.useState(false);
    const session = useSession();
    const toast = useToast();
    const { workspace } = useWorkspaces();

    const user = session?.user;
    function validateEmail(value) {
        let error;
        if (!value) {
            error = "Email is required";
        }
        return error;
    }
    function validateName(value) {
        let error;
        if (!value) {
            error = "Name is required";
        }
        return error;
    }

    const sendInvite = async (email: string, name: string) => {
        try {
            const { error } = await supabase.from("sub_accounts").insert({
                main_account: user.id,
                shared_account: email,
                workspace_id: workspace.id,
                name: name,
                role: "editor",
            });
            // await supabase.from("sub_accounts").upsert({
            //     main_account: user.id,
            //     shared_account: user.email,
            //     shared_account_user: user.id,
            //     name: user.user_metadata.full_name,
            //     role: "owner",
            // });
            if (error) throw error;
            await sendEmail("/api/mail/invite", {
                email: email,
                name: name,
            });
            setInviteSent(true);
            setInviteUpdated(true);
        } catch (error) {
            setInviteSent(false);
        }
    };

    const onDelete = async () => {
        try {
            const { error } = await supabase
                .from("sub_accounts")
                .delete()
                .eq("shared_account", memberEmail);
            if (error) throw error;
            // await submitInvite("/api/mail/invite", {
            //     email: email,
            //     name: name,
            // });
            toast({
                title: "User deleted",
                description:
                    "The deleted user will no longer have access to this project.",
                status: "warning",
                duration: 1000,
                isClosable: true,
            });
            setInviteUpdated(true);
            onClose();
        } catch (error) {
            setInviteSent(false);
        }
    };
    return (
        <>
            {memberEmail ? (
                <>
                    <Alert colorScheme="red" rounded="md">
                        Are you sure that you want to delete the user{" "}
                        {memberEmail}?
                    </Alert>
                    <Flex direction="row" w="full">
                        <Button mt={8} colorScheme="red" onClick={onDelete}>
                            Delete User
                        </Button>
                        <Button
                            variant="outline"
                            ml={3}
                            mt={8}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </>
            ) : (
                <Formik
                    initialValues={{
                        email: "",
                        name: "",
                        role: "Editor",
                    }}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            sendInvite(values.email, values.name);
                            actions.setSubmitting(false);
                        }, 1000);
                    }}
                >
                    {(props) => (
                        <Form>
                            {inviteSent && (
                                <Alert
                                    pt={4}
                                    pb={4}
                                    status="success"
                                    variant="subtle"
                                    flexDirection="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    textAlign="center"
                                >
                                    <AlertIcon boxSize="40px" mr={0} />
                                    <AlertTitle mt={4} mb={1} fontSize="lg">
                                        User invited!
                                    </AlertTitle>
                                    <AlertDescription maxWidth="sm">
                                        The user has been invited to this
                                        project and they will get a confirmation
                                        email soon.
                                    </AlertDescription>
                                    <Button
                                        colorScheme="teal"
                                        p={4}
                                        mb={3}
                                        mt={3}
                                        onClick={onClose}
                                    >
                                        Close
                                    </Button>
                                </Alert>
                            )}
                            {!inviteSent && (
                                <>
                                    <Field name="name" validate={validateName}>
                                        {({ field, form }) => (
                                            <FormControl
                                                mb="4"
                                                isInvalid={
                                                    form.errors.name &&
                                                    form.touched.name
                                                }
                                            >
                                                <FormLabel>Name</FormLabel>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="John Doe"
                                                />
                                                <FormHelperText>
                                                    Name of the user you want to
                                                    invite
                                                </FormHelperText>
                                                <FormErrorMessage>
                                                    {form.errors.name}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field
                                        name="email"
                                        validate={validateEmail}
                                    >
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors.email &&
                                                    form.touched.email
                                                }
                                            >
                                                <FormLabel>
                                                    Email Address
                                                </FormLabel>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="example@example.com"
                                                />
                                                <FormHelperText>
                                                    Email address of the user
                                                    you want to invite
                                                </FormHelperText>
                                                <FormErrorMessage>
                                                    {form.errors.email}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field name="role">
                                        {({ field, form }) => (
                                            <FormControl
                                                isInvalid={
                                                    form.errors.role &&
                                                    form.touched.role
                                                }
                                                mt={5}
                                            >
                                                <FormLabel>Role</FormLabel>
                                                <Select
                                                    placeholder="Select a role"
                                                    defaultValue="editor"
                                                    {...field}
                                                    required
                                                >
                                                    <option value="editor">
                                                        Editor
                                                    </option>
                                                </Select>
                                                <FormHelperText>
                                                    We reccomend to always share
                                                    the Editor access
                                                </FormHelperText>
                                                <FormErrorMessage>
                                                    {form.errors.role}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Button
                                        mt={8}
                                        colorScheme="teal"
                                        isLoading={props.isSubmitting}
                                        type="submit"
                                    >
                                        Invite user
                                    </Button>
                                    <Button
                                        variant="outline"
                                        ml={3}
                                        mt={8}
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </Formik>
            )}
        </>
    );
};

type InviteProps = {
    onClose?: any;
    setInviteUpdated?: any;
    memberEmail?: string | null;
};
