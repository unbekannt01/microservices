/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

interface PaymentCompletedPayload {
  id: string;
}

@Controller()
export class AppController {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('PAYMENT_CLIENT') private readonly paymentRMQClient: ClientProxy,
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationRMQClient: ClientProxy,
    private readonly appService: AppService,
  ) {}

  @Get()
  getData(): string {
    return this.appService.getData();
  }

  @Get()
  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find();
  }

  @MessagePattern('order-created')
  async handleOrderCreated(@Payload() createOrderDto: CreateOrderDto) {
    const { id, ...rest } = createOrderDto;
    const order = this.orderRepository.create({
      ...rest,
      status: 'pending',
    });

    const savedOrder = await this.orderRepository.save(order);
    console.log('[Order-Service]: Received New Order:', savedOrder);

    // Emit to Other Service
    this.paymentRMQClient.emit('process-payment', savedOrder);
    this.notificationRMQClient.emit('order-created', savedOrder);
  }

  @MessagePattern('payment-completed')
  async handlePaymentComplted(@Payload() orderData: PaymentCompletedPayload) {
    console.log('[Order-Service]: Payment Completed for order: ', orderData.id);
    await this.orderRepository.update(orderData.id, { status: 'completed' });
  }
}
