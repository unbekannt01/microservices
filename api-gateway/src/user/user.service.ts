/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UpdateUserProfileDto } from 'src/dto/update-user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ORDER_SERVICE')
    private readonly orderClient: ClientProxy,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'createdAt',
        'updatedAt',
      ],
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

    const allowedUpdates = {
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
    };
    await this.userRepository.update(userId, allowedUpdates);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'updatedAt'],
    });

    return {
      user: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  async getUserOrders(id: string, page = 1, limit = 10) {
    try {
      const orders = await firstValueFrom(
        this.orderClient.send('get-orders-by-id', {
          id,
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

  async getUserOrder(email: string, orderId: string) {
    try {
      const orders = await firstValueFrom(
        this.orderClient.send('get-orders-by-email', { email }),
      );

      if (!orders || orders.length === 0) {
        throw new UnauthorizedException('No orders found for this user');
      }

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

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new Error('Unable to fetch order details');
    }
  }

  async orderCancel(orderId: string, userId: string) {
    const order = await firstValueFrom(
      this.orderClient.send('order-cancelled', { orderId, userId }),
    );

    if (order.success === false) {
      throw new BadRequestException(order.error);
    }

    return {
      message: 'Order cancelled successfully',
      data: order,
    };
  }
}
