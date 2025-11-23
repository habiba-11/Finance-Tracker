import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>,

    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(body: any) {
    const { userId, month, year, amount } = body;

    // Simple validation
    if (!userId || !month || !year || amount == null) {
      throw new Error('userId, month, year, amount are required');
    }

    const budget = new this.budgetModel({
      userId,
      month,
      year,
      amount,
    });

    // ✅ FR4: set budget
    return budget.save();
  }

  // getBudget() will be implemented by Member 6
}
