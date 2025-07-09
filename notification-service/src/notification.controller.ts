import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class NotificationController {
  constructor() {}

  @MessagePattern('order-created')
  sendOrderCreatedEmail(@Payload() createOrderDto: any) {
    console.log(
      '[Notification-Service]: Sending Order Created Email',
      createOrderDto,
    );
  }

  @MessagePattern('payment-succeed')
  sendPaymentSucceedEmail(@Payload() createOrderDto: any) {
    console.log(
      '[Notification-Service]: Sending Payment Succeed Email',
      createOrderDto,
    );
  }
}
