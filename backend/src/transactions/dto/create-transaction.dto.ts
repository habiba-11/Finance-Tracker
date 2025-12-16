import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(TransactionType, {
    message: 'Type must be either "income" or "expense"',
  })
  type: TransactionType;

  @IsNotEmpty({ message: 'Category is required' })
  @IsString({ message: 'Category must be a string' })
  category: string;

  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid date string' })
  date: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}

