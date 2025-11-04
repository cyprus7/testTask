const apiOrigin = (() => {
    const value = process.env.NEXT_PUBLIC_API_URL;
    if (!value) return "";
    try {
        return new URL(value).origin;
    } catch {
        return value;
    }
})();

const securityHeaders = [
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://telegram.org https://*.telegram.org",
            "frame-ancestors https://web.telegram.org https://*.telegram.org",
            `connect-src 'self' https://*.telegram.org https://api.telegram.org ${apiOrigin}`.trim(),
            "img-src * blob: data:",
            "style-src 'self' 'unsafe-inline'"
        ].join("; ")
    },
    { key: "X-Frame-Options", value: "ALLOWALL" }
];

const nextConfig = {
    experimental: {
        typedRoutes: true
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders
            }
        ];
    }
};

export default nextConfig;
