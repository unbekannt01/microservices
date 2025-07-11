import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { IOrderData, IPaymentCompletedData } from './interface/order.interface';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderService } from './order.service';

@Controller({ path: 'order', version: '1' })
export class OrderController {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('PAYMENT_SERVICE')
    private readonly paymentRMQClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationRMQClient: ClientProxy,
    private readonly orderService: OrderService,
  ) {}

  @MessagePattern('get-all-orders')
  async handleGetAllOrders() {
    return await this.orderRepository.find();
  }

  @MessagePattern('get-orders-by-id')
  async handleGetOrdersById(payload: {
    id: string;
    page: number;
    limit: number;
  }) {
    const { id, page, limit } = payload;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId: id },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'productName', 'quantity', 'amount'],
    });

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  @MessagePattern('get-orders-by-email')
  async handleGetOrderByEmail(data: { email: string }) {
    const { email } = data;

    return await this.orderRepository.find({
      where: { email },
      select: ['id', 'email', 'productName', 'quantity', 'amount'],
    });
  }

  @MessagePattern('get-order-analytics')
  async handleGetAnalytics() {
    try {
      const analytics = await this.orderService.getOrderAnalytics();
      return analytics;
    } catch (error) {
      console.error('[Order-Service]: Error fetching analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @MessagePattern('get-payment-analytics')
  async handleGetAnalyticsOfPayment() {
    try {
      const analytics = await this.orderService.getOrderAnalytics();
      return analytics;
    } catch (error) {
      console.error('[Order-Service]: Error fetching analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @MessagePattern('order-created')
  async handleOrderCreated(@Payload() orderData: IOrderData) {
    try {
      console.log('[Order-Service]: Received order data:', orderData);

      const amount = Number(orderData.amount);
      const quantity = Number(orderData.quantity);
      const total = amount * quantity;

      if (isNaN(amount) || isNaN(quantity) || isNaN(total)) {
        throw new Error(
          `[Order-Service]: Invalid numeric values. amount=${amount}, quantity=${quantity}, total=${total}`,
        );
      }

      // Include userId
      const order = this.orderRepository.create({
        email: orderData.email,
        productName: orderData.productName,
        quantity,
        amount,
        status: 'pending',
        userId: orderData.userId,
      });

      const savedOrder = await this.orderRepository.save(order);
      console.log('[Order-Service]: Order saved:', savedOrder);

      await this.orderRepository.update(savedOrder.id, {
        status: 'processing',
      });

      this.paymentRMQClient.emit('process-payment', savedOrder);

      this.notificationRMQClient.emit('order-created', {
        id: savedOrder.id,
        email: savedOrder.email,
        productName: savedOrder.productName,
        quantity: savedOrder.quantity,
        amount: savedOrder.amount,
      });

      return { success: true, orderId: savedOrder.id };
    } catch (error) {
      console.error('[Order-Service]: Error creating order:', error);
      if (orderData.id) {
        await this.orderRepository.update(orderData.id, { status: 'failed' });
      }
      throw error;
    }
  }

  @MessagePattern('order-cancelled')
  async handleOrderCancelled(data: { orderId: string; userId: string }) {
    try {
      const { orderId, userId } = data;
      console.log('[Order-Service]: Received order data:', data);

      const order = await this.orderRepository.findOne({
        where: { userId: userId, id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === 'completed') {
        throw new BadRequestException(
          'Order already completed and cannot be cancelled',
        );
      }

      if (order.status === 'cancelled') {
        throw new BadRequestException('Order is already cancelled');
      }

      await this.orderRepository.update(orderId, {
        status: 'cancelled',
      });

      return { success: true, order };
    } catch (error) {
      console.error('[Order-Service]: Error cancelling order:', error);
      throw error;
    }
  }

  @MessagePattern('payment-completed')
  async handlePaymentCompleted(@Payload() paymentData: IPaymentCompletedData) {
    try {
      console.log(
        '[Order-Service]: Payment completed for order:',
        paymentData.orderId,
      );

      const newStatus =
        paymentData.status === 'completed' ? 'completed' : 'payment_failed';

      await this.orderRepository.update(paymentData.orderId, {
        status: newStatus,
      });
      console.log(`[Order-Service]: Order status updated to ${newStatus}`);

      return { success: true };
    } catch (error) {
      console.error('[Order-Service]: Error updating order status:', error);
      throw error;
    }
  }

  @Get('status/:id')
  async getOrderStatus(@Param('id') orderId: string) {
    return await this.orderService.getOrderById(orderId);
  }
}
