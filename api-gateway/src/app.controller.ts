import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class AppController {
  constructor(
    @Inject('ORDER_SERVICE_RABBITMQ')
    private readonly client: ClientProxy,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('order')
  createOrder(@Body() order: CreateOrderDto) {
    this.client.emit('order-created', order);
    console.log('Order Send to RabbitMQ', order);
    return { message: 'Order Send to RabbitMQ', order };
  }
}
