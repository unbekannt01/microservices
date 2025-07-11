/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEmail()
  email: string;

  @IsString()
  productName: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  amount: number;

  @IsUUID()
  userId: string;
}
