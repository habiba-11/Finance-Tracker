import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';


@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>,

       @InjectModel(Transaction.name)
  private transactionModel: Model<TransactionDocument>,   // <-- Missing

  private transactionsService: TransactionsService,
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

  async getBudget(userId: string, month: number, year: number) {
    const budget = await this.budgetModel.findOne({ userId, month, year });

    if (!budget) {
      return { message: 'No budget set for this month' };
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const expenses = await this.transactionModel.find({
      userId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    // ✅ Declarative style – reduce (MS2 requirement)
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

    const remaining = budget.amount - totalSpent;
    const percentage = budget.amount > 0
      ? (totalSpent / budget.amount) * 100
      : 0;

    return {
      budget,
      totalSpent,
      remaining,
      percentage: Number(percentage.toFixed(2)),
    };
  }
}
