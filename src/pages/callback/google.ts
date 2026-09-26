import { withAuth } from "@/lib/auth";

import { createCallbackHandler } from "./_handler";

export const prerender = false;

export const GET = createCallbackHandler(async ({ request, url }) => {
    await withAuth((auth) =>
        auth.api.callbackOAuth({
            headers: request.headers,
            params: {
                id: "google",
            },
            query: {
                code: url.searchParams.get("code") ?? undefined,
                error: url.searchParams.get("error") ?? undefined,
                device_id: url.searchParams.get("device_id") ?? undefined,
                error_description:
                    url.searchParams.get("error_description") ?? undefined,
                state: url.searchParams.get("state") ?? undefined,
                user: url.searchParams.get("user") ?? undefined,
                iss: url.searchParams.get("iss") ?? undefined,
            },
        }),
    );
});
