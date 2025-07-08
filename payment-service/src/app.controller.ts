import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class AppController {
  constructor(
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationRMQClient: ClientProxy,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('process-payment')
  handleProcessPayment(@Payload() createOrderDto: CreateOrderDto) {
    console.log('[Payment-Service]: Payment in process', createOrderDto);
    this.notificationRMQClient.emit('payment-succeed', createOrderDto);
  }
}
