import { UserRole } from 'src/entities/user.entity';

export class JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}
