import { env } from "cloudflare:workers";

import { betterAuth } from "better-auth";
import { admin, jwt, magicLink } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { adminRoleSettings, minimumAdminAccessPerms } from "@/lib/auth/admin";
import { oauthProviderPaths } from "@/lib/auth/routes";

import { i18n } from "@better-auth/i18n";
import { lang } from "@/lib/auth/lang";

import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { withDb, type Database } from "@/lib/db";
import * as schema from "@/lib/db/schema";

import { sendMagicLinkEmail, sendVerifyDeletionEmail } from "@/lib/utils/email";

const authBaseUrl =
    env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;

if (!authBaseUrl) {
    throw new Error("BETTER_AUTH_URL is required");
}

export { oauthProviderPaths };

const oauthScopes = ["openid", "profile", "email", "offline_access", "roles"] as const;

const oauthClaims = [
    "sub",
    "name",
    "email",
    "picture",
    "email_verified",
    "roles",
] as const;

export const oauthAuthorizationServerMetadata = {
    authorization_endpoint: new URL(oauthProviderPaths.authorization, authBaseUrl).toString(),
    scopes_supported: oauthScopes,
    token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_basic",
        "client_secret_post",
        "private_key_jwt",
    ],
} as const;

export const openIdProviderMetadata = {
    ...oauthAuthorizationServerMetadata,
    claims_supported: oauthClaims,
    prompt_values_supported: ["none"],
} as const;

function getUserRoles(user: Record<string, unknown>) {
    if (typeof user.role !== "string") return [];

    return user.role
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
}

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

export function createAuth(db: Database) {
    return betterAuth({
        appName: "NHY Auth",
        baseURL: authBaseUrl,
        basePath: "/",
        secret: env.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
        database: drizzleAdapter(db, {
            provider: "pg",
            schema,
        }),
        disabledPaths: [
            "/token",
            "/oauth2/end-session",
            "/oauth2/end-session/confirm",
        ],
        plugins: [
            admin({
                ...adminRoleSettings,
                defaultRole: "user",
                bannedUserMessage: lang.BANNED_USER,
            }),
            // magicLink({
            //     sendMagicLink: async ({ email, token }, ctx) => {
            //         return sendMagicLinkEmail(email, token, ctx?.request);
            //     },
            //     expiresIn: 600,
            //     disableSignUp: isSignupDisabled("magic"),
            // }),
            jwt({
                disableSettingJwtHeader: true,
                jwks: {
                    jwksPath: oauthProviderPaths.jwks,
                },
            }),
            oauthProvider({
                loginPage: "/login",
                consentPage: "/authorize",
                scopes: [...oauthScopes],
                advertisedMetadata: {
                    scopes_supported: [...oauthScopes],
                    claims_supported: [...oauthClaims],
                },
                customUserInfoClaims: ({ user, scopes }) =>
                    scopes.includes("roles")
                        ? { roles: getUserRoles(user) }
                        : {},
                customIdTokenClaims: ({ user, scopes }) =>
                    scopes.includes("roles")
                        ? { roles: getUserRoles(user) }
                        : {},
                customAccessTokenClaims: ({ user, scopes }) =>
                    user && scopes.includes("roles")
                        ? { roles: getUserRoles(user) }
                        : {},
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
                redirectURI: new URL("/callback/google", authBaseUrl).toString(),
                requireEmailVerification: true,
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
        onAPIError: {
            throw: true,
        },
        advanced: {
            cookies: {
                state: {
                    name: "nhy-auth-state",
                },
                session_token: {
                    name: "nhy-session",
                },
                session_data: {
                    name: "nhy-session-cache",
                },
                dont_remember: {
                    name: "nhy-auth-temporary",
                },
            },
        },
    });
}

export type Auth = ReturnType<typeof createAuth>;

export function withAuth<T>(
    operation: (auth: Auth, db: Database) => Promise<T>,
): Promise<T> {
    // The Better Auth adapter captures its Drizzle instance, so it must share the
    // same request scope as the database client.
    return withDb((db) => operation(createAuth(db), db));
}

export function roleHasAdminAccess(role: keyof typeof adminRoleSettings.roles) {
    const rolePermissions = adminRoleSettings.roles[role];

    return minimumAdminAccessPerms.some(
        (permissions) => rolePermissions.authorize(permissions).success,
    );
}
