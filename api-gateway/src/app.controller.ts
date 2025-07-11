import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

export class CreateOrderRequestDto {
  id?: string;
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

  @Throttle({ default: { ttl: 60000, limit: 1 } })
  @UseGuards(AuthGuard)
  @Post('order')
  createOrder(@Body() order: CreateOrderRequestDto, @Req() request: Request) {
    const user = request.user as { id: string };
    if (!user?.id) {
      throw new UnauthorizedException('Invalid User Session...!');
    }

    const orderData: IOrder = {
      id: order.id || uuidv4(),
      email: order.email,
      productName: order.productName,
      quantity: order.quantity,
      amount: order.amount,
      userId: user.id,
    };

    this.client.emit('order-created', orderData);
    console.log('Order Send to RabbitMQ', orderData);
    return { message: 'Order Send to RabbitMQ', order: orderData };
  }

  @Get()
  getAllPaymets() {
    return this.paymentclient.send('get-all-payment', {});
  }
}
