import { Controller, Post, Get, Put, Body, Query, Param, NotFoundException } from '@nestjs/common';
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

  @Get('api')
  async search(
    @Query('name') name?: string,
    @Query('position') position?: string,
    @Query('exp') exp?: string,                   // "1"|"2"|"3"|"4"|"5_more"
    @Query('qual_type') qual_type?: string,       // "bachelor"|"master"|...
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const p = Math.max(parseInt(page) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const offset = (p - 1) * l;

    const rows = await this.doctorService.searchStaff({
      name: name?.trim() || undefined,
      position: position?.trim() || undefined,
      exp: exp?.trim() || undefined,
      qual_type: qual_type?.trim() || undefined,
      limit: l,
      offset,
    });
    return rows;
  }

  @Put('WardForm')
  async updateWard(@Body() body: any) {
    try {
      console.log('📥 รับค่าจาก React:', body);

      const {
        staff_id,
        ward_id,
        NotFoundException,
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

  @Get(':id')
  async getStaff(@Param('id') id: string) {
    const data = await this.doctorService.findById(Number(id));
    if (!data) throw new NotFoundException('ไม่พบบุคลากร');
    return data;
  }

  @Get('StaffInfo/:id')
  async getStaffInfo(@Param('id') id: string) {
    const data = await this.doctorService.findById(Number(id));
    if (!data) throw new NotFoundException('ไม่พบบุคลากร');
    return data;
  }



}
