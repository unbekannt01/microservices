import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';

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
    const orderWithId = {
      ...order,
      id: order.id || uuidv4(),
    };

    this.client.emit('order-created', orderWithId);
    console.log('Order Send to RabbitMQ', orderWithId);
    return { message: 'Order Send to RabbitMQ', order: orderWithId };
  }
}
