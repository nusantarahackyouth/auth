import type { MiddlewareHandler } from "astro";

// Used for bypassing astro layer
// and immediately goes to better auth own route handling
const betterAuthOauthRoutes = new Set([
    "/oauth2/authorize",
    "/oauth2/token",
    "/oauth2/userinfo",
    "/oauth2/introspect",
    "/oauth2/revoke",

    "/.well-known/openid-configuration",
    "/.well-known/oauth-authorization-server",
]);

export const onRequest: MiddlewareHandler = async (c, next) => {
    if (betterAuthOauthRoutes.has(c.url.pathname)) {
        // TODO
        // return auth.handler(c.request);
    }

    return next();
};
