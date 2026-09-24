import { env } from "cloudflare:workers";

import { betterAuth } from "better-auth";
import { admin, magicLink } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { adminRoleSettings, minimumAdminAccessPerms } from "@/lib/auth/admin";

import { i18n } from "@better-auth/i18n";
import { lang } from "@/lib/auth/lang";

import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

import { sendMagicLinkEmail, sendVerifyDeletionEmail } from "@/lib/utils/email";

function isSignupDisabled(method: "magic" | "google") {
    const disabledSignups = String(
        env.DISABLE_SIGNUP ?? process.env.DISABLE_SIGNUP ?? "",
    )
        .toLowerCase()
        .split(",")
        .map((value) => value.trim());

    return (
        disabledSignups.some((value) =>
            ["1", "true", "yes", "on"].includes(value),
        ) || disabledSignups.includes(method)
    );
}

export const auth = betterAuth({
    appName: "NHY Auth",
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    disabledPaths: ["/token"],
    plugins: [
        admin({
            ...adminRoleSettings,
            defaultRole: "user",
            bannedUserMessage: lang.BANNED_USER,
        }),
        magicLink({
            sendMagicLink: async ({ email, token }, ctx) => {
                return sendMagicLinkEmail(email, token, ctx?.request);
            },
            expiresIn: 600,
            disableSignUp: isSignupDisabled("magic"),
        }),
        oauthProvider({
            loginPage: "/login",
            consentPage: "/authorize",
        }),
        i18n({
            translations: {
                en: lang,
            },
            defaultLocale: "en",
        }),
    ],
    socialProviders: {
        google: {
            clientId:
                env.GOOGLE_CLIENT_ID ??
                (process.env.GOOGLE_CLIENT_ID as string),
            clientSecret:
                env.GOOGLE_CLIENT_SECRET ??
                (process.env.GOOGLE_CLIENT_SECRET as string),
            disableSignUp: isSignupDisabled("google"),
        },
    },
    user: {
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: async ({ user, token }, req) => {
                return sendVerifyDeletionEmail(user, token, req);
            },
        },
    },
});

export function roleHasAdminAccess(role: keyof typeof adminRoleSettings.roles) {
    const rolePermissions = adminRoleSettings.roles[role];

    return minimumAdminAccessPerms.some(
        (permissions) => rolePermissions.authorize(permissions).success,
    );
}
