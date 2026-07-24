import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicantsService } from './applicants.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { QueryApplicantsDto } from './dto/query-applicants.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/applicants')
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post()
  create(@Body() dto: CreateApplicantDto) {
    return this.applicantsService.create(dto);
  }

  // @Get() must be before @Get(':id') to prevent Nest routing ambiguity
  @Get()
  findAll(@Query() query: QueryApplicantsDto) {
    return this.applicantsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApplicantDto) {
    return this.applicantsService.update(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.applicantsService.softDelete(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicantsService.updateStatus(id, dto);
  }

  @Patch(':id/notes')
  updateNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotesDto,
  ) {
    return this.applicantsService.updateNotes(id, dto);
  }
}
