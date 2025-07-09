/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
// payment-service/src/app.controller.ts

import { Controller, Get, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { Payment } from './entities/payment.entity';

@Controller()
export class PaymentController {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationRMQClient: ClientProxy,
  ) {}

  @Get('payments')
  async getAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.find();
  }

  @MessagePattern('process-payment')
  async handleProcessPayment(@Payload() createOrderDto: CreateOrderDto) {
    console.log('[Payment-Service]: Payment in process', createOrderDto);

    // Create payment record
    const payment = this.paymentRepository.create({
      orderId: createOrderDto.id,
      email: createOrderDto.email,
      amount: createOrderDto.quantity * 100,
      status: 'pending',
    });

    const savedPayment = await this.paymentRepository.save(payment);
    console.log('[Payment-Service]: Payment record created:', savedPayment);

    setTimeout(() => {
      this.paymentRepository.update(savedPayment.id, {
        status: 'completed',
        transactionId: `txn_${Date.now()}`,
      });

      console.log('[Payment-Service]: Payment completed', savedPayment.status);

      this.notificationRMQClient.emit('payment-succeed', {
        ...createOrderDto,
        paymentId: savedPayment.id,
      });
    }, 2000);
  }
}
