export const config = {
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  opensearch: {
    node: process.env.OPENSEARCH_NODE ?? 'http://localhost:9200',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'connectafrica',
  },
  api: {
    port: parseInt(process.env.API_PORT ?? '4000'),
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    publicBase: process.env.PUBLIC_BASE ?? 'http://localhost:4000',
  },
  mcp: {
    port: parseInt(process.env.MCP_PORT ?? '4001'),
    publicBase: process.env.MCP_PUBLIC_BASE ?? 'http://localhost:4001',
  },
} as const;
