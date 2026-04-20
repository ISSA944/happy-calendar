import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

export interface CreateBookmarkDto {
  userId: string;
  type: string;   // "гороскоп" | "поддержка"
  date: string;
  text: string;
  icon: string;
}

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Создать закладку */
  async create(dto: CreateBookmarkDto) {
    this.logger.log(`create bookmark user=${dto.userId}, type=${dto.type}`);

    return this.prisma.bookmark.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        date: dto.date,
        text: dto.text,
        icon: dto.icon,
      },
    });
  }

  /** Все закладки пользователя (новые сверху) */
  async findAll(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Удалить закладку */
  async remove(id: string, userId: string) {
    return this.prisma.bookmark.deleteMany({
      where: { id, userId },
    });
  }
}
