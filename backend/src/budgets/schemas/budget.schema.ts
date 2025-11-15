import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 12 })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, min: 0 })
  amount: number; // total budget for that month
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
