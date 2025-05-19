
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev, // Disable PWA in development for faster HMR
  register: true,
  skipWaiting: true,
  // scope: '/app', // Adjust scope if your app is not at the root
  // sw: 'sw.js', // Custom service worker file name if needed
  // runtimeCaching: [ // Default caching is for static assets. 
                      // Be cautious if adding runtimeCaching for API routes,
                      // especially for data that needs to be fresh or is user-specific.
                      // NetworkFirst or NetworkOnly strategies are often safer for dynamic data.
  //   {
  //     urlPattern: /^https:\/\/api\.example\.com\/.*/,
  //     handler: 'NetworkFirst', // Or 'CacheFirst', 'NetworkOnly', etc.
  //     options: {
  //       cacheName: 'api-cache',
  //       expiration: {
  //         maxEntries: 50,
  //         maxAgeSeconds: 5 * 60, // 5 minutes
  //       },
  //     },
  //   },
  // ],
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
