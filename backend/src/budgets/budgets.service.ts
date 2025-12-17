import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';  
import { Transaction, TransactionDocument } from 'src/transactions/schemas/transaction.schema'; 
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';

// ============================================
// STRATEGY PATTERN: Budget Calculation Strategies
// ============================================
// Strategy interface for budget calculations
interface BudgetCalculationStrategy {
  calculateRemaining(budgetAmount: number, totalSpent: number): number;
  calculatePercentage(budgetAmount: number, totalSpent: number): number;
  getStatus(percentage: number): string;
}

// Standard Budget Calculation Strategy
class StandardBudgetStrategy implements BudgetCalculationStrategy {
  calculateRemaining(budgetAmount: number, totalSpent: number): number {
    return budgetAmount - totalSpent;
  }

  calculatePercentage(budgetAmount: number, totalSpent: number): number {
    if (budgetAmount <= 0) return 0;
    return (totalSpent / budgetAmount) * 100;
  }

  getStatus(percentage: number): string {
    if (percentage >= 100) return 'over_budget';
    if (percentage >= 90) return 'warning';
    if (percentage >= 70) return 'caution';
    return 'on_track';
  }
}

// ============================================
// REPOSITORY PATTERN: Budget Data Access
// ============================================
// Repository interface for budgets
interface IBudgetRepository {
  create(budgetData: any): Promise<BudgetDocument>;
  findByUserIdAndMonth(userId: string, month: number, year: number): Promise<BudgetDocument | null>;
  findByUserId(userId: string): Promise<BudgetDocument[]>;
  findOne(query: any): Promise<BudgetDocument | null>;
}

// Mongoose implementation of Budget Repository
class BudgetRepository implements IBudgetRepository {
  constructor(private readonly budgetModel: Model<BudgetDocument>) {}

  async create(budgetData: any): Promise<BudgetDocument> {
    const budget = new this.budgetModel(budgetData);
    return budget.save();
  }

  async findByUserIdAndMonth(userId: string, month: number, year: number): Promise<BudgetDocument | null> {
    // Convert userId to ObjectId for proper matching
    const userIdObjectId = new Types.ObjectId(userId);
    return this.budgetModel.findOne({ userId: userIdObjectId, month, year }).exec();
  }

  async findByUserId(userId: string): Promise<BudgetDocument[]> {
    // Convert userId to ObjectId for proper matching
    const userIdObjectId = new Types.ObjectId(userId);
    return this.budgetModel.find({ userId: userIdObjectId }).sort({ year: -1, month: -1 }).exec();
  }

  async findOne(query: any): Promise<BudgetDocument | null> {
    return this.budgetModel.findOne(query).exec();
  }
}

@Injectable()
export class BudgetsService {
  private budgetRepository: IBudgetRepository;
  private calculationStrategy: BudgetCalculationStrategy;
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    @InjectModel(Budget.name) private readonly budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    // Initialize repository and strategy
    this.budgetRepository = new BudgetRepository(this.budgetModel);
    this.calculationStrategy = new StandardBudgetStrategy();
  }

  // Method to create a new budget using Repository Pattern
  async create(createBudgetDto: CreateBudgetDto) {
    const { userId, month, year, amount } = createBudgetDto;

    // Validate required fields
    if (!userId || month === undefined || month === null || year === undefined || year === null || amount === undefined || amount === null) {
      throw new BadRequestException('userId, month, year, amount are required');
    }

    // Validate month range
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    // Validate year
    if (year < 0) {
      throw new BadRequestException('Year cannot be negative');
    }

    // Validate amount
    if (amount < 0) {
      throw new BadRequestException('Amount cannot be negative');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid userId');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new BadRequestException('Cannot set budget for past months');
    }

    // Use Repository Pattern to check for existing budget
    const existingBudget = await this.budgetRepository.findByUserIdAndMonth(userId, month, year);
    if (existingBudget) {
      throw new ConflictException('Budget already set for this month');
    }

    // Use Repository Pattern to create budget
    const budgetData = {
      userId: new Types.ObjectId(userId),
      month,
      year,
      amount,
    };

    const savedBudget = await this.budgetRepository.create(budgetData);
    this.logger.log(`Budget created successfully: ${savedBudget._id} for user: ${userId} month: ${month} year: ${year}`);
    return savedBudget;
  }

  // Method to get the budget details using Repository and Strategy Patterns
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

    // Use Repository Pattern to find budget
    const budget = await this.budgetRepository.findByUserIdAndMonth(userId, month, year);

    if (!budget) {
      return { message: 'No budget set for this month' };
    }

    // Date range for the given month and year
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    // Find all expenses within this month
    const userIdObjectId = new Types.ObjectId(userId);
    const expenses = await this.transactionModel.find({
      userId: userIdObjectId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });
    
    this.logger.log(`Found ${expenses.length} expenses for budget month ${month}/${year}`);

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Use Strategy Pattern to calculate remaining and percentage
    const remaining = this.calculationStrategy.calculateRemaining(budget.amount, totalSpent);
    const percentage = this.calculationStrategy.calculatePercentage(budget.amount, totalSpent);
    const status = this.calculationStrategy.getStatus(percentage);

    return {
      budget,
      totalSpent,
      remaining,
      percentage: Number(percentage.toFixed(2)),
      status,
    };
  }

  // Method to get all budgets using Repository and Strategy Patterns
  async getAllBudgets(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid userId');
    }

    // Use Repository Pattern to find all budgets
    const budgets = await this.budgetRepository.findByUserId(userId);

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
        
        // Use Strategy Pattern to calculate values
        const remaining = this.calculationStrategy.calculateRemaining(budget.amount, totalSpent);
        const percentage = this.calculationStrategy.calculatePercentage(budget.amount, totalSpent);
        const status = this.calculationStrategy.getStatus(percentage);

        return {
          budget,
          totalSpent,
          remaining,
          percentage: Number(percentage.toFixed(2)),
          status,
        };
      })
    );

    return { budgets: budgetsWithSpending };
  }
}