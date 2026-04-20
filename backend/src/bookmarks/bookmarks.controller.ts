import { Controller, Post, Get, Delete, Body, Query, Param, Logger } from '@nestjs/common';
import { BookmarksService, type CreateBookmarkDto } from './bookmarks.service';

@Controller('api/bookmarks')
export class BookmarksController {
  private readonly logger = new Logger(BookmarksController.name);

  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * POST /api/bookmarks
   * Body: { userId, type, date, text, icon }
   */
  @Post()
  async create(@Body() dto: CreateBookmarkDto) {
    this.logger.log(`POST /api/bookmarks — userId=${dto.userId}, type=${dto.type}`);

    if (!dto.userId || !dto.type || !dto.text) {
      return { error: 'userId, type and text are required', statusCode: 400 };
    }

    const bookmark = await this.bookmarksService.create(dto);
    return { data: bookmark };
  }

  /**
   * GET /api/bookmarks?userId=xxx
   */
  @Get()
  async findAll(@Query('userId') userId: string) {
    this.logger.log(`GET /api/bookmarks — userId=${userId}`);

    if (!userId) {
      return { error: 'userId is required', statusCode: 400 };
    }

    const bookmarks = await this.bookmarksService.findAll(userId);
    return { data: bookmarks };
  }

  /**
   * DELETE /api/bookmarks/:id?userId=xxx
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Query('userId') userId: string) {
    this.logger.log(`DELETE /api/bookmarks/${id} — userId=${userId}`);

    if (!userId) {
      return { error: 'userId is required', statusCode: 400 };
    }

    await this.bookmarksService.remove(id, userId);
    return { data: { deleted: true } };
  }
}
