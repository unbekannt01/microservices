// Create interfaces folder in order-service
export interface IOrderData {
  id: string;
  email: string;
  productName: string;
  quantity: number;
  amount: number;
  userId: string;
  userEmail: string;
}

export interface IPaymentCompletedData {
  orderId: string;
  paymentId: string;
  status: 'completed' | 'failed';
  transactionId?: string;
}

export interface IOrderWithStatus extends IOrderData {
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
