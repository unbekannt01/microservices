import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(
    @Inject('ORDER_SERVICE_RABBITMQ')
    private readonly client: ClientProxy,
    private readonly appService: AppService,
  ) {}

  @Post('register')
  async register(@Body() createuserDto: CreateUserDto) {
    return await this.appService.registeruser(createuserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.appService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(AuthGuard)
  @Post('order')
  createOrder(@Body() order: CreateOrderDto, @Req() request: Request) {
    const user = request.user as { id: string };
    if (!user?.id) {
      throw new UnauthorizedException('Invalid User Session...!');
    }
    const orderWithId = {
      ...order,
      id: order.id || uuidv4(),
    };

    this.client.emit('order-created', orderWithId);
    console.log('Order Send to RabbitMQ', orderWithId);
    return { message: 'Order Send to RabbitMQ', order: orderWithId };
  }
}
