import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserProfileDto } from 'src/dto/update-user-profile.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Post('orders/payment/:orderId')
  async initiateOrderPayment(
    @Req() request: Request,
    @Param('orderId') orderId: string,
  ) {
    const user = request.user as { id: string };
    return await this.userService.initiatePayment(orderId, user.id);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getUserProfile(@Req() request: Request) {
    const user = request.user as { id: string };
    return await this.userService.getUserProfile(user.id);
  }

  @Put('profile')
  async updateUserProfile(
    @Req() request: Request,
    @Body() updateDto: UpdateUserProfileDto,
  ) {
    const user = request.user as { id: string };
    return await this.userService.updateUserProfile(user.id, updateDto);
  }

  @UseGuards(AuthGuard)
  @Get('orders')
  async getUserOrders(
    @Req() request: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const user = request.user as { id: string };
    return await this.userService.getUserOrders(user.id, page, limit);
  }

  @UseGuards(AuthGuard)
  @Get('orders/:orderId')
  async getUserOrder(
    @Req() request: Request,
    @Param('orderId') orderId: string,
  ) {
    const user = request.user as { id: string; email: string };
    return await this.userService.getUserOrder(user.email, orderId);
  }

  @UseGuards(AuthGuard)
  @Put('orders/cancel/:orderId')
  async cancelOrder(
    @Req() request: Request,
    @Param('orderId') orderId: string,
  ) {
    const user = request.user as { id: string };
    return await this.userService.orderCancel(orderId, user.id);
  }
}
