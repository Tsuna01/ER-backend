import { Controller, Post, Get, Put, Body } from '@nestjs/common';
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

  @Get('/api')
  async findUser() {
    return this.doctorService.findUser();
  }

  @Put('WardForm')
async updateWard(@Body() body: any) {
  try {
    console.log('📥 รับค่าจาก React:', body);

    const {
      staff_id,
      ward_id,
      start_date,
      end_date,
      shift_type
    } = body;

    if (!staff_id || !ward_id || !start_date || !end_date || !shift_type) {
      console.error('❌ ข้อมูลไม่ครบ:', body);
      throw new Error('Missing required fields');
    }

    const staffId = Number(staff_id);
    const wardId = Number(ward_id);

    const result = await this.doctorService.updateStaffAssignment(
      staffId,
      wardId,
      start_date,
      end_date,
      shift_type
    );

    console.log('✅ อัปเดตเรียบร้อย:', result);
    return result;

  } catch (err) {
    console.error('🔥 ERROR ใน Controller:', err);
    return { message: '❌ เกิดข้อผิดพลาด', error: err.message || err };
  }
}

  @Get('/WardForm')
  async showinfoWard() {
    return this.doctorService.showinfoWard();
  }




}
