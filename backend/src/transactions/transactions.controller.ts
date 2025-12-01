import { Controller, Post, Body, Get, Param, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  // Route to create a transaction
  @Post()
  async create(@Body() body: any) {
    try {
      return await this.transactionsService.create(body);
    } catch (error) {
      // Handling specific errors from the service
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      // Internal error for unknown failures
      throw new BadRequestException('Failed to create transaction');
    }
  }

  @Get(':userId')
  async getUserTransactions(@Param('userId') userId: string) {
    try {
      const result = await this.transactionsService.getUserTransactions(userId);
      return result; // Simply return the result, which may include an empty transactions list
    } catch (error) {
      // Handle BadRequestException from the service layer
      if (error instanceof BadRequestException) {
        // Log the error for better debugging visibility
        console.error('BadRequestError:', error.message);
        throw new BadRequestException(error.message); // Propagate BadRequestException
      }
      
      // Log unexpected errors (e.g., database issues)
      console.error('UnexpectedError:', error);
      
      // Internal error for unknown failures
      throw new InternalServerErrorException('Failed to retrieve transactions for user');
    }
  }
}
