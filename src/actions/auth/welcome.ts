import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { eq } from "drizzle-orm";

import { withAuth } from "@/lib/auth";
import { lang } from "@/lib/auth/lang";
import { user } from "@/lib/db/schema";
import { APIError } from "better-auth";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";

export type WelcomeResult =
    | { step: 0; complete: false; data: {} }
    | {
          step: 1;
          complete: false;
          data: {
              name: string | null;
          };
      }
    | { step: 2; complete: true; data: {} };

export const welcome = defineAction({
    accept: "form",
    input: z.discriminatedUnion("step", [
        z.object({ step: z.literal("0") }),
        z.object({
            step: z.literal("1"),
            name: z.string().trim().min(1).max(255),
        }),
    ]),

    handler: async (input, c): Promise<WelcomeResult> => {
        const { step } = input;
        try {
            const operation = await withAuth(async (auth, db) => {
                const authSession = await auth.api.getSession({
                    headers: c.request.headers,
                    query: {
                        disableCookieCache: true,
                    },
                });

                if (!authSession) {
                    throw new ActionError({
                        code: "UNAUTHORIZED",
                        message: lang.UNAUTHORIZED,
                    });
                }

                if (step === "0") {
                    return {
                        result: {
                            step: 1,
                            complete: false,
                            data: {
                                name: authSession.user.name.trim() || null,
                            },
                        } satisfies WelcomeResult,
                    };
                }

                const { headers } = await auth.api.updateUser({
                    headers: c.request.headers,
                    body: {
                        name: input.name,
                    },
                    returnHeaders: true,
                });

                await db
                    .update(user)
                    .set({ welcomeDoneAt: new Date() })
                    .where(eq(user.id, authSession.user.id));

                return {
                    result: {
                        step: 2,
                        complete: true,
                        data: {},
                    } satisfies WelcomeResult,
                    headers,
                };
            });

            if (operation.headers) {
                for (const setCookie of operation.headers.getSetCookie()) {
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
            }

            return operation.result;
        } catch (error) {
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
