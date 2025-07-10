import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getOrderById(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found...!');
    else return order;
  }

  async getOrderAnalytics() {
    const totalOrders = await this.orderRepository.count();

    const pendingOrders = await this.orderRepository.count({
      where: { status: 'pending' },
    });

    const completedOrders = await this.orderRepository.count({
      where: { status: 'completed' },
    });

    const completedOrderList = await this.orderRepository.find({
      where: { status: 'completed' },
      select: ['amount'],
    });

    const totalRevenue = completedOrderList.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
    };
  }
}
