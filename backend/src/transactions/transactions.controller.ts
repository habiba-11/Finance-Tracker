import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  create(@Body() body: any) {
    return this.transactionsService.create(body);
  }

  // getUserTransactions() will be added by Member 4
}