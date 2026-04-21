import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BookmarksService, CreateBookmarkDto } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@Controller('api/bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(user.sub, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query('type') type?: string) {
    return this.bookmarksService.findAll(user.sub, type);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.bookmarksService.remove(id, user.sub);
  }
}
