import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DoctorService {
  constructor(private dataSource: DataSource) { }

  async createQuali(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ หา staff_id ล่าสุดจากตาราง staff
      const [latestStaff] = await queryRunner.query(
        `SELECT staff_id FROM staff ORDER BY staff_id DESC LIMIT 1`
      );

      if (!latestStaff) {
        throw new Error("No staff found. Please add staff first.");
      }

      const staffId = latestStaff.staff_id;

      // ✅ insert qualification โดยไม่ใส่ other
      for (const edu of data.education) {
        await queryRunner.query(
          `INSERT INTO qualification (staff_id, qual_type, qual_date, institution)
         VALUES (?, ?, ?, ?)`,
          [staffId, edu.qual_type, edu.qual_date || null, edu.institution || null],
        );
      }

      await queryRunner.commitTransaction();
      return { success: true, staffId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  async createStaffInfo(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.query(
        `INSERT INTO staff (
          first_name, last_name, gender, date_of_birth, 
          address_line, phone, position, salary_scale, 
          salary_pay_type, current_salary, contract_type, hours_per_week
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.first_name,
          data.last_name,
          data.gender,
          data.date_of_birth,
          data.address_line,
          data.phone,
          data.position,
          data.salary_scale,
          data.salary_pay_type,
          data.current_salary,
          data.contract_type,
          data.hours_per_week,
        ],
      );

      await queryRunner.commitTransaction();
      return { success: true, staffId: result.insertId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createWorkx(data: any) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ⬇️ ดึง staff_id ล่าสุดจากตาราง staff
    const [latestStaff] = await queryRunner.query(
      `SELECT staff_id FROM staff ORDER BY staff_id DESC LIMIT 1`
    );

    if (!latestStaff) {
      throw new Error('No staff found. Please insert staff first.');
    }

    const staffId = latestStaff.staff_id;

    // ⬇️ insert work experience โดยอ้างอิง staff คนล่าสุด
    await queryRunner.query(
      `INSERT INTO work_experience (staff_id, organization, position, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [staffId, data.organization, data.position, data.start_date, data.end_date],
    );

    await queryRunner.commitTransaction();
    return { success: true, staffId };
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ SQL Error:', err);
    throw err;
  } finally {
    await queryRunner.release();
  }
}


}

