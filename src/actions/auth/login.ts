import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";

import { withAuth } from "@/lib/auth";
import { lang } from "@/lib/auth/lang";
import { APIError } from "better-auth";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";

export type LoginResult = {
    success: true;
    url?: string;
};

export const login = defineAction({
    accept: "form",
    input: z.discriminatedUnion("method", [
        z.object({
            method: z.literal("google"),
            login_hint: z.email().optional(),
            redirect_to: z.string().optional(),
        }),
        z.object({
            method: z.literal("magic"),
            login_hint: z.email(),
            redirect_to: z.string().optional(),
        }),
    ]),
    handler: async (
        { method, login_hint, redirect_to },
        c,
    ): Promise<LoginResult> => {
        const headers = c.request.headers;

        const callbackErrorRedirectTo =
            !redirect_to || redirect_to === "/"
                ? "/login"
                : `/login?${new URLSearchParams({
                      redirect_to,
                  })}`;

        const newUserRedirectTo =
            !redirect_to || redirect_to === "/"
                ? "/welcome"
                : `/welcome?${new URLSearchParams({
                      redirect_to,
                  })}`;

        try {
            if (method == "google") {
                const { response: result, headers: responseHeaders } =
                    await withAuth((auth) =>
                        auth.api.signInSocial({
                            headers,
                            body: {
                                provider: "google",
                                callbackURL: redirect_to ?? "/",
                                errorCallbackURL: callbackErrorRedirectTo,
                                newUserCallbackURL: newUserRedirectTo,
                            },
                            returnHeaders: true,
                        }),
                    );

                for (const setCookie of responseHeaders.getSetCookie()) {
                    for (const [name, attributes] of parseSetCookieHeader(
                        setCookie,
                    )) {
                        c.cookies.set(
                            name,
                            attributes.value,
                            toCookieOptions(attributes),
                        );
                    }
                }

                if (!result.url) {
                    throw new ActionError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: lang.INTERNAL_SERVER_ERROR,
                    });
                }
                return { success: true, url: result.url };
            
            } else if (method == "magic") {
                const { status } = await withAuth((auth) =>
                    auth.api.signInMagicLink({
                        headers,
                        body: {
                            email: login_hint,
                            callbackURL: newUserRedirectTo,
                            errorCallbackURL: callbackErrorRedirectTo,
                            newUserCallbackURL: newUserRedirectTo,
                        },
                    }),
                );

                if (!status) {
                    throw new ActionError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: lang.INTERNAL_SERVER_ERROR,
                    });
                }

                return { success: true };
            }

            throw new ActionError({
                code: "BAD_REQUEST",
                message: lang.PROVIDER_NOT_FOUND,
            });
        } catch (err) {
            if (err instanceof ActionError || err instanceof APIError) {
                throw err;
            }

            throw new ActionError({
                code: "INTERNAL_SERVER_ERROR",
                message: lang.INTERNAL_SERVER_ERROR,
            });
        }
    },
});
