import { Button, Container, Flex } from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";
import SubmissionsTable from "../../_components/SubmissionsTable";
import { useSubmissionsData } from "../../hooks/useSubmissionsData";
import { useState } from "react";
import { ISubmissionsQuery } from "../../types";

function ProblemPage() {
  const [query, setQuery] = useState<ISubmissionsQuery>({
    skip: 0,
    take: 10,
    searchTerm: "",
    orderBy: "id",
    asc: false,
  });
  const { data, isLoading, error, refetch } = useSubmissionsData(query);

  return (
    <AdminLayout>
      <Container p={10} maxW="full" overflowY={"scroll"}>
        {isLoading ? (
          "Loading..."
        ) : (
          <SubmissionsTable
            query={query}
            setQuery={setQuery}
            subsData={data ? data.data : []}
          />
        )}
      </Container>
    </AdminLayout>
  );
}

export default ProblemPage;
