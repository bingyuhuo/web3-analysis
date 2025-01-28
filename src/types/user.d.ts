export interface User {
  id?: number;
  user_address: string;
  nickname: string;
  avatar_url: string;
  created_at?: string;
}

export interface UserCredits {
  one_time_credits: number;
  monthly_credits: number;
  total_credits: number;
  used_credits: number;
  left_credits: number;
  expires_at: string | null;
  days_until_expiry: number;
}
