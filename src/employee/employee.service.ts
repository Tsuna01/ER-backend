import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(private dataSource: DataSource) { }


    async createUserregister(first_name:string,last_name:string,data_of_birth:string,gender:string,address_line:string,phone:string,data_registered:string,clinic_no:string): Promise<any>{
      const result = await this.dataSource.query(`
        INSERT INTO patient (
          fisrt_name,
          last_name,
          data_of_birth,
          gender,
          address_line,
          phone,
          data_registered,
          clinic_no
        ) VALUES (?,?,?,?,?,?,?,?)
        `,[first_name,last_name,data_of_birth,gender,address_line,phone,data_registered,clinic_no])
      return result;
    }

    async showUser(){
      const result = await this.dataSource.query(``)
      return result;
    }
}
