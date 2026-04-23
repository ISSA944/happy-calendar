import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IsString, MaxLength, IsObject } from 'class-validator';
import { PrismaService } from '../prisma';
import type { Prisma } from '@prisma/client';

export class CreateBookmarkDto {
  @IsString()
  @MaxLength(32)
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBookmarkDto) {
    this.logger.log(`create bookmark user=${userId}, type=${dto.type}`);
    return this.prisma.bookmark.create({
      data: {
        userId,
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(userId: string, type?: string) {
    return this.prisma.bookmark.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const result = await this.prisma.bookmark.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) throw new NotFoundException('Bookmark not found');
    return { deleted: true };
  }
}
