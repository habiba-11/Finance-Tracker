import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { User } from '../users/schemas/user.schema';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionModel: Model<Transaction>;
  let userModel: Model<User>;

  const mockTransactionModel = function(transactionData?: any) {
    return {
      ...mockTransaction,
      ...transactionData,
      save: jest.fn().mockResolvedValue(mockTransaction),
    };
  } as any;

  mockTransactionModel.find = jest.fn();
  mockTransactionModel.findById = jest.fn();
  mockTransactionModel.findOne = jest.fn();
  mockTransactionModel.create = jest.fn();

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockTransaction = {
    _id: '507f1f77bcf86cd799439012',
    userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
    amount: 100,
    type: TransactionType.EXPENSE,
    category: 'Food',
    date: new Date('2024-12-14'),
    description: 'Test transaction',
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionModel = module.get<Model<Transaction>>(getModelToken(Transaction.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));

    jest.clearAllMocks();
    
    // Set up default mock for userModel.findById to return a user
    // This allows tests to focus on their specific validation without user existence check failing first
    (mockUserModel.findById as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('create', () => {
    const validDto: CreateTransactionDto = {
      userId: '507f1f77bcf86cd799439011',
      amount: 100,
      type: TransactionType.EXPENSE,
      category: 'Food',
      date: '2024-12-14',
      description: 'Test transaction',
    };

    it('should throw BadRequestException when userId is missing', async () => {
      const dto = { ...validDto, userId: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount is missing', async () => {
      const dto = { ...validDto, amount: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when type is missing', async () => {
      const dto = { ...validDto, type: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when date is missing', async () => {
      const dto = { ...validDto, date: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount is negative', async () => {
      const dto = { ...validDto, amount: -10 };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when type is invalid', async () => {
      const dto = { ...validDto, type: 'invalid' as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when date format is invalid', async () => {
      const dto = { ...validDto, date: 'invalid-date' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Invalid date format');
    });

    it('should throw BadRequestException when userId format is invalid', async () => {
      const dto = { ...validDto, userId: 'invalid-id' };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Invalid userId');
    });

    it('should throw NotFoundException when user is not found', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(validDto)).rejects.toThrow('User not found');
      expect(mockUserModel.findById).toHaveBeenCalledWith(validDto.userId);
      
      // Reset to default for other tests
      (mockUserModel.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should throw BadRequestException when category is missing for expense', async () => {
      const dto: CreateTransactionDto = { ...validDto, type: TransactionType.EXPENSE, category: '' };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Category is required for expenses');
    });

    it('should successfully create a transaction', async () => {
      const result = await service.create(validDto);

      expect(result).toBeDefined();
    });
  });

  describe('getUserTransactions', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.getUserTransactions('')).rejects.toThrow(BadRequestException);
      await expect(service.getUserTransactions('')).rejects.toThrow('Invalid or missing userId');
    });

    it('should throw BadRequestException when userId format is invalid', async () => {
      await expect(service.getUserTransactions('invalid-id')).rejects.toThrow(BadRequestException);
      await expect(service.getUserTransactions('invalid-id')).rejects.toThrow('Invalid or missing userId');
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.getUserTransactions(userId)).rejects.toThrow(BadRequestException);
      await expect(service.getUserTransactions(userId)).rejects.toThrow('User not found');
    });

    it('should return empty transactions and zero summary when no transactions exist', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTransactionModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });

      const result = await service.getUserTransactions(userId);

      expect(result).toEqual({
        transactions: [],
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        },
      });
    });

    it('should return transactions with correct summary totals', async () => {
      const transactions = [
        { ...mockTransaction, type: TransactionType.INCOME, amount: 500 },
        { ...mockTransaction, type: TransactionType.EXPENSE, amount: 200 },
        { ...mockTransaction, type: TransactionType.EXPENSE, amount: 100 },
      ];

      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      const mockExec = jest.fn().mockResolvedValue(transactions);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTransactionModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });

      const result = await service.getUserTransactions(userId);

      expect(result.summary.totalIncome).toBe(500);
      expect(result.summary.totalExpense).toBe(300);
      expect(result.summary.balance).toBe(200);
      expect(result.transactions).toEqual(transactions);
    });
  });
});

