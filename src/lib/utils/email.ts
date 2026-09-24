import { env } from "cloudflare:workers";

import { Resend } from "resend";
import { formatDevice } from "@/lib/utils/ua";

import type { User } from "better-auth";

const MAIL_FROM = "NHY Auth <noreply@auth.hackyouth.id>";
export const getResend = () =>
    new Resend(env?.RESEND_API_KEY ?? process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, token: string, req?: Request) {
    const device = formatDevice(req?.headers?.get("user-agent"));
    const location = [req?.cf?.country, req?.cf?.region]
        .filter(Boolean)
        .join(", ");

    const url = new URL(
        "/callback/magic",
        env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
    );
    url.searchParams.set("t", token);

    const resend = getResend();
    await resend.emails.send({
        from: MAIL_FROM,
        to: email,
        template: {
            id: "magic-link",
            variables: {
                MAGIC_URL: url.toString(),
                DEVICE: device ?? "Unknown device",
                LOCATION: location ?? "Unknown location",
            },
        },
    });
}

export async function sendVerifyDeletionEmail(
    user: User,
    token: string,
    req?: Request,
) {
    const device = formatDevice(req?.headers?.get("user-agent"));
    const location = [req?.cf?.country, req?.cf?.region]
        .filter(Boolean)
        .join(", ");

    const url = new URL(
        "/profile/delete/confirm",
        env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
    );
    url.searchParams.set("t", token);

    const resend = getResend();
    await resend.emails.send({
        from: MAIL_FROM,
        to: `${user.name ?? "User"} <${user.email}>`,
        template: {
            id: "verify-deletion",
            variables: {
                DELETE_URL: url.toString(),
                DEVICE: device ?? "Unknown device",
                LOCATION: location ?? "Unknown location",
            },
        },
    });
}
