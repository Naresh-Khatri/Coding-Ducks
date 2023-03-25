import {
  Button,
  Container,
  Flex,
} from '@chakra-ui/react'
import Link from 'next/link'
import AdminLayout from '../../layout/AdminLayout'
import { useProblemsData } from '../../hooks/useProblemsData'
import CustomTable from '../../components/CustomTable'



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
