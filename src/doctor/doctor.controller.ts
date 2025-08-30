import { Controller, Post, Body } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Post('/QualiForm')
  async createQuali(@Body() data: any) {
    return this.doctorService.createQuali(data);
  }


  @Post('/StaffForm')
  async createStaffInfo(@Body() data: any) {
    return this.doctorService.createStaffInfo(data);
  }

  @Post('/workx')
  async createWorkx(@Body() data: any) {
    return this.doctorService.createWorkx(data);
  }




}
