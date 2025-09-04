import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { DatabaseModule } from './database/database.module';
import { EmployeeModule } from './employee/employee.module';





@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql', // กำหนดประเภทฐานข้อมูลเป็น MySQL
      host: 'localhost', // หรือชื่อ service ของ Docker container เช่น 'mysql-db'
      port: 3306, // พอร์ตของฐานข้อมูล
      username: 'root', // ชื่อผู้ใช้
      password: 'password1', // รหัสผ่าน
      database: 'hospital_db', // ชื่อฐานข้อมูล
      entities: [], // ไม่ระบุ entities
      synchronize: false, // ต้องเป็น false เมื่อไม่มี entities
      autoLoadEntities: false,
    }),
    AuthModule,
    DatabaseModule,
    DoctorModule,
    EmployeeModule,
    
  ],
  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule {}
