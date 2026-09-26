import type { MiddlewareHandler } from "astro";
import { oauthProviderPaths } from "@/lib/auth/routes";

// Used for bypassing astro layer
// and immediately goes to better auth own route handling
const betterAuthOauthRoutes = new Set<string>(
    Object.entries(oauthProviderPaths)
        .filter(([name]) => name !== "authorization")
        .map(([, path]) => path),
);

const oauthMetadataRoutes = new Set<string>([
    oauthProviderPaths.openIdConfiguration,
    oauthProviderPaths.authorizationServerMetadata,
]);

export const onRequest: MiddlewareHandler = async (c, next) => {
    if (betterAuthOauthRoutes.has(c.url.pathname)) {
        // Lazy import auth to avoid loading it on every request
        const {
            oauthAuthorizationServerMetadata,
            openIdProviderMetadata,
            withAuth,
        } = await import("@/lib/auth");
        const response = await withAuth((auth) => auth.handler(c.request));

        if (!response.ok || !oauthMetadataRoutes.has(c.url.pathname)) {
            return response;
        }

        const metadata = (await response.json()) as Record<string, unknown>;
        delete metadata.end_session_endpoint;

        Object.assign(
            metadata,
            c.url.pathname === oauthProviderPaths.openIdConfiguration
                ? openIdProviderMetadata
                : oauthAuthorizationServerMetadata,
        );

        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("content-type", "application/json");

        return new Response(JSON.stringify(metadata), {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    return next();
};
