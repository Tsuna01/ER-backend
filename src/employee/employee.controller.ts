import { Controller, Get, Post, Body, Query, Patch,Put ,Param,NotFoundException} from '@nestjs/common';
import { EmployeeService } from './employee.service';


@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Post('/D')
  async registerPatient(@Body() data: any) {
    return this.employeeService.registerPatient(data);

  }

  @Post('/E')
  async registerAppointment(@Body() data: any) {
    return this.employeeService.registerAppointment(data);

  }

  @Get('/E/api')
  async findUser() {
    return this.employeeService.findUser();
  }

  @Post('/U')
  async registerInpatient(@Body() data: any) {
    return this.employeeService.registerInpatient(data);
  }

  @Post('/W')
  async addWaitinglist(@Body() data: any) {
    return this.employeeService.addWaitinglist(data);
  }

  @Get('W/api')
  tableWaitingL() {
    return this.employeeService.tableWaitingL();
  }

  @Put('W/update') // ✅ ให้ตรงกับ axios.put
  async updateWaiting(@Body() body: any[]) {
    return this.employeeService.upTablewaitingL(body);
  }
  
  @Get('E/info')
  AllPatient(){
    return this.employeeService.AllPatient();
  }

  @Get('W/info')
  AllPatientW(){
    return this.employeeService.AllPatientW();
  }

  @Get('U/api')
  async listInpatients(
    @Query('ward_id') wardId?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
    // current=1 จะกรองเฉพาะที่ยังไม่จำหน่าย (actual_dis_date IS NULL)
    @Query('current') current = '1',
  ) {
    return this.employeeService.searchInpatients({
      wardId: wardId ? Number(wardId) : undefined,
      limit: Number(limit),
      offset: Number(offset),
      current: current === '1',
    });
  }

  @Get('U/info')
  async TableBed(){
    return this.employeeService.tableBed(); 
  
  }


   @Get('beds/available')
  getAvailableBeds(
    @Query('ward_id') wardId?: string,        // กรองเฉพาะวอร์ด
    @Query('from_ward') fromWard = '1',       // ตั้งแต่วอร์ดนี้ขึ้นไป (ดีฟอลต์ 1)
    @Query('to_ward') toWard?: string,        // ถึงวอร์ดนี้
    @Query('limit') limit = '5',
    @Query('offset') offset = '0',
  ) {
    return this.employeeService.getAvailableBeds({
      wardId: wardId ? Number(wardId) : undefined,
      fromWard: Number(fromWard),
      toWard: toWard ? Number(toWard) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });
  }

  @Get('Infopatient/:id')
  async getPatient(@Param('id') id: string) {
    const data = await this.employeeService.findById(Number(id));
    if (!data) throw new NotFoundException('ไม่พบผู้ป่วย');
    return data;
  }


}