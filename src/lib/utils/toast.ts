import type { APIContext } from "astro";

export type ToastType = "error" | "success" | "warn" | "info";
export type Toast = readonly [ToastType, string];

type ToastKind = 0 | 1 | 2 | 3;
type StoredToast = readonly [ToastKind, string];
type Cookies = APIContext["cookies"];

const toastKinds: Record<ToastType, ToastKind> = {
    error: 0,
    success: 1,
    warn: 2,
    info: 3,
};

const toastTypes: Record<ToastKind, ToastType> = {
    0: "error",
    1: "success",
    2: "warn",
    3: "info",
};

export function setToast(cookies: Cookies, url: URL, toast: Toast): void {
    const storedToast: StoredToast = [toastKinds[toast[0]], toast[1]];

    cookies.set("nhy-toast", JSON.stringify(storedToast), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: url.protocol === "https:",
    });
}

function isToastKind(value: unknown): value is ToastKind {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 3
    );
}

function parseToast(value: string): Toast | undefined {
    try {
        const toast: unknown = JSON.parse(value);
        if (
            Array.isArray(toast) &&
            toast.length === 2 &&
            isToastKind(toast[0]) &&
            typeof toast[1] === "string"
        ) {
            return [toastTypes[toast[0]], toast[1]];
        }
    } catch {}

    return undefined;
}

export function consumeToast(
    cookies: Cookies,
    type?: ToastType,
): Toast | undefined {
    const cookie = cookies.get("nhy-toast");
    if (!cookie) return undefined;

    const toast = parseToast(cookie.value);
    if (type !== undefined && toast?.[0] !== type) return undefined;

    cookies.delete("nhy-toast", { path: "/" });
    return toast;
}
