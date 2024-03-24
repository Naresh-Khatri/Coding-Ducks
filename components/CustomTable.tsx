import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useTable, useFilters, useGlobalFilter, useSortBy } from "react-table";
import ProblemRow from "./admin/ProblemRow";
import { IExam, IExamProblem } from "../types";
import ExamRow from "./admin/ExamRow";
import { useState } from "react";

interface CustomTableProps {
  columns: object[];
  data: IExamProblem[] | IExam[];
  refetchData: () => void;
  examsList?: IExam[];
  hasSearchBar?: boolean;
  hasSort?: boolean;
}

function CustomTable({
  columns,
  data,
  refetchData,
  examsList,
  hasSearchBar = false,
  hasSort = false,
}: CustomTableProps) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setFilter,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
    },
    useFilters, // useFilters!
    useGlobalFilter, // useGlobalFilter!
    useSortBy
  );

  const [searchTerm, setSearchTerm] = useState("");

  const handleOnSearchChange = (e) => {
    const search = e.target.value;
    setSearchTerm(search);
    setGlobalFilter(search);
  };
  const handleOnFilterChange = (e) => {
    const examId = e.target.value;
    console.log(examId);
    console.log(data);
    if (examId === "all") {
      setGlobalFilter("");
    } else {
      setFilter("examId", examId);
    }
  };

  return (
    <>
      <Flex direction={"column"} flex={1} mb={5}>
        <Flex>
          {hasSearchBar && (
            <HStack w={"100%"} justify={"space-between"}>
              <Box>
                <InputGroup size="md">
                  <Input
                    pr="4.5rem"
                    placeholder="Search titles"
                    value={searchTerm}
                    onChange={handleOnSearchChange}
                  />
                  {searchTerm != "" && (
                    <InputRightElement>
                      <Button
                        size="sm"
                        onClick={(e) => handleOnSearchChange(e)}
                      >
                        <CloseIcon />
                      </Button>
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>
              <Flex>
                <Text> {data.length} Problem(s)</Text>
                <FormControl>
                  <FormLabel htmlFor="exam">Filter by exam</FormLabel>
                  <Select id="exam" onChange={handleOnFilterChange}>
                    <option value="all">All</option>
                    {examsList &&
                      examsList.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title}
                        </option>
                      ))}
                  </Select>
                </FormControl>
              </Flex>
            </HStack>
          )}
        </Flex>
        <Flex>
          {/* <Box bg={"cyan"} flex={1} flexGrow={1} w={"100%"}></Box> */}
          <TableContainer w={"100%"}>
            <Table {...getTableProps()} w={"60vw"}>
              <Thead>
                {headerGroups.map((headerGroup, i: number) => (
                  <Tr key={i} {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column, j: number) => (
                      <Th
                        key={j}
                        {...column.getHeaderProps(
                          hasSort ? column.getSortByToggleProps() : {}
                        )}
                      >
                        {column.render("Header")}
                        {column.isSorted && (
                          <span
                            style={{
                              transition: "all .2s ease-in-out",
                              rotate: column.isSortedDesc ? "0deg" : "180deg",
                            }}
                          >
                            {column.isSortedDesc ? (
                              <span>&#x25BC;</span>
                            ) : (
                              <span>&#x25B2;</span>
                            )}
                          </span>
                        )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody {...getTableBodyProps()} w={"100%"}>
                {rows.map((row, i: number) => {
                  prepareRow(row);
                  return (
                    <Tr key={i}>
                      {row.original.hasOwnProperty("examId") ? (
                        <ProblemRow
                          problem={row.original}
                          fetchProblems={refetchData}
                          examsList={examsList || []}
                        />
                      ) : (
                        <ExamRow
                          key={i}
                          exam={row.original}
                          fetchExams={refetchData}
                        />
                      )}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>
      </Flex>
    </>
  );
}

export default CustomTable;
