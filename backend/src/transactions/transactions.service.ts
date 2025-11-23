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

  async getUserTransactions(userId: string) {
    const transactions = await this.transactionModel
      .find({ userId })
      .sort({ date: -1 });

    // ✅ Imperative style (loop) – MS2 requirement
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') totalExpense += t.amount;
    }

    const balance = totalIncome - totalExpense;

    return {
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    };
  }
}