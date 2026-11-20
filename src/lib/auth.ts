import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";
import { twoFactor, organization } from "better-auth/plugins";
import { logDevelopmentEmail } from "@/lib/dev-email";
import { SESSION_FRESH_AGE_SECONDS } from "@/lib/auth-config";
import { APIError } from "better-auth/api";
import { ac, organizationRoles } from "@/lib/permissions";
import { APP_BASE_PATH } from "@/lib/app-paths";

const secret = process.env.BETTER_AUTH_SECRET;
const configuredURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
}

if (!configuredURL) {
  throw new Error("BETTER_AUTH_URL is required");
}

const configuredURLObject = new URL(configuredURL);
const baseURL = configuredURLObject.origin;

export const auth = betterAuth({
  appName: "TenantBoard",
  secret,
  baseURL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        input: true,
      },
    },
    changeEmail: {
      enabled: true,

      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        void Promise.resolve()
          .then(() => {
            logDevelopmentEmail("email-change-confirmation", user.email, url);

            console.info(`Requested new email: ${newEmail}`);
          })
          .catch((error) => {
            console.error("Email change confirmation failed:", error);
          });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      logDevelopmentEmail("password-reset", user.email, url);
    },
  },
  emailVerification: {
    requireEmailVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("Sending verification email to:", user.email);
      logDevelopmentEmail("verification", user.email, url);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: SESSION_FRESH_AGE_SECONDS,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      requireEmailVerification: true,
      prompt: "select_account",
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  plugins: [
    twoFactor({
      issuer: "TenantBoard",
    }),
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      ac,
      roles: organizationRoles,
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 20,
      },
      requireEmailVerificationOnInvitation: true,
      invitationExpiresIn: 60 * 60 * 48,
      async sendInvitationEmail(data) {
        const inviteURL = new URL(
          `${configuredURLObject.origin}${APP_BASE_PATH}/invitations/accept`,
        );

        inviteURL.searchParams.set("invitationId", data.id);

        logDevelopmentEmail(
          "organization-invitation",
          data.email,
          inviteURL.toString(),
        );
      },
      organizationHooks: {
        beforeCreateInvitation: async ({ invitation }) => {
          const requestedRoles = Array.isArray(invitation.role)
            ? invitation.role
            : [invitation.role];

          if (requestedRoles.some((role) => role !== "member")) {
            throw new APIError("FORBIDDEN", {
              message:
                "Only the member role can be assigned through invitations.",
            });
          }
        },
      },
    }),
  ],
});
