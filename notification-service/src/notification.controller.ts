import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class NotificationController {
  constructor() {}

  @MessagePattern('order-created')
  sendOrderCreatedEmail(@Payload() createOrderDto: CreateOrderDto) {
    console.log(
      '[Notification-Service]: Sending Order Created Email',
      createOrderDto,
    );
  }

  @MessagePattern('payment-succeed')
  sendPaymentSucceedEmail(@Payload() createOrderDto: CreateOrderDto) {
    console.log(
      '[Notification-Service]: Sending Payment Succeed Email',
      createOrderDto,
    );
  }
}
