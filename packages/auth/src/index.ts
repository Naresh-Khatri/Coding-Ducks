import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

import { db, eq, user as userTable, userProfile } from "@acme/db";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;

  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
        currentURL: options.baseUrl,
      }),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        // redirectURI: `${options.productionUrl}/api/auth/callback/github`,
      },
      github: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
        redirectURI: `${options.productionUrl}/api/auth/callback/github`,
      },
    },
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            const baseUsername =
              createdUser.name?.toLowerCase().replace(/\s+/g, "_") ||
              createdUser.email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              "user";
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const username = `${baseUsername}_${randomSuffix}`;

            await db.insert(userProfile).values({
              userId: createdUser.id,
              username,
              fullname: createdUser.name,
              photoURL: createdUser.image,
            });

            // Also update the user's username field in the main user table
            await db
              .update(userTable)
              .set({ username })
              .where(eq(userTable.id, createdUser.id));
          },
        },
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
