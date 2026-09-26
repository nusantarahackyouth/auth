import { locales, type TranslationDictionary } from "@better-auth/i18n";

export const lang: Readonly<TranslationDictionary> = {
    ...locales.en,

    BANNED_USER:
        "This account is cooked. If this was a mistake, please contact our staff.",
    EMAIL_MISMATCH:
        "You can't use this account for linking. Use an account with the same email.",
    EMAIL_NOT_VERIFIED: "Verify the account email first before sign-in, duh.",
    FAILED_TO_CREATE_USER:
        "Can't make your account for now. Weird, try again? If still happens, contact our staff.",
    FAILED_TO_CREATE_SESSION:
        "Can't make you logged in for now. Weird, try again? If still happens, contact our staff.",
    INVALID_CODE: "This code is invalid/expired. Please try again.",
    INTERNAL_SERVER_ERROR:
        "Something went wrong. Weird, try again? If still happens, contact our staff.",
    LINKED_ACCOUNT_ALREADY_EXISTS:
        "Can't link this account. If this is a mistake, please contact our staff.",
    NO_CODE: "Trying to bypass auth? Good luck.",
    PROVIDER_NOT_FOUND: "Are you trying to breach our auth? Not found btw.",
    SESSION_EXPIRED: "Session has expired. Please login again.",
    SIGNUP_DISABLED: "Sign-up is not available right now. Try again later?",
    STATE_MISMATCH: "This login session is invalid/expired. Please try again.",
    STATE_NOT_FOUND: "Trying to bypass auth? Good luck.",
    TOO_MANY_ATTEMPTS: "Too many attempts. Try again later?",
    UNAUTHORIZED: "You're not logged in. Please login first.",
};
