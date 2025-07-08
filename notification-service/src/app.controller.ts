import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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
