import React, { useEffect, useState } from "react";
import {
    Input,
    Box,
    Heading,
    Flex,
    Card,
    CardBody,
    Text,
    Highlight,
    Button,
    Container,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    InputGroup,
    InputLeftElement,
    Textarea,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { Sidebar } from "@components/common/sidebar";
import { Header } from "@components/common/header";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import {
    FiBluetooth,
    FiDisc,
    FiFacebook,
    FiGitCommit,
    FiMail,
    FiPhone,
    FiTwitter,
    FiVoicemail,
} from "react-icons/fi";
const Pricing: React.FC = () => {
    function stripeEmbed() {
        return {
            __html: `<script async src="https://js.stripe.com/v3/pricing-table.js"></script>
          <stripe-pricing-table pricing-table-id="${process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}"
          publishable-key="${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
          </stripe-pricing-table>`,
        };
    }
    return (
        <Sidebar>
            <Box mt={32} h="full" bg="white">
                <div dangerouslySetInnerHTML={stripeEmbed()} />
            </Box>
        </Sidebar>
    );
};

export default Pricing;
