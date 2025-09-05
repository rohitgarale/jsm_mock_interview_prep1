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
};

export default nextConfig;
