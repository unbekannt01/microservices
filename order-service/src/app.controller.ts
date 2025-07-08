import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class AppController {
  constructor(
    @Inject('PAYMENT_CLIENT') private readonly paymentRMQClient: ClientProxy,
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationRMQClient: ClientProxy,
    private readonly appService: AppService,
  ) {}

  @Get()
  getData(): string {
    return this.appService.getData();
  }

  @MessagePattern('order-created')
  handleOrderCreated(@Payload() createOrderDto: CreateOrderDto) {
    console.log('[Order-Service]: Received New Order:', createOrderDto);
    this.paymentRMQClient.emit('process-payment', createOrderDto);
    this.notificationRMQClient.emit('order-created', createOrderDto);
  }
}
