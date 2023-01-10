import { createContext, useState } from "react";
import axios from "../utils/axios";

export const submissionsContext = createContext({
  marks: 0,
  totalMarks: 100,
  submisisons: [{}],
  refreshSubmissions: null,
});

export const SubmissionProvider = ({ children }) => {
  const [submissions, setSubmissions] = useState([]);
  const [marks, setMarks] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);

  const formatSubmission = (data) => {
    setTotalMarks(data.totalMarks);

    // get best submissions
    let bestSubs = [];
    data.submissions.forEach((submission) => {
      if (bestSubs.length === 0) bestSubs.push(submission);
      if (bestSubs[bestSubs.length - 1].problemId === submission.problemId) {
        if (bestSubs[bestSubs.length - 1].marks < submission.marks) {
          bestSubs[bestSubs.length - 1] = submission;
        }
      } else {
        bestSubs.push(submission);
      }
    });
    setSubmissions(bestSubs);
    let marksObtained = bestSubs.reduce((acc, curr) => acc + curr.marks, 0);
    setMarks(marksObtained);
  };
  const refreshSubmissions = async (examId = 2) => {
    try {
      const res = await axios.get(`/exams/getProgress/${examId}`);
      formatSubmission(res.data);
    } catch (err) {
      console.log(err);
      // throw new Error(err);
    }
  };
  return (
    <submissionsContext.Provider
      value={{
        submissions,
        setSubmissions,
        marks,
        totalMarks,
        refreshSubmissions,
      }}
    >
      {children}
    </submissionsContext.Provider>
  );
};
