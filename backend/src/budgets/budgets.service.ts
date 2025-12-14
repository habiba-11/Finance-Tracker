import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget } from './schemas/budget.schema';  
import { Transaction } from 'src/transactions/schemas/transaction.schema'; 
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private readonly budgetModel: Model<Budget>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // Method to create a new budget
  async create(body: any) {
    const { userId, month, year, amount } = body;

    if (!userId || !month || !year || amount == null) {
      throw new BadRequestException('userId, month, year, amount are required');
    }

    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid userId');
    }

    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    if (year < 0) {
      throw new BadRequestException('Year cannot be negative');
    }

    if (amount < 0) {
      throw new BadRequestException('Amount cannot be negative');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new BadRequestException('Cannot set budget for past months');
    }

    const existingBudget = await this.budgetModel.findOne({ userId, month, year });
    if (existingBudget) {
      throw new BadRequestException('Budget already set for this month');
    }

    const budget = new this.budgetModel({
      userId,
      month,
      year,
      amount,
    });

    return budget.save();
  }

  // Method to get the budget details for a user, month, and year
  async getBudget(userId: string, month: number, year: number) {
    if (!userId || !month || !year) {
      throw new BadRequestException('userId, month, and year are required');
    }

    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid userId');
    }

    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    if (year < 0) {
      throw new BadRequestException('Year cannot be negative');
    }

    const budget = await this.budgetModel.findOne({ userId, month, year });

    if (!budget) {
      return { message: 'No budget set for this month' };
    }

    // Date range for the given month and year
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    // Find all expenses within this month - use ObjectId for userId matching
    const userIdObjectId = new Types.ObjectId(userId);
    const expenses = await this.transactionModel.find({
      userId: userIdObjectId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });
    
    console.log(`Found ${expenses.length} expenses for budget month ${month}/${year}`);

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

  // Method to get all budgets for a user
  async getAllBudgets(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid userId');
    }

    const budgets = await this.budgetModel.find({ userId }).sort({ year: -1, month: -1 });

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const start = new Date(budget.year, budget.month - 1, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(budget.year, budget.month, 0);
        end.setHours(23, 59, 59, 999);

        const userIdObjectId = new Types.ObjectId(userId);
        const expenses = await this.transactionModel.find({
          userId: userIdObjectId,
          type: 'expense',
          date: { $gte: start, $lte: end },
        });

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
      })
    );

    return { budgets: budgetsWithSpending };
  }
}