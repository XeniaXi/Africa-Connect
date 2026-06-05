import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Fail fast if JWT_SECRET is still the default placeholder
  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (process.env.NODE_ENV === 'production' && jwtSecret.includes('change-me')) {
    throw new Error('JWT_SECRET must be changed from the default value in production');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // CORS — explicit origin allowlist; falls back to localhost in dev
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('v1');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ConnectAfrica API')
      .setDescription('AI discovery, trust and transaction layer for African businesses')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`ConnectAfrica API running on :${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);

  // Graceful shutdown — drain in-flight requests before closing DB pool
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    await app.close();
    logger.log('All connections closed. Goodbye.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
