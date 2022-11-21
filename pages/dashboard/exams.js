import { Box, Button } from "@chakra-ui/react";
import Link from "next/link";
import React from "react";
import AdminLayout from "../../layout/AdminLayout";

function exams() {
  return (
    <AdminLayout>
      <Box m={10}>
        <Link href="/dashboard/add-exam">
          <Button bg='green.400'>Add Exam</Button>
        </Link>
      </Box>
    </AdminLayout>
  );
}

export default exams;
