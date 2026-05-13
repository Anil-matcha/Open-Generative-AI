import { Box, Button, Flex, Link, Text } from "@chakra-ui/react";
import "ka-table/style.css";
import { Table } from "ka-table";
import {
    DataType,
    EditingMode,
    PagingPosition,
    SortingMode,
} from "ka-table/enums";
import { useCSVReader } from "react-papaparse";
import { FiUpload } from "react-icons/fi";

interface StepImportProps {
    children?: React.ReactNode;
    csvData: any;
    onCsvDataChange: any;
}
export const StepImport: React.FC<StepImportProps> = ({
    children,
    csvData,
    onCsvDataChange,
}) => {
    const { CSVReader } = useCSVReader();
    const convertCsvData = (data): any[] => {
        // Extract the keys from the first sub-array
        const keys = data[0];

        // Map over the remaining arrays to create objects
        const result = data.slice(1).map((item) => {
            // Create an object with keys mapped to corresponding values
            return keys.reduce((acc, key, index) => {
                acc[key] = item[index];
                return acc;
            }, {});
        });
        return result;
    };

    return (
        <CSVReader
            onUploadAccepted={(results: any) => {
                onCsvDataChange(results.data);
            }}
        >
            {({
                getRootProps,
                acceptedFile,
                ProgressBar,
                getRemoveFileProps,
            }: any) => (
                <>
                    {!csvData.length && (
                        <Box display="flex" flexDir="column">
                            <Box>
                                <Button
                                    type="button"
                                    px={12}
                                    py={6}
                                    bg="#F7F9FA"
                                    fontWeight="400"
                                    color="#05405A"
                                    border="1px solid #05405A"
                                    borderStyle="dashed"
                                    _hover={{
                                        bg: "#e7e7e7",
                                    }}
                                    {...getRootProps()}
                                    w="full"
                                    display="flex"
                                    flexDir="column"
                                    height={120}
                                >
                                    <FiUpload />
                                    <Text mt={3}>Import your contacts</Text>
                                </Button>
                            </Box>
                        </Box>
                    )}
                    <Box
                        mt={4}
                        sx={{
                            ".ka-table-wrapper": {
                                border: "1px solid #05405A",
                                borderRadius: "10px",
                            },
                        }}
                    >
                        <Box my={2} w="md" width="full">
                            <ProgressBar />
                        </Box>
                        {csvData.length > 0 ? (
                            <>
                                <Table
                                    columns={[
                                        {
                                            key: "fname",
                                            title: "First Name",
                                            dataType: DataType.String,
                                        },
                                        {
                                            key: "lname",
                                            title: "Last Name",
                                            dataType: DataType.String,
                                        },
                                        {
                                            key: "email",
                                            title: "Email",
                                            dataType: DataType.String,
                                        },
                                        {
                                            key: "website",
                                            title: "Website",
                                            dataType: DataType.String,
                                        },
                                    ]}
                                    paging={{
                                        enabled: true,
                                        pageIndex: 0,
                                        pageSize: 5,
                                        pageSizes: [5, 10, 15],
                                        position: PagingPosition.Bottom,
                                    }}
                                    noData={{
                                        text: "Your CSV data preview will be here",
                                        hideHeader: true,
                                    }}
                                    data={convertCsvData(csvData)}
                                    editingMode={EditingMode.Cell}
                                    rowKeyField={"id"}
                                    sortingMode={SortingMode.Single}
                                />
                                {children}
                                {acceptedFile && (
                                    <Flex
                                        justifyContent="space-between"
                                        fontSize={16}
                                    >
                                        <Box p={2}>{acceptedFile.name}</Box>
                                    </Flex>
                                )}
                            </>
                        ) : (
                            <Box>
                                <Text>Example</Text>
                                <Box opacity="0.6">
                                    <Table
                                        columns={[
                                            {
                                                key: "fname",
                                                title: "First Name",
                                                dataType: DataType.String,
                                            },
                                            {
                                                key: "lname",
                                                title: "Last Name",
                                                dataType: DataType.String,
                                            },
                                            {
                                                key: "email",
                                                title: "Email",
                                                dataType: DataType.String,
                                            },
                                            {
                                                key: "website",
                                                title: "Website",
                                                dataType: DataType.String,
                                            },
                                        ]}
                                        paging={{
                                            enabled: true,
                                            pageIndex: 0,
                                            pageSize: 5,
                                            pageSizes: [5, 10, 15],
                                            position: PagingPosition.Bottom,
                                        }}
                                        noData={{
                                            text: "Your CSV data preview will be here",
                                            hideHeader: true,
                                        }}
                                        data={[
                                            {
                                                fname: "Malith",
                                                lname: "Priyashan",
                                                email: "malith@videco.io",
                                                website:
                                                    "https://www.videco.io",
                                            },
                                            {
                                                fname: "Alex",
                                                lname: "Contador",
                                                email: "alex@videco.io",
                                                website:
                                                    "https://www.videco.io",
                                            },
                                            {
                                                fname: "Robert",
                                                lname: "Contador",
                                                email: "robert@videco.io",
                                                website:
                                                    "https://www.videco.io",
                                            },
                                        ]}
                                        editingMode={EditingMode.Cell}
                                        rowKeyField={"id"}
                                        sortingMode={SortingMode.Single}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </CSVReader>
    );
};
