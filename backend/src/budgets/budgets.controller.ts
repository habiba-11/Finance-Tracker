import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Body() body: any) {
    return this.budgetsService.create(body);
  }

  // getBudget() will be added by Member 6
}
