import generateMeta from "_components/SEO/generateMeta";
import { getChallenge } from "hooks/useChallengesData";
import NormalLayout from "layout/NormalLayout";
import { ReactNode } from "react";

export async function generateMetadata({ params }) {
  const { challengeSlug } = params;
  try {
    const data = await getChallenge(challengeSlug);
    // console.log(data);
    // const currRoom = data;
    // const metaData = generateMeta({
    //   title: `${currRoom.name} | UI Challenges`,
    //   description: `Join ${currRoom.name}, created By ${currRoom.owner?.fullname} - ${currRoom.description}`,
    //   url: `https://www.codingducks.xyz/ui-challenges/${roomId}`,
    //   image: currRoom.previewImage,
    // });
    // return metaData;
  } catch (err) {
    console.log(err);
  }
}

function UIChallengeSubmissionsLayout({ children }: { children: ReactNode }) {
  return <NormalLayout>{children}</NormalLayout>;
}

export default UIChallengeSubmissionsLayout;
