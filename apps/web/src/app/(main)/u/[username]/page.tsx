import type { Metadata } from "next";

import { ProfileView } from "./_components/profile-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | Coding Ducks`,
    description: `View ${username}'s profile, submissions, and progress on Coding Ducks.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return <ProfileView username={username} />;
}
