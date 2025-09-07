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
      // หา staff_id ล่าสุด
      const [latestStaff] = await queryRunner.query(
        `SELECT staff_id FROM staff ORDER BY staff_id DESC LIMIT 1`
      );

      if (!latestStaff) {
        throw new Error('No staff found. Please add staff first.');
      }

      const staffId = latestStaff.staff_id;

      // ✅ Bulk insert ใช้ SQL เดียว
      const placeholders = data.education.map(() => '(?, ?, ?, ?)').join(', ');
      const params: any[] = [];
      for (const edu of data.education) {
        params.push(staffId, edu.qual_type, edu.qual_date || null, edu.institution || null);
      }

      const sql = `
        INSERT INTO qualification (staff_id, qual_type, qual_date, institution)
        VALUES ${placeholders}
      `;

      await queryRunner.query(sql, params);

      await queryRunner.commitTransaction();
      return { success: true, staffId, inserted: data.education.length };
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

  async findUser() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const result = await queryRunner.query(`
      SELECT 
        staff_id,
        CONCAT(first_name, ' ', last_name) AS name,
        position
      FROM staff
      WHERE staff_id IS NOT NULL 

      ORDER BY staff_id ASC
    `);

      return result;
    } catch (err) {
      console.error('❌ SQL Error:', err);
      throw err;
    } finally {
      await queryRunner.release(); // คืน connection
    }
  }

  async search(filters: any) {
    let query = `SELECT * FROM staff WHERE 1=1`;
    const params: any[] = [];

    if (filters.name) {
      query += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }
    if (filters.position) {
      query += ` AND position = ?`;
      params.push(filters.position);
    }
    if (filters.experience) {
      query += ` AND experience >= ?`;
      params.push(filters.experience);
    }
    if (filters.location) {
      query += ` AND location LIKE ?`;
      params.push(`%${filters.location}%`);
    }
    if (filters.education) {
      query += ` AND education = ?`;
      params.push(filters.education);
    }

    const [rows] = await this.dataSource.query(query, params);
    return rows;
  }

  async updateStaffAssignment(
  staff_id: number,
  ward_id: number,
  start_date: string,
  end_date: string,
  shift_type: string,
) {
  try {
    console.log('📡 updateStaffAssignment เริ่มทำงาน');
    console.log('📊 ข้อมูลที่ใช้ query:', {
      staff_id, ward_id, start_date, end_date, shift_type
    });

    const result = await this.dataSource.query(
      `
      UPDATE staff_assignment
      SET ward_id = ?, start_date = ?, end_date = ?, shift_type = ?
      WHERE staff_id = ?;
      `,
      [ward_id, start_date, end_date, shift_type, staff_id],
    );

    if (!result || result.affectedRows === 0) {
      throw new Error(`❗️ ไม่พบข้อมูลของ staff_id=${staff_id} ในฐานข้อมูล`);
    }

    return {
      message: '✅ อัปเดตข้อมูลเรียบร้อย',
      result,
    };
  } catch (error) {
    console.error('🔥 ERROR ใน updateStaffAssignment:', error);
    throw error;
  }
}


  async showinfoWard() {
    const result = await this.dataSource.query(`SELECT * FROM staff_assignment;`)
    return result;
  }



}

