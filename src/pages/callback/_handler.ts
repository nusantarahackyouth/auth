import type { APIRoute } from "astro";

import { lang } from "@/lib/auth/lang";
import { setToast } from "@/lib/utils/toast";

type CallbackOperationContext = {
    request: Request;
    url: URL;
};

type CallbackOperation = (
    context: CallbackOperationContext,
) => Promise<unknown>;

type CallbackHandlerOptions = {
    successMessage?: string;
    errorRedirectPath?: string;
};

type ThrownCallback = {
    body?: { code?: unknown };
    headers?: HeadersInit;
    statusCode?: unknown;
};

const fallbackErrorMessage = lang.INTERNAL_SERVER_ERROR;

function getErrorMessage(error: string): string {
    const key = error.toUpperCase() as keyof typeof lang;
    const message = lang[key];

    return typeof message === "string" ? message : fallbackErrorMessage;
}

function removeErrorParams(url: URL): void {
    for (const key of [...url.searchParams.keys()]) {
        if (key.startsWith("error")) url.searchParams.delete(key);
    }
}


export function createCallbackHandler(
    operation: CallbackOperation,
    options: CallbackHandlerOptions = {},
): APIRoute {
    const {
        successMessage = "Successfully logged in!",
        errorRedirectPath = "/login",
    } = options;

    return async ({ request, cookies }) => {
        const callbackUrl = new URL(request.url);
        const respondWithError = (code: string) => {
            setToast(cookies, callbackUrl, ["error", getErrorMessage(code)]);

            return new Response(null, {
                status: 302,
                headers: {
                    location: errorRedirectPath,
                },
            });
        };

        try {
            await operation({ request, url: callbackUrl });
        } catch (error) {
            const details = error as ThrownCallback;
            const headers = new Headers(details.headers);
            const location = headers.get("location");
            const status =
                typeof details.statusCode === "number"
                    ? details.statusCode
                    : 302;

            if (!location) {
                const code =
                    typeof details.body?.code === "string"
                        ? details.body.code
                        : "INTERNAL_SERVER_ERROR";

                return respondWithError(code);
            }

            const redirectUrl = new URL(location, callbackUrl);
            const callbackError = redirectUrl.searchParams.get("error");

            if (!callbackError) {
                setToast(cookies, callbackUrl, ["success", successMessage]);

                return new Response(null, { status, headers });
            }

            setToast(cookies, callbackUrl, [
                            "error",
                            getErrorMessage(callbackError),
                        ]);
            removeErrorParams(redirectUrl);
            headers.set(
                "location",
                redirectUrl.pathname === errorRedirectPath
                    ? `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
                    : errorRedirectPath,
            );

            return new Response(null, { status, headers });
        }

        return respondWithError("INTERNAL_SERVER_ERROR");
    };
}
