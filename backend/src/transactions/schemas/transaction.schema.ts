import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;
export type TransactionType = 'income' | 'expense';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['income', 'expense'] })
  type: TransactionType;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  description?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
