import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  IOrderNotification,
  IPaymentNotification,
} from './interface/notification.interface';
import { EmailService } from './services/email.service';

@Controller({ path: 'notification', version: '1' })
export class NotificationController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('order-created')
  sendOrderCreatedEmail(orderData: IOrderNotification) {
    console.log('[Notification-Service]: Sending Order Created Email');
    console.log('Order Details:', {
      orderId: orderData.id,
      customerEmail: orderData.email,
      product: orderData.productName,
      quantity: orderData.quantity,
      amount: `${(orderData.amount / 100).toFixed(2)}`,
    });

    // const unitPrice = orderData.amount;

    // await this.emailService.sendOrderConfirmationMail(
    //   orderData.email,
    //   orderData.id,
    //   [
    //     {
    //       name: orderData.productName,
    //       quantity: orderData.quantity,
    //       price: unitPrice,
    //     },
    //   ],
    // );
  }

  @MessagePattern('payment-succeed')
  sendPaymentSucceedEmail(paymentData: IPaymentNotification) {
    console.log(
      '[Notification-Service]: Sending Payment Success Email',
      paymentData,
    );

    // const unitPrice = paymentData.amount;

    // await this.emailService.sendPaymentSuccessMail(
    //   paymentData.email,
    //   paymentData.id,
    //   [
    //     {
    //       name: paymentData.productName,
    //       quantity: paymentData.quantity,
    //       price: unitPrice,
    //     },
    //   ],
    // );
  }
}
