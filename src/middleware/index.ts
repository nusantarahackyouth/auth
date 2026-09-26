import type { MiddlewareHandler } from "astro";
import {
    oauthAuthorizationServerMetadata,
    oauthProviderPaths,
    openIdProviderMetadata,
    withAuth,
} from "@/lib/auth";

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
