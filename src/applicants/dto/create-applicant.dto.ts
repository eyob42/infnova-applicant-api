import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { InternshipTrack } from '@prisma/client';

export class CreateApplicantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(InternshipTrack)
  track: InternshipTrack;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
