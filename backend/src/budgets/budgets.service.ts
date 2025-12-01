import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

    // ✅ Validations for missing fields and invalid values
    if (!userId || !month || !year || amount == null) {
      throw new BadRequestException('userId, month, year, amount are required');
    }

    // Validate if the userId exists in the User collection
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

    // ✅ Current Date Validation: Prevent budgets for past months
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-11, so we add 1
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

    // ✅ FR4: Set budget
    return budget.save();
  }

  // Method to get the budget details for a user, month, and year
  async getBudget(userId: string, month: number, year: number) {
    // Validate input
    if (!userId || !month || !year) {
      throw new BadRequestException('userId, month, and year are required');
    }

    // Validate if the userId exists in the User collection
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

    // If no budget is set for this month, return a message
    if (!budget) {
      return { message: 'No budget set for this month' };
    }

    // Date range for the given month and year
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    // Find all expenses within this month
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
