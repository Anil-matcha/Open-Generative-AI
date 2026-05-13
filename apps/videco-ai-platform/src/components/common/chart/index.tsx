import { Box, Button, Heading } from "@chakra-ui/react";
import React, { PureComponent } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const data = [
    {
        name: "Page A",
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        name: "Page B",
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: "Page C",
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: "Page D",
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: "Page E",
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: "Page F",
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: "Page G",
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

export default class Charts extends PureComponent {
    static demoUrl = "https://codesandbox.io/s/simple-area-chart-4ujxw";

    render() {
        return (
            <Box
                py="6"
                px="4"
                pb="80px"
                pos="relative"
                shadow="lg"
                rounded="md"
                border="1px solid #dcdcdc"
                w="96%"
                h="100%"
                mr="12"
                ml="6"
            >
                <Heading as="h2" fontSize="2xl" mb="8">
                    Total Views Last 7 Days
                </Heading>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        width={500}
                        height={400}
                        data={data}
                        margin={{
                            top: 0,
                            right: 30,
                            left: 0,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="uv"
                            stroke="#8884d8"
                            fill="black"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        );
    }
}
