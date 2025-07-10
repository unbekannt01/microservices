/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Put,
  Body,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { UpdateOrderStatusDto } from 'src/dto/update-order-status.dto';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  async getAllOrders(page = 1, limit = 20, status?: string, email?: string) {
    return await this.adminService.getAllOrders({ page, limit, status, email });
  }

  @Get('orders/:orderId')
  async getOrderById(@Param('orderId') orderId: string) {
    return await this.adminService.getOrderById(orderId);
  }

  @Put('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return await this.adminService.updateOrderStatus(orderId, updateDto.status);
  }

  @Get('analytics')
  async getAnalytics() {
    return await this.adminService.getAnalytics();
  }

  @Get('users')
  async getAllUsers(page = 1, limit = 20) {
    return await this.adminService.getAllUsers(page, limit);
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query('period') period = 'month') {
    return await this.adminService.getRevenueAnalytics(period);
  }

  @Get('test')
  @UseGuards(AuthGuard)
  getTest(@Req() req: Request) {
    console.log('User in request:', req['user']);
    return req['user'];
  }
}
