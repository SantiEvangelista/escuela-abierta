import type { NextConfig } from "next";
const config: NextConfig = { output: process.env.VERCEL ? undefined : "standalone", poweredByHeader: false, allowedDevOrigins: ["a55717d84ab3.ngrok.app"] };
export default config;
