declare module "@paystack/inline-js" {
  export type PaystackTransactionResponse = {
    reference?: string;
    trxref?: string;
    status?: string;
    message?: string;
    redirecturl?: string;
  };

  export type PaystackCheckoutOptions = {
    accessCode: string;
    onSuccess?: (response: PaystackTransactionResponse) => void;
    onCancel?: () => void;
    onLoad?: (response: { id?: number; accessCode?: string }) => void;
    onError?: (error: { message?: string }) => void;
    onBankTransferConfirmationPending?: (response?: PaystackTransactionResponse) => void;
  };

  export default class PaystackPop {
    newTransaction(options: PaystackCheckoutOptions): void;
    resumeTransaction(accessCode: string, options?: Omit<PaystackCheckoutOptions, "accessCode">): void;
  }
}
