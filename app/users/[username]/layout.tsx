import generateMeta from "_components/SEO/generateMeta";
import { getUser } from "hooks/useUsersData";
import { ReactNode } from "react";
export async function generateMetadata({ params }) {
  const { username } = params;
  const userData = await getUser(username as string);
  const metaData = generateMeta({
    title: `${userData.username} - User Profile and Achievements`,
    description: `bio - ${userData.bio}`,
    keywords: `${userData.fullname}, user profile, coding achievements, coding solutions, community contributions`,
    image: userData.photoURL,
    url: `https://www.codingducks.xyz/users/${userData.username}`,
  });
  return metaData;
}

function DuckletsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default DuckletsLayout;
