import { createAccessControl } from "better-auth/plugins/access";
import type { AdminOptions } from "better-auth/plugins";

export const availablePerms = {
    users: [
        "read",
        "read-info",
        "update-info",
        "update-note",
        "enable",
        "disable",
    ],
    mods: [
        "read",
        "read-info",
        "read-logs",
        "update-info",
        "update-note",
        "promote",
        "revoke",
    ],
    oauths: ["read", "create", "update", "delete"],
    actions: ["read"],
} as const;

type PermissionSet = {
    [Resource in keyof typeof availablePerms]?: Array<
        (typeof availablePerms)[Resource][number]
    >;
};

export const minimumAdminAccessPerms = [
    { users: ["read"] },
    { mods: ["read"] },
    { oauths: ["read"] },
    { actions: ["read"] },
] satisfies PermissionSet[];

const ac = createAccessControl(availablePerms);

const user = ac.newRole({});
const mod = ac.newRole({
    users: ["read", "read-info", "update-note", "enable", "disable"],
});
const admin = ac.newRole({
    users: ["read", "read-info", "update-note", "enable", "disable"],
    mods: [
        "read",
        "read-info",
        "read-logs",
        "update-info",
        "update-note",
        "promote",
        "revoke",
    ],
    oauths: ["read", "create", "update", "delete"],
    actions: ["read"],
});

export const adminRoleSettings = {
    ac,
    roles: { user, mod, admin },
} satisfies AdminOptions;
