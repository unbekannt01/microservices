/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { firstValueFrom } from 'rxjs';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ORDER_CLIENT')
    private readonly orderClient: ClientProxy,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
      message: 'Profile retrieved successfully',
    };
  }

  async updateUserProfile(userId: string, updateDto: UpdateUserProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update only allowed fields
    const allowedUpdates = { name: updateDto.name };
    await this.userRepository.update(userId, allowedUpdates);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'updatedAt'],
    });

    return {
      user: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  async getUserOrders(userEmail: string, page = 1, limit = 10) {
    try {
      const orders = await firstValueFrom(
        this.orderClient.send('get-orders-by-email', {
          email: userEmail,
          page,
          limit,
        }),
      );

      return {
        orders,
        pagination: {
          page,
          limit,
        },
        message: 'Orders retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Unable to fetch orders');
    }
  }

  async getUserOrder(userEmail: string, orderId: string) {
    try {
      // Get user's orders first
      const orders = await firstValueFrom(
        this.orderClient.send('get-orders-by-email', { email: userEmail }),
      );

      const order = orders.find((o: any) => o.id === orderId);

      if (!order) {
        throw new UnauthorizedException('Order not found or access denied');
      }

      return {
        order,
        message: 'Order retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Unable to fetch order details');
    }
  }

  async cancelOrder(userEmail: string, orderId: string) {
    try {
      // First verify the order belongs to the user
      const order = await this.getUserOrder(userEmail, orderId);

      if (order.order.status === 'completed') {
        throw new Error('Cannot cancel completed order');
      }

      if (order.order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      // Send cancellation request to order service
      const result = await firstValueFrom(
        this.orderClient.send('cancel-order', {
          orderId,
          userEmail,
        }),
      );

      return {
        ...result,
        message: 'Order cancellation initiated',
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Unable to cancel order');
    }
  }
}
