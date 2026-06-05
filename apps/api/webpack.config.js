// NestJS webpack config — bundles all workspace TypeScript packages into dist/main.js
// @prisma/client is externalized because it uses native bindings at runtime

module.exports = (options, webpack) => {
  const lazyImports = [
    // NestJS lazy-loaded internal modules (not used in this project)
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
    'class-transformer/storage',
    // Optional peer deps that are NOT installed (using Fastify, not Express)
    '@nestjs/platform-express',
    '@fastify/static',
    '@fastify/view',
  ];

  return {
    ...options,
    externals: [
      // Keep @prisma/client as a runtime require — it has native .node binaries
      { '@prisma/client': 'commonjs @prisma/client' },
      // NestJS PackageLoader uses dynamic require(variableName) which webpack
      // can't statically analyze — externalize so Node resolves them at runtime
      { 'class-validator': 'commonjs class-validator' },
      { 'class-transformer': 'commonjs class-transformer' },
      // Keep all .node native addons external
      function ({ request }, callback) {
        if (/\.node$/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
    plugins: [
      ...options.plugins,
      // Suppress optional peer dependency warnings from NestJS internals
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return lazyImports.includes(resource);
        },
      }),
    ],
  };
};
