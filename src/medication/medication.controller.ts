import { Controller, Get, Post, Body, Patch, Param, Delete ,NotFoundException } from '@nestjs/common';
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

  @Get('info/:id')
  async getInfo(@Param('id') id: string) {
    const data = await this.medicationService.findInfoById(Number(id));
    if (!data) throw new NotFoundException('ไม่พบข้อมูล');
    return data;
  }

  // (ออปชัน) GET /medication/patient/:patientId -> รายการยาทั้งหมดของผู้ป่วย
  @Get('patient/:patientId')
  async listByPatient(@Param('patientId') patientId: string) {
    return this.medicationService.listByPatientId(Number(patientId));
  }
}
