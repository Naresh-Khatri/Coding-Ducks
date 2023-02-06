import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spacer,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ProblemRow from '../../components/admin/ProblemRow'
import AdminLayout from '../../layout/AdminLayout'
import { useProblemsData } from '../../hooks/useProblemsData'
import CustomTable from '../../components/CustomTable'

interface Problem {
  id: number
  title: string
  order: number
  difficulty: string
  examId: number
  exam: {
    id: number
    title: string
    slug: string
  }
}

type sortByCol = 'id' | 'order' | 'difficulty' | 'title'
type sortByOrder = 1 | -1
interface sortBy {
  col: sortByCol
  order: sortByOrder
}

const COLUMNS = [
  {
    Header: 'ID',
    accessor: 'id',
  },
  {
    Header: 'Exam',
    accessor: 'examId',
    filter: 'equals',
  },
  {
    Header: 'Order',
    accessor: 'order',
  },
  {
    Header: 'Difficulty',
    accessor: 'difficulty',
  },
  {
    Header: 'Title',
    accessor: 'title',
  },
  {
    Header: 'Actions',
  },
]
function ProblemPage() {
  const {
    data: problemsData,
    isLoading: problemsDataIsLoading,
    error: problemsDataError,
    refetch: fetchProblems,
  } = useProblemsData()
  console.log(problemsData, problemsDataIsLoading, problemsDataError)

  if (problemsDataIsLoading || !problemsData) return <div>Loading...</div>

  return (
    <AdminLayout>
      <Container maxW='container.xl' overflowY={'scroll'}>
        <Flex m={10} justify='space-between'>
          <Link href='/dashboard/add-problem'>
            <Button bg='green.400'>Add Problem</Button>
          </Link>
        </Flex>
        <CustomTable
          columns={COLUMNS}
          data={problemsData.problems}
          examsList={problemsData.examsList}
          refetchData={fetchProblems}
          hasSearchBar={true}
          hasSort={true}
        />
      </Container>
    </AdminLayout>
  )
}

export default ProblemPage
