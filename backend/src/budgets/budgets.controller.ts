import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}
  
  @Post()
  async create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(createBudgetDto);
  }

  @Get(':userId/:month/:year')
  async getBudget(
    @Param('userId') userId: string,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.budgetsService.getBudget(userId, month, year);
  }

  @Get('all/:userId')
  async getAllBudgets(@Param('userId') userId: string) {
    return this.budgetsService.getAllBudgets(userId);
  }
}
