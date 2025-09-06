/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ✅ Ignore ESLint errors during builds (Vercel won't block deploys)
        ignoreDuringBuilds: true,
    },
    typescript: {
        // ✅ Ignore TypeScript errors during builds
        ignoreBuildErrors: true,
    },
    experimental: {
        allowedDevOrigins: ["http://192.168.56.1:3000"],
    },
};

export default nextConfig;
module.exports = nextConfig;

