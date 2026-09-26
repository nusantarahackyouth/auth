export const oauthProviderPaths = {
    authorization: "/authorize",
    token: "/oauth2/token",
    userInfo: "/oauth2/userinfo",
    introspection: "/oauth2/introspect",
    revocation: "/oauth2/revoke",
    jwks: "/oauth2/jwks",
    openIdConfiguration: "/.well-known/openid-configuration",
    authorizationServerMetadata: "/.well-known/oauth-authorization-server",
} as const;
