/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';

import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/entities/user.entity';

interface AdminOrderFilters {
  page: number;
  limit: number;
  status?: string;
  email?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ORDER_SERVICE')
    private readonly orderClient: ClientProxy,
    @Inject('PAYMENT_SERVICE')
    private readonly paymentClient: ClientProxy,
  ) {}

  async getAllOrders(filters: AdminOrderFilters) {
    try {
      const result = await firstValueFrom(
        this.orderClient.send('get-all-orders', filters),
      );

      return {
        ...result,
        message: 'Orders retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error('Unable to fetch orders');
    }
  }

  async getOrderById(orderId: string) {
    try {
      const order = await firstValueFrom(
        this.orderClient.send('get-order-by-id', orderId),
      );

      return {
        order,
        message: 'Order retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw new Error('Order not found');
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const result = await firstValueFrom(
        this.orderClient.send('update-order-status', {
          orderId,
          status,
        }),
      );

      return {
        ...result,
        message: 'Order status updated successfully',
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Unable to update order status');
    }
  }

  async getAnalytics() {
    try {
      const [orderAnalytics, paymentAnalytics, userStats] = await Promise.all([
        firstValueFrom(this.orderClient.send('get-order-analytics', {})),
        firstValueFrom(this.paymentClient.send('get-payment-analytics', {})),
        this.getUserStats(),
      ]);

      return {
        orders: orderAnalytics,
        payments: paymentAnalytics,
        users: userStats,
        message: 'Analytics retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Unable to fetch analytics');
    }
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'loginStatus',
        'createdAt',
      ],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Users retrieved successfully',
    };
  }

  // async getRevenueAnalytics(period: string) {
  //   try {
  //     const result = await firstValueFrom(
  //       this.paymentClient.send('get-revenue-analytics', { period }),
  //     );

  //     return {
  //       ...result,
  //       message: 'Revenue analytics retrieved successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error fetching revenue analytics:', error);
  //     throw new Error('Unable to fetch revenue analytics');
  //   }
  // }

  private async getUserStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { loginStatus: true },
    });
    const adminUsers = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
    };
  }
}
