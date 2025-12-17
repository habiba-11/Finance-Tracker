import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';

// ============================================
// STRATEGY PATTERN: Transaction Processing Strategies
// ============================================
// Strategy interface for transaction processing
interface TransactionProcessingStrategy {
  process(amount: number): number;
  getCategory(): string;
  validate(amount: number): boolean;
}

// Income Strategy
class IncomeStrategy implements TransactionProcessingStrategy {
  process(amount: number): number {
    return amount; // Income adds to balance
  }

  getCategory(): string {
    return 'My Savings';
  }

  validate(amount: number): boolean {
    return amount > 0;
  }
}

// Expense Strategy
class ExpenseStrategy implements TransactionProcessingStrategy {
  process(amount: number): number {
    return -amount; // Expense subtracts from balance
  }

  getCategory(): string {
    return ''; // Category must be provided for expenses
  }

  validate(amount: number): boolean {
    return amount > 0;
  }
}

// Strategy Factory
class TransactionStrategyFactory {
  static getStrategy(type: TransactionType): TransactionProcessingStrategy {
    switch (type) {
      case TransactionType.INCOME:
        return new IncomeStrategy();
      case TransactionType.EXPENSE:
        return new ExpenseStrategy();
      default:
        throw new BadRequestException(`Invalid transaction type: ${type}`);
    }
  }
}

// ============================================
// REPOSITORY PATTERN: Data Access Abstraction
// ============================================
// Repository interface for transactions
interface ITransactionRepository {
  create(transactionData: any): Promise<TransactionDocument>;
  findByUserId(userId: string): Promise<TransactionDocument[]>;
  findById(id: string): Promise<TransactionDocument | null>;
}

// Mongoose implementation of Transaction Repository
class TransactionRepository implements ITransactionRepository {
  constructor(private readonly transactionModel: Model<TransactionDocument>) {}

  async create(transactionData: any): Promise<TransactionDocument> {
    const transaction = new this.transactionModel(transactionData);
    return transaction.save();
  }

  async findByUserId(userId: string): Promise<TransactionDocument[]> {
    const userIdObjectId = new Types.ObjectId(userId);
    return this.transactionModel
      .find({ userId: userIdObjectId })
      .sort({ date: -1 })
      .exec();
  }

  async findById(id: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findById(id).exec();
  }
}

@Injectable()
export class TransactionsService {
  private transactionRepository: ITransactionRepository;
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    // Initialize repository
    this.transactionRepository = new TransactionRepository(this.transactionModel);
  }

  // Method to create a new transaction using Strategy Pattern
  async create(createTransactionDto: CreateTransactionDto) {
    const { userId, amount, type, category, date, description } = createTransactionDto;

    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    // Check if user exists
    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Use Strategy Pattern to get appropriate strategy
    const strategy = TransactionStrategyFactory.getStrategy(type);

    // Validate amount using strategy
    if (!strategy.validate(amount)) {
      throw new BadRequestException('Amount must be a positive value');
    }

    // Get category from strategy if not provided
    const finalCategory = category || strategy.getCategory();
    if (!finalCategory && type === TransactionType.EXPENSE) {
      throw new BadRequestException('Category is required for expenses');
    }

    // Validate and normalize date to match budget query format
    let transactionDate: Date;
    
    if (typeof date === 'string') {
      let dateOnly = date;
      if (date.includes('T')) {
        dateOnly = date.split('T')[0];
      }
      
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        transactionDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      } else {
        transactionDate = new Date(date);
      }
    } else {
      transactionDate = new Date(date);
      transactionDate.setHours(0, 0, 0, 0);
    }
    
    if (isNaN(transactionDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Use Repository Pattern to create transaction
    try {
      const transactionData = {
        userId: new Types.ObjectId(userId),
        amount,
        type,
        category: finalCategory,
        date: transactionDate,
        description,
      };

      const savedTransaction = await this.transactionRepository.create(transactionData);
      this.logger.log(`Transaction saved: ${savedTransaction._id} for user: ${userId}`);
      return savedTransaction;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error saving transaction: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error saving transaction: ${error.message}`);
    }
  }

  // Method to get user transactions using Repository Pattern and Strategy Pattern
  async getUserTransactions(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid or missing userId');
    }

    try {
      const userExists = await this.userModel.findById(userId);
      if (!userExists) {
        throw new BadRequestException('User not found');
      }

      // Use Repository Pattern to fetch transactions
      const transactions = await this.transactionRepository.findByUserId(userId);
      this.logger.log(`Found ${transactions.length} transactions for user ${userId}`);

      if (transactions.length === 0) {
        return {
          transactions: [],
          summary: {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
          },
        };
      }

      // Use Strategy Pattern to calculate totals
      const incomeStrategy = TransactionStrategyFactory.getStrategy(TransactionType.INCOME);
      const expenseStrategy = TransactionStrategyFactory.getStrategy(TransactionType.EXPENSE);

      let totalIncome = 0;
      let totalExpense = 0;

      for (const t of transactions) {
        if (t.type === TransactionType.INCOME) {
          totalIncome += incomeStrategy.process(t.amount);
        } else if (t.type === TransactionType.EXPENSE) {
          totalExpense += Math.abs(expenseStrategy.process(t.amount));
        }
      }

      const balance = totalIncome - totalExpense;

      this.logger.log('Returning transactions:', {
        count: transactions.length,
        totalIncome,
        totalExpense,
        balance
      });

      return {
        transactions,
        summary: {
          totalIncome,
          totalExpense,
          balance,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error retrieving transactions: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error retrieving transactions');
    }
  }
}
