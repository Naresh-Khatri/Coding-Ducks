import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, oAuthProxy } from "better-auth/plugins";

import { db, eq, userProfile, user as userTable } from "@acme/db";

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
    user: {
      additionalFields: {
        username: {
          type: "string",
          required: false, // generated in hook, not provided by user
          input: false,
        },
        isAdmin: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
        currentURL: options.baseUrl,
      }),
      customSession(async ({ user, session }) => {
        const [dbUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, user.id))
          .limit(1);
        return {
          user: {
            ...user,
            isAdmin: dbUser?.isAdmin,
            username: dbUser?.username,
          },
          session,
        };
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
          before: async (user) => {
            // Generate a unique username before user creation
            const baseName =
              user.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              user.email
                .split("@")[0]
                ?.toLowerCase()
                .replace(/[^a-z0-9]/g, "") ||
              "user";

            // Truncate base to leave room for suffix
            const base = baseName.slice(0, 20);
            let username = "";

            // Try up to 10 times with increasing suffix range
            for (let attempt = 0; attempt < 10; attempt++) {
              const suffix = Math.floor(1000 + Math.random() * 9000);
              const candidate = `${base}${suffix}`;

              const [existing] = await db
                .select({ id: userTable.id })
                .from(userTable)
                .where(eq(userTable.username, candidate))
                .limit(1);

              if (!existing) {
                username = candidate;
                break;
              }
            }

            // Fallback: use timestamp-based suffix
            if (!username) {
              username = `${base}${Date.now() % 100000}`;
            }

            return {
              data: {
                ...user,
                username,
              },
            };
          },
          after: async (createdUser) => {
            const username = createdUser.username as string;
            await db.insert(userProfile).values({
              userId: createdUser.id,
              username,
              fullname: createdUser.name,
              photoURL: createdUser.image,
              avatarSeed: username,
            });
          },
        },
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
