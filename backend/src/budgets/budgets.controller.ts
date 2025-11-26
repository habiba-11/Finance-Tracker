import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Body() body: any) {
    return this.budgetsService.create(body);
  }

 @Get(':userId/:month/:year')
  getBudget(
    @Param('userId') userId: string,
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.budgetsService.getBudget(userId, +month, +year);
  }
}
