import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UseRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constants';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async registeruser(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (user) throw new ConflictException('User Already Registered...!');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UseRole.USER,
    });

    await this.userRepository.save(newUser);
    return { message: 'User Registered Successfully...!' };
  }

  async login(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);

    user.loginStatus = true;
    const payload = { id: user.id, email: user.email };
    await this.userRepository.save(user);

    return {
      message: 'User Login Successfully...!',
      token: this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: '1h',
      }),
    };
  }
}
