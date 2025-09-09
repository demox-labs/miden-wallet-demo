/** @type {import('next').NextConfig} */

const { ProvidePlugin } = require('webpack');
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: require('next-pwa/cache'),
});
const { join } = require('path');

module.exports = withPWA({
  reactStrictMode: false,
  transpilePackages: [
    '@demox-labs/miden-wallet-adapter-base',
    '@demox-labs/miden-wallet-adapter-react',
    '@demox-labs/miden-wallet-adapter-reactui',
    '@demox-labs/miden-wallet-adapter-miden',
  ],
  ...(process.env.NODE_ENV === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
  webpack: (config, options) => {
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /The generated code contains 'async\/await' because this module is using "topLevelAwait"/,
    ];

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Ensure ES modules are handled correctly
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      stream: require.resolve('stream-browserify'),
      fs: require.resolve('browserify-fs'),
      wbg: false, // Ignore wbg imports for WASM bindgen
    });

    config.resolve.fallback = fallback;

    config.plugins = (config.plugins || []).concat([
      new ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ]);

    const experiments = config.experiments || {};
    Object.assign(experiments, {
      topLevelAwait: true,
    });
    config.experiments = experiments;

    const alias = config.resolve.alias || {};
    Object.assign(alias, {
      '@/assets': join(__dirname, 'src/assets'),
      '@/components': join(__dirname, 'src/components'),
      '@/config': join(__dirname, 'src/config'),
      '@/layouts': join(__dirname, 'src/layouts'),
      '@/lib': join(__dirname, 'src/lib'),
      '@/types': join(__dirname, 'src/types'),
      react$: require.resolve('react'),
    });
    config.resolve.alias = alias;

    return config;
  },
});
