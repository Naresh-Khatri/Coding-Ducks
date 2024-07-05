import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTable, useFilters, useGlobalFilter, useSortBy } from "react-table";
import SubmissionRow from "./admin/SubmissionRow";
import { ISubmission, ISubmissionsQuery } from "../types";

const COLUMNS = [
  {
    Header: "ID",
    accessor: "id",
  },
  {
    Header: "Exam",
    accessor: "examId",
    filter: "equals",
  },
  {
    Header: "Photo",
    accessor: "User.photoURL",
    //turn off sorting
    disableSortBy: true,
  },
  {
    Header: "User",
    accessor: "User",
  },
  {
    Header: "Lang",
    accessor: "lang",
  },
  {
    Header: "Marks",
    accessor: "marks",
  },
  {
    Header: "Time",
    accessor: "timestamp",
  },
  {
    Header: "Tests",
    accessor: "tests_passed",
  },
  {
    Header: "Actions",
  },
];

interface SubmissionsTableProps {
  subsData: { submissions: ISubmission[]; count: number };
  query: ISubmissionsQuery;
  setQuery: any;
}
function SubmissionsTable({
  subsData,
  query,
  setQuery,
}: SubmissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleOnSearchChange = (e) => {
    const search = e.target.value;

    setSearchTerm(search);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((p) => {
        return { ...p, searchTerm };
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <>
      <Box>
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            placeholder="Search names, usernames, roll and lang "
            value={searchTerm}
            onChange={handleOnSearchChange}
          />
          {searchTerm !== "" && (
            <InputRightElement>
              <Button size="sm" onClick={(e) => handleOnSearchChange(e)}>
                <CloseIcon />
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
      </Box>
      <Tablee submissionsData={subsData} query={query} setQuery={setQuery} />
    </>
  );
}

const Tablee = ({
  submissionsData,
  query,
  setQuery,
}: {
  submissionsData: { submissions: ISubmission[]; count: number };
  query: ISubmissionsQuery;
  setQuery: any;
}) => {
  const { submissions, count } = submissionsData;
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setFilter,
    setGlobalFilter,
    state,
  } = useTable(
    {
      columns: COLUMNS,
      data: submissions,
    },
    useFilters,
    useGlobalFilter,
    useSortBy
  );

  useEffect(() => {
    if (state.sortBy.length === 0) return;
    console.log(state.sortBy);
    setQuery((p) => {
      return { ...p, orderBy: state.sortBy[0].id, asc: state.sortBy[0].desc };
    });
  }, [state.sortBy]);

  return (
    <>
      <HStack w={"100%"} justify={"space-between"}>
        <HStack>
          <IconButton
            aria-label="left"
            disabled={query.skip === 0}
            onClick={() => {
              setQuery((p) => {
                return { ...p, skip: p.skip - 10 };
              });
            }}
            icon={<ChevronLeftIcon />}
          />
          <IconButton
            aria-label="right"
            disabled={query.skip + query.take >= count}
            onClick={() => {
              setQuery((p) => {
                return { ...p, skip: p.skip + 10 };
              });
            }}
            icon={<ChevronRightIcon />}
          />
          <Text>
            Page: {query.skip / query.take + 1}/{Math.floor(count / query.take)}
          </Text>
        </HStack>
        <Text> Total subs: {count} </Text>
        <HStack>
          <Text> Showing </Text>
          <Select
            value={query.take}
            onChange={(e) => {
              setQuery((p) => {
                return { ...p, take: +e.target.value };
              });
            }}
          >
            <option value="10">10 rows</option>
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </Select>
        </HStack>
      </HStack>
      <TableContainer>
        <Table {...getTableProps()}>
          <Thead>
            {headerGroups.map((headerGroup, i: number) => (
              <Tr key={i} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, j: number) => (
                  <Th
                    key={j}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
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
          <Tbody {...getTableBodyProps()}>
            {rows.map((row, i: number) => {
              prepareRow(row);
              return (
                <Tr
                  key={i}
                  bg={
                    row.original.tests_passed === row.original.total_tests
                      ? ""
                      : "red.900"
                  }
                >
                  <SubmissionRow submission={row.original} />
                  {/* {row.cells.map((cell, j: number) => {
                    return (
                      <Td key={j} {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </Td>
                    )
                  })} */}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};
export default SubmissionsTable;
