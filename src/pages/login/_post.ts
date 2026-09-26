import { actions } from "astro:actions";
import type { AstroGlobal } from "astro";

import type { LoginResult } from "@/actions/auth/login";

export type LoginPageState = {
    error: string | null;
    success: string | null;
};

export async function handleLoginPost(
    Astro: AstroGlobal,
): Promise<LoginPageState | Response> {
    const state: LoginPageState = {
        error: null,
        success: null,
    };

    if (Astro.request.method !== "POST") return state;

    const form = await Astro.request.formData();
    const redirectTo = Astro.url.searchParams.get("redirect_to") ?? "/";

    // Only allow internal destinations.
    const destination =
        redirectTo.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/";

    const actionForm = new FormData();
    const method = form.get("method");
    const loginHint = form.get("login_hint");

    if (typeof method === "string") {
        actionForm.set("method", method);
    }
    if (typeof loginHint === "string") actionForm.set("login_hint", loginHint);
    actionForm.set("redirect_to", destination);

    const { data, error } = await Astro.callAction(actions.login, actionForm);

    if (error) state.error = error.message;

    if (data) {
        const result = data as LoginResult;

        if (result.success && result.url) {
            return Astro.redirect(result.url, 303);
        }
    }

    return state;
}
