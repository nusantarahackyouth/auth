import { actions } from "astro:actions";
import type { APIRoute } from "astro";

export const prerender = false;

function getErrorRedirect(request: Request): string {
    const requestUrl = new URL(request.url);
    const referer = request.headers.get("referer");
    if (!referer) return "/";

    try {
        const refererUrl = new URL(referer);
        if (refererUrl.origin !== requestUrl.origin) return "/";

        return `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`;
    } catch {
        return "/";
    }
}

export const POST: APIRoute = async (context) => {
    const result = await context.callAction(actions.logout, new FormData());

    return context.redirect(
        result.error ? getErrorRedirect(context.request) : "/login",
        303,
    );
};

