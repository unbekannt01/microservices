// payment-service/src/interface/payment.interface.ts
export interface IOrderForPayment {
  id: string;
  email: string;
  productName: string;
  quantity: number;
  amount: number; // Add this field
}

export interface IPaymentData {
  orderId: string;
  paymentId: string;
  status: 'completed' | 'failed';
  transactionId?: string;
  amount: number;
}
