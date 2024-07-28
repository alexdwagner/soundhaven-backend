import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { ConfigService } from './config/config.service';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors(); // Enables CORS for all origins

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('SoundHaven API')
    .setDescription('Backend app for Soundhaven')
    .setVersion('1.0')
    .addTag('soundhaven')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadsPath = configService.fullUploadPath;
  logger.log(`Serving static files from: ${uploadsPath}`);
  app.use('/uploads', express.static(uploadsPath));

  // Serve static files from the public directory
  const publicPath = join(__dirname, '..', 'public');
  logger.log(`Serving public files from: ${publicPath}`);
  app.use('/public', express.static(publicPath));

  const port = configService.port;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
