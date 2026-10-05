/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
 
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Next.js disables client chunk splitting in dev, so the page and main-app
  // bundles each grow to 5-6MB (half of it inline source maps). The v0 preview
  // proxy intermittently truncates responses that large, which Safari reports
  // as "SyntaxError: Unexpected EOF" while loading a chunk. Capping chunk size
  // in dev keeps every client chunk small enough to arrive intact.
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev && !isServer) {
      // Next.js resets `config.devtool` in dev, so swap the source-map plugin at
      // compiler setup instead: keep eval source maps for app code (readable
      // stack traces) but skip them for node_modules, which roughly halves the
      // size of vendor chunks like react-dom that cannot be split further.
      config.plugins.push({
        apply(compiler) {
          const { devtoolModuleFilenameTemplate, devtoolNamespace } = compiler.options.output
          compiler.options.devtool = false
          new webpack.EvalSourceMapDevToolPlugin({
            exclude: /node_modules/,
            module: true,
            columns: true,
            moduleFilenameTemplate: devtoolModuleFilenameTemplate,
            namespace: devtoolNamespace,
          }).apply(compiler)
        },
      })

      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          default: false,
          defaultVendors: false,
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          app: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      }
    }
    return config
  },
}

export default nextConfig
