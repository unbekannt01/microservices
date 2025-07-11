/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
  Inject,
  Body,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { firstValueFrom } from 'rxjs';

export class CreateOrderRequestDto {
  id: string;
  email: string;
  productName: string;
  quantity: number;
  amount: number;
}

export interface IOrder {
  id: string;
  email: string;
  productName: string;
  quantity: number;
  amount: number;
  userId: string;
}

@Controller({ path: 'app', version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('ORDER_SERVICE') private readonly client: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentclient: ClientProxy,
  ) {}

  @Post('register')
  async register(@Body() createuserDto: CreateUserDto) {
    return await this.appService.registeruser(createuserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.appService.login(loginDto.email, loginDto.password);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(AuthGuard)
  @Post('order')
  async createOrder(
    @Body() order: CreateOrderRequestDto,
    @Req() request: Request,
  ) {
    const user = request.user as { id: string };
    if (!user?.id) {
      throw new UnauthorizedException('Invalid User Session...!');
    }

    const orderData: IOrder = {
      id: order.id,
      email: order.email,
      productName: order.productName,
      quantity: order.quantity,
      amount: order.amount,
      userId: user.id,
    };

    const result = await firstValueFrom(
      this.client.send('order-created', orderData),
    );

    return {
      message: 'Order created successfully',
      data: result,
    };
  }

  @Get()
  getAllPaymets() {
    return this.paymentclient.send('get-all-payment', {});
  }
}
