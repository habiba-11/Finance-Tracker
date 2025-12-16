import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsNotEmpty({ message: 'Month is required' })
  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  month: number;

  @IsNotEmpty({ message: 'Year is required' })
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000, { message: 'Year must be a valid year' })
  year: number;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;
}

