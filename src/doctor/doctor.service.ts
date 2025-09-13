import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

type SearchFilters = {
  name?: string;
  position?: string;
  exp?: string;
  qual_type?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class DoctorService {
  constructor(private dataSource: DataSource) { }

  async createQuali(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // --- ใช้ SQL หา staff ล่าสุด ---
      const staffSql = `
      SELECT staff_id
      FROM staff
      ORDER BY staff_id DESC
      LIMIT 1
    `;
      const [latestStaff] = await queryRunner.query(staffSql);

      if (!latestStaff) {
        throw new Error('No staff found. Please add staff first.');
      }

      const staffId = latestStaff.staff_id;

      // --- สร้าง SQL Bulk Insert ---
      // เรากำหนดโครงสร้าง SQL ไว้ชัดเจน แล้ว map ข้อมูลลงไป
      const placeholders = data.education
        .map(() => `(?, ?, ?, ?)`)
        .join(', ');

      const insertSql = `
      INSERT INTO qualification (staff_id, qual_type, qual_date, institution)
      VALUES ${placeholders}
    `;

      // สร้าง params ชุดเดียว
      const params: any[] = [];
      for (const edu of data.education) {
        params.push(
          staffId,
          edu.qual_type,
          edu.qual_date || null,
          edu.institution || null,
        );
      }

      // ยิง SQL ล้วน ๆ
      await queryRunner.query(insertSql, params);

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

  async searchStaff(filters: SearchFilters) {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      let sql = `
      SELECT
        s.staff_id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        s.position,
        COALESCE(SUM(TIMESTAMPDIFF(YEAR, w.start_date, w.end_date)),0) AS experience_years
      FROM staff s
      LEFT JOIN work_experience w ON w.staff_id = s.staff_id
    `;

      const where: string[] = [];
      const having: string[] = [];
      const params: any[] = [];

      // ✅ เงื่อนไขชื่อ
      if (filters.name) {
        where.push(`CONCAT(s.first_name, ' ', s.last_name) LIKE ?`);
        params.push(`%${filters.name}%`);
      }

      if (filters.position) {
        where.push(`s.position = ?`);
        params.push(filters.position);
      }

      // ✅ เงื่อนไข exp ใช้ HAVING เพราะเป็นค่าที่คำนวณ (aggregate)
      if (filters.exp) {
        if (filters.exp === '5_more') {
          having.push(`experience_years >= ?`);
          params.push(5);
        } else {
          having.push(`experience_years = ?`);
          params.push(Number(filters.exp));
        }
      }

      // ✅ เงื่อนไขวุฒิ
      if (filters.qual_type) {
        where.push(`
        EXISTS (
          SELECT 1
          FROM qualification q
          WHERE q.staff_id = s.staff_id
            AND q.qual_type = ?
        )
      `);
        params.push(filters.qual_type);
      }

      if (where.length) {
        sql += ` WHERE ` + where.join(' AND ');
      }

      sql += `
      GROUP BY s.staff_id
    `;

      if (having.length) {
        sql += ` HAVING ` + having.join(' AND ');
      }

      sql += ` ORDER BY s.staff_id DESC `;

      const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
      const offset = Math.max(filters.offset ?? 0, 0);
      sql += ` LIMIT ? OFFSET ? `;
      params.push(limit, offset);

      const rows = await qr.query(sql, params);
      return rows;
    } finally {
      await qr.release();
    }
  }

  async findById(id: number) {
    // ---- staff (หัวเอกสาร) ----
    const [staff] = await this.dataSource.query(
      `SELECT
        s.staff_id     AS id,
        s.first_name   AS firstName,
        s.last_name    AS lastName,
        s.position     AS \`position\`,
        s.gender       AS gender,
        s.phone        AS phone,
        s.address_line AS address
     FROM staff s
     WHERE s.staff_id = ?`,
      [id],
    );
    if (!staff) return null;

    // ---- qualification -> eduHistory ----
    const eduHistory = await this.dataSource.query(
      `SELECT
        q.qual_type    AS degree,
        q.institution  AS institute,
        q.qual_date    AS \`year\`
     FROM qualification q
     WHERE q.staff_id = ?
     ORDER BY q.qual_date DESC`,
      [id],
    );

    // ---- work_experience -> workHistory ----
    const workHistory = await this.dataSource.query(
      `SELECT
        w.position     AS title,
        w.organization AS organization,
        w.start_date   AS startDate,
        w.end_date     AS endDate
     FROM work_experience w
     WHERE w.staff_id = ?
     ORDER BY w.start_date DESC`,
      [id],
    );

    return {
      ...staff,
      eduHistory,
      workHistory,
    };
  }





}

