import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, InternshipTrack } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const where = { deletedAt: null };

    const [total, statusCounts, trackCounts] = await Promise.all([
      this.prisma.applicant.count({ where }),
      this.prisma.applicant.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.applicant.groupBy({
        by: ['track'],
        where,
        _count: true,
      }),
    ]);

    const byStatus = Object.fromEntries(
      Object.values(ApplicationStatus).map((s) => [
        s,
        statusCounts.find((c) => c.status === s)?._count ?? 0,
      ]),
    );

    const byTrack = Object.fromEntries(
      Object.values(InternshipTrack).map((t) => [
        t,
        trackCounts.find((c) => c.track === t)?._count ?? 0,
      ]),
    );

    return {
      total,
      byStatus,
      byTrack,
    };
  }
}
