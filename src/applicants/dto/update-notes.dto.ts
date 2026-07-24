import { IsString, MaxLength } from 'class-validator';

export class UpdateNotesDto {
  @IsString()
  @MaxLength(1000)
  notes: string;
}
