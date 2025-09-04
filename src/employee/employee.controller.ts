import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

  @Get('U/api')
  async getInpatients() {
    return this.employeeService.showInpatients();
  }


}