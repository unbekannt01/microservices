import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ type: 'integer', nullable: true })
  amount: number;

  @Column({ default: 'pending' })
  status: string; // pending, processing, completed, failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
