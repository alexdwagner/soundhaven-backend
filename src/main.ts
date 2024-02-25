import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Enhanced ValidationPipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log(`Serving static files from: ${uploadsPath}`);
  app.use('/uploads', express.static(uploadsPath));

  const port = process.env.PORT || 3122;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
