import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    'pending',
    'processing',
    'completed',
    'failed',
    'payment_failed',
    'cancelled',
  ])
  status: string;
}
