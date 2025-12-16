import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { User } from '../users/schemas/user.schema';

// Define DTO type inline
interface CreateBudgetDto {
  userId: string;
  month: number;
  year: number;
  amount: number;
}

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetModel: Model<Budget>;
  let transactionModel: Model<Transaction>;
  let userModel: Model<User>;

  const mockBudgetModel = function(budgetData?: any) {
    return {
      ...mockBudget,
      ...budgetData,
      save: jest.fn().mockResolvedValue(mockBudget),
    };
  } as any;

  mockBudgetModel.find = jest.fn();
  mockBudgetModel.findOne = jest.fn();
  mockBudgetModel.create = jest.fn();

  const mockTransactionModel = {
    find: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockBudget = {
    _id: '507f1f77bcf86cd799439013',
    userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
    month: 12,
    year: 2024,
    amount: 1000,
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getModelToken(Budget.name),
          useValue: mockBudgetModel,
        },
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

    service = module.get<BudgetsService>(BudgetsService);
    budgetModel = module.get<Model<Budget>>(getModelToken(Budget.name));
    transactionModel = module.get<Model<Transaction>>(getModelToken(Transaction.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));

    jest.clearAllMocks();
  });

  describe('create', () => {
    // Get current date for testing
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const validDto: CreateBudgetDto = {
      userId: '507f1f77bcf86cd799439011',
      month: nextMonth,
      year: nextYear,
      amount: 1000,
    };

    it('should throw BadRequestException when userId is missing', async () => {
      const dto = { ...validDto, userId: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('userId, month, year, amount are required');
    });

    it('should throw BadRequestException when month is missing', async () => {
      const dto = { ...validDto, month: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('userId, month, year, amount are required');
    });

    it('should throw BadRequestException when year is missing', async () => {
      const dto = { ...validDto, year: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('userId, month, year, amount are required');
    });

    it('should throw BadRequestException when amount is missing', async () => {
      const dto = { ...validDto, amount: undefined as any };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('userId, month, year, amount are required');
    });

    it('should throw BadRequestException when month is less than 1', async () => {
      // Use a value that's not falsy but still invalid (like -1 or 0.5)
      // Since 0 is falsy, it will be caught by the required check
      const dto = { ...validDto, month: -1 };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Month must be between 1 and 12');
    });

    it('should throw BadRequestException when month is greater than 12', async () => {
      const dto = { ...validDto, month: 13 };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Month must be between 1 and 12');
    });

    it('should throw BadRequestException when year is negative', async () => {
      const dto = { ...validDto, year: -1 };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Year cannot be negative');
    });

    it('should throw BadRequestException when amount is negative', async () => {
      const dto = { ...validDto, amount: -100 };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Amount cannot be negative');
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(validDto)).rejects.toThrow('Invalid userId');
    });

    it('should throw BadRequestException when trying to set budget for past month', async () => {
      const pastDto = { ...validDto, month: currentMonth - 1, year: currentYear };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      // Only test if currentMonth > 1
      if (currentMonth > 1) {
        await expect(service.create(pastDto)).rejects.toThrow(BadRequestException);
        await expect(service.create(pastDto)).rejects.toThrow('Cannot set budget for past months');
      }
    });

    it('should throw ConflictException when budget already exists for the month', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBudget),
      });

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
      await expect(service.create(validDto)).rejects.toThrow('Budget already set for this month');
    });

    it('should successfully create a budget', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(validDto);

      expect(result).toBeDefined();
      expect(mockUserModel.findById).toHaveBeenCalledWith(validDto.userId);
    });
  });

  describe('getBudget', () => {
    const userId = '507f1f77bcf86cd799439011';
    const month = 12;
    const year = 2024;

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.getBudget('', month, year)).rejects.toThrow(BadRequestException);
      await expect(service.getBudget('', month, year)).rejects.toThrow('userId, month, and year are required');
    });

    it('should throw BadRequestException when month is missing', async () => {
      await expect(service.getBudget(userId, 0, year)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when year is missing', async () => {
      await expect(service.getBudget(userId, month, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when month is invalid', async () => {
      await expect(service.getBudget(userId, 0, year)).rejects.toThrow(BadRequestException);
      await expect(service.getBudget(userId, 13, year)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.getBudget(userId, month, year)).rejects.toThrow(BadRequestException);
      await expect(service.getBudget(userId, month, year)).rejects.toThrow('Invalid userId');
    });

    it('should return message when no budget is set for the month', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getBudget(userId, month, year);

      expect(result).toEqual({ message: 'No budget set for this month' });
    });

    it('should handle budget with no expenses', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBudget),
      });
      mockTransactionModel.find = jest.fn().mockResolvedValue([]);

      const result = await service.getBudget(userId, month, year);

      expect(result.budget).toEqual(mockBudget);
      expect(result.totalSpent).toBe(0);
      expect(result.remaining).toBe(mockBudget.amount);
      expect(result.percentage).toBe(0);
    });

    it('should handle budget amount = 0 safely (percentage calculation)', async () => {
      const zeroBudget = { ...mockBudget, amount: 0 };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(zeroBudget),
      });
      mockTransactionModel.find = jest.fn().mockResolvedValue([]);

      const result = await service.getBudget(userId, month, year);

      expect(result.budget).toEqual(zeroBudget);
      expect(result.percentage).toBe(0);
    });

    it('should calculate budget correctly with expenses', async () => {
      const expenses = [
        { amount: 300, type: 'expense' },
        { amount: 200, type: 'expense' },
      ];

      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      mockBudgetModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBudget),
      });
      mockTransactionModel.find = jest.fn().mockResolvedValue(expenses);

      const result = await service.getBudget(userId, month, year);

      expect(result.totalSpent).toBe(500);
      expect(result.remaining).toBe(500); // 1000 - 500
      expect(result.percentage).toBe(50);
      expect(result.status).toBe('on_track');
    });
  });

  describe('getAllBudgets', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should throw BadRequestException when userId is missing', async () => {
      await expect(service.getAllBudgets('')).rejects.toThrow(BadRequestException);
      await expect(service.getAllBudgets('')).rejects.toThrow('userId is required');
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.getAllBudgets(userId)).rejects.toThrow(BadRequestException);
      await expect(service.getAllBudgets(userId)).rejects.toThrow('Invalid userId');
    });

    it('should return empty array when no budgets exist', async () => {
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockBudgetModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });

      const result = await service.getAllBudgets(userId);

      expect(result.budgets).toEqual([]);
    });

    it('should return budgets with spending calculations', async () => {
      const budgets = [mockBudget];
      const expenses = [{ amount: 300, type: 'expense' }];

      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);
      const mockExec = jest.fn().mockResolvedValue(budgets);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockBudgetModel.find = jest.fn().mockReturnValue({
        sort: mockSort,
      });
      mockTransactionModel.find = jest.fn().mockResolvedValue(expenses);

      const result = await service.getAllBudgets(userId);

      expect(result.budgets).toHaveLength(1);
      expect(result.budgets[0].totalSpent).toBe(300);
      expect(result.budgets[0].remaining).toBe(700);
      expect(result.budgets[0].percentage).toBe(30);
    });
  });
});

