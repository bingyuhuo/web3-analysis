// 积分消费类型
export type CreditConsumptionType = 'view' | 'generate';

// 积分消费记录接口
export interface CreditConsumption {
  user_address: string;
  amount: number;
  type: CreditConsumptionType;
  report_id?: number;
  created_at: string;
}

// 积分消费记录（数据库返回）
export interface CreditConsumptionRecord extends CreditConsumption {
  id: number;
} 