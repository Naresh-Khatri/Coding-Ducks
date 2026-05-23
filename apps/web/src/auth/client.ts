import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        username: { type: "string" },
        isAdmin: { type: "boolean" },
      },
    }),
  ],
});
