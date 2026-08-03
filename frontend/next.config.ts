import type { NextConfig } from "next"

const backendApiBaseUrl =
	process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://backend:8000"

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${backendApiBaseUrl}/api/:path*`,
			},
		]
	},
}

export default nextConfig
