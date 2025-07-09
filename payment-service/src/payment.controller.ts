/* eslint-disable prettier/prettier */
// payment-service/src/payment.controller.ts
import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Payment } from './entities/payment.entity';
import { IOrderForPayment, IPaymentData } from './interface/payment.interface';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Controller({ path: 'payment', version: '1' })
export class PaymentController {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject('ORDER_CLIENT')
    private readonly orderRMQClient: ClientProxy,
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationRMQClient: ClientProxy,
  ) {}

  @MessagePattern('get-all-payment')
  async getAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.find();
  }

  @MessagePattern('process-payment')
  async handleProcessPayment(@Payload() orderData: IOrderForPayment) {
    try {
      console.log(
        '[Payment-Service]: Processing payment for order:',
        orderData.id,
      );

      // Calculate total amount correctly
      const totalAmount = orderData.amount * orderData.quantity;

      const payment = this.paymentRepository.create({
        orderId: orderData.id,
        email: orderData.email,
        amount: totalAmount, // Use calculated total amount
        status: 'pending',
      });

      const savedPayment = await this.paymentRepository.save(payment);
      console.log('[Payment-Service]: Payment record created:', savedPayment);

      setTimeout(() => {
        void (async () => {
          try {
            const transactionId = `txn_${Date.now()}`;

            await this.paymentRepository.update(savedPayment.id, {
              status: 'completed',
              transactionId,
            });

            console.log('[Payment-Service]: Payment completed successfully');

            const paymentCompletionData: IPaymentData = {
              orderId: orderData.id,
              paymentId: savedPayment.id,
              status: 'completed',
              transactionId,
              amount: savedPayment.amount,
            };

            this.orderRMQClient.emit(
              'payment-completed',
              paymentCompletionData,
            );

            // Pass the unit price (not total) to notification service
            this.notificationRMQClient.emit('payment-succeed', {
              ...orderData,
              paymentId: savedPayment.id,
              transactionId,
              amount: orderData.amount, // Pass unit price, not total
            });
          } catch (error) {
            console.error(
              '[Payment-Service]: Payment processing failed:',
              error,
            );

            void this.paymentRepository.update(savedPayment.id, {
              status: 'failed',
            });

            const failedPaymentData: IPaymentData = {
              orderId: orderData.id,
              paymentId: savedPayment.id,
              status: 'failed',
              amount: savedPayment.amount,
            };

            this.orderRMQClient.emit('payment-completed', failedPaymentData);
          }
        })();
      }, 2000);

      return { success: true, paymentId: savedPayment.id };
    } catch (error) {
      console.error('[Payment-Service]: Error in payment processing:', error);
      throw error;
    }
  }
}
