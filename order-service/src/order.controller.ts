import { Controller, Get, Param } from '@nestjs/common';
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

  @MessagePattern('get-order-by-id')
  async handleGetOrderById(id: string) {
    return await this.orderRepository.findOne({
      where: { id: id },
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

      // Defensive checks
      if (isNaN(amount) || isNaN(quantity) || isNaN(total)) {
        throw new Error(
          `[Order-Service]: Invalid numeric values. amount=${amount}, quantity=${quantity}, total=${total}`,
        );
      }

      const order = this.orderRepository.create({
        email: orderData.email,
        productName: orderData.productName,
        quantity,
        amount,
        status: 'pending',
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
