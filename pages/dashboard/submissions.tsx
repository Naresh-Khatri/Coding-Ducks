import { Button, Container, Flex } from '@chakra-ui/react'
import Link from 'next/link'
import AdminLayout from '../../layout/AdminLayout'
import SubmissionsTable from '../../components/SubmissionsTable'

function ProblemPage() {
  return (
    <AdminLayout>
      <Container maxW='full' overflowY={'scroll'}>
        <Flex m={10} justify='space-between'>
          <Link href='/dashboard/add-problem'>
            <Button bg='green.400'>Add Problem</Button>
          </Link>
        </Flex>
        <SubmissionsTable />
      </Container>
    </AdminLayout>
  )
}

export default ProblemPage
