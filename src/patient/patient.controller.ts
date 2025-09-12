import { Controller, Get, Post, Body,Query, Patch, Param, Delete } from '@nestjs/common';
import { PatientService } from './patient.service';


@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('min')
  min(@Query('q') q?: string) {
    return this.patientService.minList(q);
  }
  
}
