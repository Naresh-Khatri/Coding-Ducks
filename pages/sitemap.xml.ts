import axios from "axios";
import { IExam, IProblem, IUser } from "../types";

const baseUrl = {
  development: "http://localhost:3333",
  production: "https://api.codingducks.live",
}[process.env.NODE_ENV];

const hostUrl = {
  development: "http://localhost:3000",
  production: "https://codingducks.live",
}[process.env.NODE_ENV];
function SiteMap() {
  return null;
}

// HomePage
// Playground
// problems *
// users *
// exams *
// multiplayer *

interface generateSiteMapProps {
  exams: IExam[];
  users: IUser[];
  problems: IProblem[];
}
const generateSiteMap = ({ exams, problems, users }: generateSiteMapProps) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!--We manually set the two URLs we know already-->
     <url>
       <loc>${hostUrl}</loc>
       <lastmod>2021-07-21</lastmod>
       <changefreq>weekly</changefreq>
     </url>
     <url>
       <loc>${hostUrl}/playground</loc>
       <lastmod>2021-07-21</lastmod>
       <changefreq>monthly</changefreq>
     </url>
     ${problems
       .map(({ slug, updatedAt }) => {
         return generateSiteMapItem({
           path: `${hostUrl}/problems/${slug}`,
           lastmod: updatedAt?.split("T")[0],
           changefreq: "daily",
         });
       })
       .join("")}
     ${users
       .map(({ username, updatedAt }) => {
         return generateSiteMapItem({
           path: `${hostUrl}/users/${username}`,
           lastmod: updatedAt?.split("T")[0],
           changefreq: "daily",
         });
       })
       .join("")}
     ${exams
       .map(({ slug, updatedAt }) => {
         return generateSiteMapItem({
           path: `${hostUrl}/contests/${slug}`,
           lastmod: updatedAt.split("T")[0],
           changefreq: "weekly",
         });
       })
       .join("")}
   </urlset>
 `;
};

const generateSiteMapItem = ({ path, lastmod, changefreq }) => {
  return `
    <url>
      <loc>${path}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
    </url>
  `;
};

export async function getServerSideProps({ res }) {
  const { data: examsData } = await axios.get(`${baseUrl}/exams`);
  const {
    data: { data: usersData },
  } = await axios.get(`${baseUrl}/users`);
  const {
    data: {
      data: { problemsList: problemsData },
    },
  } = await axios.get(`${baseUrl}/problems/page`);
  res.setHeader("Content-Type", "text/xml");
  res.write(
    generateSiteMap({
      exams: examsData,
      users: usersData,
      problems: problemsData,
    })
  );
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
