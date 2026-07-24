import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InternshipTrack } from '@prisma/client';

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(InternshipTrack)
  track?: InternshipTrack;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
