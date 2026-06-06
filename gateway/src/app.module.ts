import { Module } from '@nestjs/common';
import { BatchesController } from './batches/batches.controller';
import { WebhooksService } from './webhooks/webhooks.service';

@Module({
  imports: [],
  controllers: [BatchesController],
  providers: [WebhooksService],
})
export class AppModule {}
