export interface Order {
  order_no: string;
  created_at: string;
  user_address: string;
  amount: number;
  credits: number;
  network: string;
  transaction_hash: string;
  order_status: number;
  expired_at: string | null;
  paied_at?: string;
  plan: string;
  token_address: string;
  token_decimals: number;
}
