import { withAuth } from "@/lib/auth";

import { createCallbackHandler } from "./_handler";

export const prerender = false;

export const GET = createCallbackHandler(async ({ request, url }) => {
    await withAuth((auth) =>
        auth.api.magicLinkVerify({
            headers: request.headers,
            query: {
                token: url.searchParams.get("t") ?? "",
                callbackURL: url.searchParams.get("callbackURL") ?? "/welcome",
                errorCallbackURL:
                    url.searchParams.get("errorCallbackURL") ?? "/login",
                newUserCallbackURL:
                    url.searchParams.get("newUserCallbackURL") ?? "/welcome",
            },
        }),
    );
});
