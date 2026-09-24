import { locales, type TranslationDictionary } from "@better-auth/i18n";

export const lang: Readonly<TranslationDictionary> = {
    ...locales.en,

    BANNED_USER: "Your account is cooked. If this is a mistake, please contact our staff.",
    EMAIL_MISMATCH:
        "You can't use this account for linking. Use an account with the same email.",
    FAILED_TO_CREATE_USER:
        "Can't make your account for now. Weird, try again? If still happens, contact our staff.",
    FAILED_TO_CREATE_SESSION:
        "Can't make you logged in for now. Weird, try again? If still happens, contact our staff.",
    INVALID_CODE: "This code is invalid/expired. Request a new one please.",
    LINKED_ACCOUNT_ALREADY_EXISTS:
        "Can't link this account. If this is a mistake, please contact our staff.",
    PROVIDER_NOT_FOUND: "Are you trying to breach our auth? Not found btw.",
    SESSION_EXPIRED: "Session has expired. Please login again.",
    SIGNUP_DISABLED: "Sign-up is not available right now. Try again later?",
    TOO_MANY_ATTEMPTS: "Too many attempts. Try again later?",
};
