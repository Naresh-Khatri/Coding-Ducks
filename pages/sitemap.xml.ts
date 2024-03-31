import axios from "axios";
import { IExam, IProblem, IUser } from "../types";
import { ISocketRoom } from "lib/socketio/socketEvents";

const baseUrl = {
  development: "http://localhost:3333",
  production: "https://api2.codingducks.xyz",
}[process.env.NODE_ENV];

const hostUrl = {
  development: "http://localhost:3000",
  production: "https://codingducks.xyz",
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
  ducklets: ISocketRoom[];
}
const generateSiteMap = ({
  exams,
  problems,
  users,
  ducklets,
}: generateSiteMapProps) => {
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
     ${ducklets
       .map(({ id, updatedAt }) => {
         return generateSiteMapItem({
           path: `${hostUrl}/ducklets/${id}`,
           lastmod: String(updatedAt).split("T")[0],
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
  const {
    data: { data: duckletsData },
  } = await axios.get(`${baseUrl}/rooms/`);
  res.setHeader("Content-Type", "text/xml");
  res.write(
    generateSiteMap({
      exams: examsData,
      users: usersData,
      problems: problemsData,
      ducklets: duckletsData,
    })
  );
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
