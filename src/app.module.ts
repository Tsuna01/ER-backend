import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DoctorModule } from './doctor/doctor.module';
import { EmployeeModule } from './employee/employee.module';
import { MedicationModule } from './medication/medication.module';
import { SupplierModule } from './supplier/supplier.module';
import { PatientModule } from './patient/patient.module';
import { AuthModule } from './auth/auth.module';





@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql', // กำหนดประเภทฐานข้อมูลเป็น MySQL
      host: '127.0.0.1', // หรือชื่อ service ของ Docker container เช่น 'mysql-db'
      port: 3306, // พอร์ตของฐานข้อมูล
      username: 'root', // ชื่อผู้ใช้
      password: 'password1', // รหัสผ่าน
      database: 'hospital_db', // ชื่อฐานข้อมูล
      entities: [], // ไม่ระบุ entities
      synchronize: false, // ต้องเป็น false เมื่อไม่มี entities
      autoLoadEntities: false,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    DoctorModule,
    EmployeeModule,
    MedicationModule,
    SupplierModule,
    PatientModule,

    
  ],
  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule {}
