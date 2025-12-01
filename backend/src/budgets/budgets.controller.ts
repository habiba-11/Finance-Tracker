import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}
  @Post()
  async create(@Body() body: any) {
    try {
      return await this.budgetsService.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);  // Propagate error message to the client
    }
  }

  @Get(':userId/:month/:year')
  async getBudget(
    @Param('userId') userId: string,
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    try {
      return await this.budgetsService.getBudget(userId, +month, +year);
    } catch (error) {
      throw new BadRequestException(error.message);  // Propagate error message to the client
    }
  }
}
