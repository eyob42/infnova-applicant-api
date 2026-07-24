import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { QueryApplicantsDto } from './dto/query-applicants.dto';

@Injectable()
export class ApplicantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateApplicantDto) {
    const existing = await this.prisma.applicant.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An applicant with this email already exists');
    }

    return this.prisma.applicant.create({
      data: {
        name: dto.name,
        email: dto.email,
        track: dto.track,
        notes: dto.notes,
      },
    });
  }

  async findOne(id: number) {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant #${id} not found`);
    }

    return applicant;
  }

  async update(id: number, dto: UpdateApplicantDto) {
    // Ensure applicant exists and is not soft-deleted
    await this.findOne(id);

    if (dto.email) {
      const conflict = await this.prisma.applicant.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException('An applicant with this email already exists');
      }
    }

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.track !== undefined && { track: dto.track }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async softDelete(id: number) {
    // Ensure applicant exists and is not already soft-deleted
    await this.findOne(id);

    return this.prisma.applicant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAll(query: QueryApplicantsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      track,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (track) where.track = track;

    const [data, total] = await Promise.all([
      this.prisma.applicant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.applicant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
