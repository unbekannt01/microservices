/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: parseInt(this.configService.getOrThrow<string>('SMTP_PORT'), 10),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmationMail(
    email: string,
    orderId: string,
    items: { name: string; quantity: number; price: number }[],
  ): Promise<void> {
    const itemListHtml = items
      .map((item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);
        const itemTotal = price * quantity;
        return `<li>${item.name} (x${quantity}) - ₹${isNaN(itemTotal) ? 0 : itemTotal}</li>`;
      })
      .join('');

    const calculatedTotal = items.reduce((sum, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      return sum + price * quantity;
    }, 0);

    const htmlContent = `
    <h3>Hi ${email},</h3>
    <p>Thank you for your order! Your order ID is <strong>${orderId}</strong>.</p>
    <p>Here’s what you ordered:</p>
    <ul>${itemListHtml}</ul>
    <p><strong>Total:</strong> ₹${calculatedTotal}</p>
    <p>We'll notify you when your items are shipped.</p>
    <br/>
    <p>Thanks,<br/>E-Commerce Team</p>
  `;

    const info = await this.transporter.sendMail({
      from: `"E-Commerce Store" <${this.configService.get('SMTP_USER')}>`,
      to: email,
      subject: 'Your Order Confirmation',
      html: htmlContent,
    });
    console.log('Order confirmation email sent: %s', info.messageId);
  }

  async sendPaymentSuccessMail(
    email: string,
    orderId: string,
    items: { name: string; quantity: number; price: number }[],
  ): Promise<void> {
    const itemListHtml = items
      .map((item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);
        const itemTotal = price * quantity;
        return `<li>${item.name} (x${quantity}) - ₹${isNaN(itemTotal) ? 0 : itemTotal}</li>`;
      })
      .join('');

    const calculatedTotal = items.reduce((sum, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      return sum + price * quantity;
    }, 0);

    const htmlContent = `
    <h3>Hi ${email},</h3>
      <p>Your payment for order ID <strong>${orderId}</strong> was successful!</p>
      <p>Here’s a summary of your order:</p>
      <ul>${itemListHtml}</ul>
      <p><strong>Total Amount Paid:</strong> ₹${calculatedTotal}</p>
      <p>Thank you for shopping with us!</p>
      <br/>
      <p>Best Regards,<br/>E-Commerce Team</p>
  `;

    const info = await this.transporter.sendMail({
      from: `"E-Commerce Store" <${this.configService.get('SMTP_USER')}>`,
      to: email,
      subject: 'Payment Successful for Your Order',
      html: htmlContent,
    });
    console.log('Payment success email sent: %s', info.messageId);
  }
}
