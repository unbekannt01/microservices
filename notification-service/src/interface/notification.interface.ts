// Create interfaces folder in notification-service
export interface IOrderNotification {
  id: string;
  email: string;
  productName: string;
  quantity: number;
  amount: number;
  unitPrice: number;
  totalAmount: number;
}

export interface IPaymentNotification extends IOrderNotification {
  paymentId: string;
  transactionId?: string;
  amount: number;
}
