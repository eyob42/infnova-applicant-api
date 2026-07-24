import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, InternshipTrack } from '@prisma/client';
import { ApplicantsService } from './applicants.service';
import { PrismaService } from '../prisma/prisma.service';

// Minimal applicant fixture
const mockApplicant = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  track: InternshipTrack.FRONTEND_DEVELOPMENT,
  status: ApplicationStatus.PENDING,
  notes: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  applicant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('ApplicantsService', () => {
  let service: ApplicantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApplicantsService>(ApplicantsService);
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------ create
  describe('create', () => {
    it('creates an applicant when email is unique', async () => {
      mockPrisma.applicant.findUnique.mockResolvedValue(null);
      mockPrisma.applicant.create.mockResolvedValue(mockApplicant);

      const result = await service.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        track: InternshipTrack.FRONTEND_DEVELOPMENT,
      });

      expect(result).toEqual(mockApplicant);
      expect(mockPrisma.applicant.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is already taken', async () => {
      mockPrisma.applicant.findUnique.mockResolvedValue(mockApplicant);

      await expect(
        service.create({
          name: 'Jane Doe',
          email: 'jane@example.com',
          track: InternshipTrack.FRONTEND_DEVELOPMENT,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.applicant.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('returns the applicant when found and not soft-deleted', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(mockApplicant);

      const result = await service.findOne(1);
      expect(result).toEqual(mockApplicant);
      expect(mockPrisma.applicant.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
    });

    it('throws NotFoundException for a soft-deleted applicant', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a non-existent id', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------ updateStatus
  describe('updateStatus', () => {
    it('allows valid status transitions (PENDING → SHORTLISTED)', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(mockApplicant);
      const updated = { ...mockApplicant, status: ApplicationStatus.SHORTLISTED };
      mockPrisma.applicant.update.mockResolvedValue(updated);

      const result = await service.updateStatus(1, {
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
    });

    it('blocks REJECTED → ACCEPTED transition with BadRequestException', async () => {
      const rejectedApplicant = {
        ...mockApplicant,
        status: ApplicationStatus.REJECTED,
      };
      mockPrisma.applicant.findFirst.mockResolvedValue(rejectedApplicant);

      await expect(
        service.updateStatus(1, { status: ApplicationStatus.ACCEPTED }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.applicant.update).not.toHaveBeenCalled();
    });

    it('allows REJECTED → PENDING (other transitions from REJECTED are permitted)', async () => {
      const rejectedApplicant = {
        ...mockApplicant,
        status: ApplicationStatus.REJECTED,
      };
      mockPrisma.applicant.findFirst.mockResolvedValue(rejectedApplicant);
      const updated = { ...rejectedApplicant, status: ApplicationStatus.PENDING };
      mockPrisma.applicant.update.mockResolvedValue(updated);

      const result = await service.updateStatus(1, {
        status: ApplicationStatus.PENDING,
      });

      expect(result.status).toBe(ApplicationStatus.PENDING);
    });

    it('throws NotFoundException when applicant is soft-deleted', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(1, { status: ApplicationStatus.ACCEPTED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------- softDelete
  describe('softDelete', () => {
    it('sets deletedAt on the record (does not remove the row)', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(mockApplicant);
      const deleted = { ...mockApplicant, deletedAt: new Date() };
      mockPrisma.applicant.update.mockResolvedValue(deleted);

      const result = await service.softDelete(1);

      expect(result.deletedAt).not.toBeNull();
      expect(mockPrisma.applicant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('throws NotFoundException when applicant is already soft-deleted', async () => {
      mockPrisma.applicant.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(1)).rejects.toThrow(NotFoundException);
    });
  });
});
