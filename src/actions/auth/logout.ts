import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";

import { withAuth } from "@/lib/auth";
import { lang } from "@/lib/auth/lang";
import { APIError } from "better-auth";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { setToast } from "@/lib/utils/toast";

export type LogoutResult = {
    success: boolean;
};

export const logout = defineAction({
    accept: "form",
    input: z.object({}),
    handler: async (_, c): Promise<LogoutResult> => {
        const requestUrl = new URL(c.request.url);

        try {
            const { headers: responseHeaders } = await withAuth(async (auth) =>
                auth.api.signOut({
                    headers: c.request.headers,
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

            setToast(c.cookies, requestUrl, [
                            "success",
                            "Successfully logged out!",
                        ]);
            return { success: true };
        } catch (error) {
            setToast(c.cookies, requestUrl, [
                "error",
                "Failed to logout. Try again perhaps?",
            ]);

            if (error instanceof ActionError || error instanceof APIError) {
                throw error;
            }

            throw new ActionError({
                code: "INTERNAL_SERVER_ERROR",
                message: lang.INTERNAL_SERVER_ERROR,
            });
        }
    },
});
