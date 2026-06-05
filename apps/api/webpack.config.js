// NestJS webpack config — bundles all workspace TypeScript packages into dist/main.js
// @prisma/client is externalized because it uses native bindings at runtime

module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
    'class-transformer/storage',
    // Optional NestJS peer deps not installed in this project
    '@nestjs/platform-express',
    '@fastify/static',
    '@fastify/view',
    'fastify-plugin',
    'cache-manager',
    'class-validator',
    'class-transformer',
  ];

  return {
    ...options,
    externals: [
      // Keep @prisma/client as a runtime require — it has native .node binaries
      { '@prisma/client': 'commonjs @prisma/client' },
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
