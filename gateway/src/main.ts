import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function bootstrap() {
  // Load configuration from local environments
  dotenv.config({ path: path.join(process.cwd(), '../contracts/.env') });
  dotenv.config({ path: path.join(process.cwd(), '../web/.env.local') });
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`CargoTrust ERP Gateway running on http://localhost:${port}`);
}
bootstrap();
