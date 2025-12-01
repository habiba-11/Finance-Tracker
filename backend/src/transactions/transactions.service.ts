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

    // ✅ Declarative validation for missing fields
    const required = ['userId', 'amount', 'type', 'category', 'date'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      throw new BadRequestException(`Missing fields: ${missing.join(', ')}`);
    }

    // ✅ Imperative validation for edge cases
    // 1. Invalid amount (negative value)
    if (amount <= 0) {
      throw new BadRequestException('Amount must be a positive value');
    }

    // 2. Invalid type (not "income" or "expense")
    const validTypes = ['income', 'expense'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('Type must be either "income" or "expense"');
    }

    // 3. Invalid date format (checking for a valid Date object)
    const isValidDate = !isNaN(new Date(date).getTime());
    if (!isValidDate) {
      throw new BadRequestException('Invalid date format');
    }

    // 4. Check for valid userId (must be a valid MongoDB ObjectId)
if (!userId || !Types.ObjectId.isValid(userId)) {
  throw new BadRequestException('Invalid or missing userId');
}

    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      amount,
      type,
      category,
      date,
      description,
    });

    // ✅ FR2: Add transaction to the database
    try {
      return await transaction.save();
    } catch (error) {
      throw new InternalServerErrorException('Error saving transaction');
    }
  }

  // Method to get user transactions

async getUserTransactions(userId: string) {
  // 1. Validate the userId (must be a valid MongoDB ObjectId)
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new BadRequestException('Invalid or missing userId');
  }

  try {
    // 2. Check if the user exists in the database
    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('User not found');
    }

    // 3. Retrieve transactions for the user
    const transactions = await this.transactionModel
      .find({ userId })
      .sort({ date: -1 }); // Sorting by most recent first

    // 4. If no transactions exist, return an empty list with a message
    if (transactions.length === 0) {
      return {
        transactions: [],
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        },
        message: 'No transactions found for this user', // Added message for clarity
      };
    }

    // 5. Imperative style (loop) for calculating totals
    let totalIncome = 0;
    let totalExpense = 0;

    // 6. Loop through transactions and calculate totals
    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      }
    }

    // 7. Calculate the balance
    const balance = totalIncome - totalExpense;

    // 8. Return the transactions and summary
    return {
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    };
  } catch (error) {
    // 9. Handle database or other server errors
    throw new InternalServerErrorException('Error retrieving transactions');
  }
}

}