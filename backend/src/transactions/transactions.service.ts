import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';
import { User } from 'src/users/schemas/user.schema';


@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // Method to create a new transaction
  async create(body: any) {
    const { userId, amount, type, category, date, description } = body;

    // Validate required fields
    if (!userId || !amount || !type || !category || !date) {
      throw new BadRequestException('userId, amount, type, category, and date are required');
    }

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be a positive value');
    }

    // Validate type
    if (type !== 'income' && type !== 'expense') {
      throw new BadRequestException('Type must be either "income" or "expense"');
    }

    // Validate and normalize date to match budget query format
    let transactionDate: Date;
    
    if (typeof date === 'string') {
      // Extract date parts from YYYY-MM-DD format
      let dateOnly = date;
      if (date.includes('T')) {
        dateOnly = date.split('T')[0];
      }
      
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        // Create date in LOCAL timezone at midnight (matches budget query format)
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

    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      amount,
      type,
      category,
      date: transactionDate,
      description,
    });

    try {
      const savedTransaction = await transaction.save();
      console.log('Transaction saved:', savedTransaction._id, 'for user:', userId);
      return savedTransaction;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw new InternalServerErrorException(`Error saving transaction: ${error.message}`);
    }
  }

  // Method to get user transactions
  async getUserTransactions(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid or missing userId');
    }

    try {
      const userExists = await this.userModel.findById(userId);
      if (!userExists) {
        throw new BadRequestException('User not found');
      }

      // Query with ObjectId to ensure proper matching
      const userIdObjectId = new Types.ObjectId(userId);
      console.log('Fetching transactions for userId:', userId, 'as ObjectId:', userIdObjectId);
      
      const transactions = await this.transactionModel
        .find({ userId: userIdObjectId })
        .sort({ date: -1 });

      console.log(`Found ${transactions.length} transactions for user ${userId}`);

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

      let totalIncome = 0;
      let totalExpense = 0;

      for (const t of transactions) {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else if (t.type === 'expense') {
          totalExpense += t.amount;
        }
      }

      const balance = totalIncome - totalExpense;

      console.log('Returning transactions:', {
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
      console.error('Error retrieving transactions:', error);
      throw new InternalServerErrorException('Error retrieving transactions');
    }
  }
}
