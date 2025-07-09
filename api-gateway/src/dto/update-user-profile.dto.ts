import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;
}
