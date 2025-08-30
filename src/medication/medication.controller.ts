import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { DataSource } from 'typeorm';

@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  showData(){
    return this.medicationService.showDatadrug();
  }

  @Post()
  setDrug(@Body() body: any) {
    return this.medicationService.createDrug(
      body.patient_id,
      body.item_id,
      body.prescribes_by,
      body.units_per_day,
      body.start_date,
      body.end_date
    );
  }
}
