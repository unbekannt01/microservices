/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserProfileDto } from 'src/dto/update-user-profile.dto';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getUserProfile(request: Request) {
    const user = request.user as { id: string };
    return await this.userService.getUserProfile(user.id);
  }

  @Put('profile')
  async updateUserProfile(
    request: Request,
    @Body() updateDto: UpdateUserProfileDto,
  ) {
    const user = request.user as { id: string };
    return await this.userService.updateUserProfile(user.id, updateDto);
  }

  @Get('orders')
  async getUserOrders(
    request: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const user = request.user as { id: string; email: string };
    return await this.userService.getUserOrders(user.email, page, limit);
  }

  @Get('orders/:orderId')
  async getUserOrder(request: Request, @Param('orderId') orderId: string) {
    const user = request.user as { id: string; email: string };
    return await this.userService.getUserOrder(user.email, orderId);
  }

  @Put('orders/:orderId/cancel')
  async cancelOrder(request: Request, @Param('orderId') orderId: string) {
    const user = request.user as { id: string; email: string };
    return await this.userService.cancelOrder(user.email, orderId);
  }
}
