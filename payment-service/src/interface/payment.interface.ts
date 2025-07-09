// Create interfaces folder in payment-service
export interface IOrderForPayment {
  id: string;
  email: string;
  productName: string;
  quantity: number;
}

export interface IPaymentData {
  orderId: string;
  paymentId: string;
  status: 'completed' | 'failed';
  transactionId?: string;
  amount: number;
}
