import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MedicationService } from './medication.service';

@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) { }


  @Get('/api')
  async showMed(){
    return this.medicationService.fulluser();
  }

  @Post('/from')
  async createDrug(@Body() data: any) {
    return this.medicationService.createDrug(
      data.patient_id,
      data.item_id,
      data.prescribed_by,  
      data.units_per_day,
      data.start_date,
      data.end_date,
    );
  }
}
