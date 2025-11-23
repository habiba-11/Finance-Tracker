import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';
import { Model } from 'mongoose';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(body: any) {
    const { userId, amount, type, category, date, description } = body;

    // ✅ Declarative validation
    const required = ['userId', 'amount', 'type', 'category', 'date'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      throw new BadRequestException(
       ` Missing fields: ${missing.join(', ')}`,
      );
    }

    const transaction = new this.transactionModel({
      userId,
      amount,
      type,
      category,
      date,
      description,
    });

    // ✅ FR2: add transaction
    return transaction.save();
  }

  // getUserTransactions() will be implemented by Member 4
}