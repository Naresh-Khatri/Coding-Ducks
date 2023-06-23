import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../lib/axios'
export interface User {
  id?: number
  fullname: string
  username: string
  photoURL: string
  roll?: string
}

export interface Submission {
  id: number
  User: User
  code: string
  examId: number
  lang: string
  marks: number
  tests: any
  tests_passed: number
  timestamp: string
  total_tests: number
  userId: number
}

export interface ISubmissionsQuery {
  skip: number
  take: number
  searchTerm: string
  orderBy: string
  asc: boolean
}
export const useSubmissionsData = ({
  skip,
  take,
  searchTerm,
  orderBy,
  asc,
}: ISubmissionsQuery) => {
  return useQuery(
    ['submissions', { skip, take, searchTerm, orderBy, asc }],
    () =>
      axiosInstance.get(`/submissions`, {
        params: {
          skip,
          take,
          searchTerm,
          orderBy,
          asc,
        },
      })
  )
}

export const useSubmissionData = (id: number) => {
  return useQuery(['submission', id], () =>
    axiosInstance.get(`/submissions/${id}`)
  )
}
