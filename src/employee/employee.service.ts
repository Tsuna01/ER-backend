import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

type CreateWaitingDto = {
  patient_id: string;
  ward_id: string;
  date_added: string;
  priority_level: string;
  status: string;
};

type SearchParams = {
  wardId?: number;
  limit?: number;
  offset?: number;
  current?: boolean; // true = ยังนอนอยู่ (actual_dis_date IS NULL)
};

type BedSearch = {
  wardId?: number;     // ถ้าใส่ -> กรองเฉพาะวอร์ดนี้
  fromWard?: number;   // ตั้งแต่วอร์ดนี้ขึ้นไป (ดีฟอลต์ 1)
  toWard?: number;     // ถึงวอร์ดนี้ (ออปชัน)
  limit?: number;
  offset?: number;
};


@Injectable()
export class EmployeeService {
  constructor(private dataSource: DataSource) { }

  async registerPatient(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Insert patient (อ้างอิง clinic_no)
      const patientResult = await queryRunner.query(
        `INSERT INTO patient (
        first_name, 
        last_name, 
        date_of_birth, 
        gender, 
        address_line, 
        phone, 
        date_registered, 
        clinic_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.patient.first_name,
          data.patient.last_name,
          data.patient.date_of_birth,
          data.patient.gender,
          data.patient.address_line,
          data.patient.phone,
          data.patient.date_registered,
          data.patient.clinic_no,
        ],
      );

      const patientId = patientResult.insertId;

      // Insert next_of_kin (อ้างอิง patient_id)
      await queryRunner.query(
        `INSERT INTO next_of_kin (patient_id, kin_name, kin_relationship, kin_address_line, kin_phone)
       VALUES (?, ?, ?, ?, ?)`,
        [
          patientId,
          data.kin.kin_name,
          data.kin.kin_relationship,
          data.kin.kin_address_line,
          data.kin.kin_phone,
        ],
      );

      await queryRunner.commitTransaction();
      return { success: true, patientId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(' Error register patient:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  async registerAppointment(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const appt = data.appointment;

      if (!appt) {
        throw new HttpException(
          ' appointment payload is missing',
          HttpStatus.BAD_REQUEST,
        );
      }

      // ตรวจสอบว่า room_id มีอยู่จริง
      const [room] = await queryRunner.query(
        `SELECT room_id FROM room WHERE room_id = ?`,
        [appt.room_id],
      );

      if (!room) {
        throw new HttpException(
          ` Room ${appt.room_id} does not exist`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Insert appointment
      const result: any = await queryRunner.query(
        `INSERT INTO appointment (
        patient_id,
        staff_id,
        appt_datetime,
        room_id,
        purpose,
        status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          appt.patient_id,
          appt.staff_id,
          appt.appt_datetime,
          appt.room_id,
          appt.purpose,
          appt.status,
        ],
      );

      await queryRunner.commitTransaction();

      const appointmentId = result.insertId || result[0]?.insertId;

      return { success: true, appointmentId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(' Error register appointment:', err.message);
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
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        a.purpose,
        p.clinic_no
      FROM patient AS p
      RIGHT JOIN appointment AS a ON p.patient_id = a.patient_id 
      GROUP BY p.patient_id, p.first_name, p.last_name, a.purpose, p.clinic_no
      ORDER BY p.patient_id ASC
    `);

      return result;
    } catch (err) {
      console.error(" SQL Error:", err.message);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async registerInpatient(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ipt = data.inpatient;

      // ตรวจสอบว่า patient_id มีจริงไหม
      const [patient] = await queryRunner.query(
        `SELECT patient_id FROM patient WHERE patient_id = ?`,
        [ipt.patient_id],
      );
      if (!patient) throw new Error(` Patient ${ipt.patient_id} does not exist`);

      // ตรวจสอบว่า bed_id มีจริงไหม
      const [bed] = await queryRunner.query(
        `SELECT bed_id FROM bed WHERE bed_id = ?`,
        [ipt.bed_id],
      );
      if (!bed) throw new Error(` Bed ${ipt.bed_id} does not exist`);

      // Insert inpatient
      const result: any = await queryRunner.query(
        `
      INSERT INTO inpatient(
        patient_id,
        bed_id,
        date_admitted,
        expected_stay,
        expected_dis_date,
        actual_dis_date
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          ipt.patient_id,
          ipt.bed_id,
          ipt.date_admitted,
          ipt.expected_stay ? Number(ipt.expected_stay) : null,
          ipt.expected_dis_date || null,
          ipt.actual_dis_date || null,
        ],
      );

      await queryRunner.commitTransaction();
      return { success: true, inpatientId: result.insertId || result[0]?.insertId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(" SQL Error register inpatient:", err.message || err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  async showInpatients() {
    try {
      const sql = `
        SELECT 
          ips.patient_id,
          CONCAT(p.first_name, ' ', p.last_name) AS name,
          ips.bed_id,
          ips.date_admitted,
          ips.expected_dis_date
        FROM inpatient AS ips
        LEFT JOIN patient AS p ON ips.patient_id = p.patient_id
        ORDER BY ips.patient_id ASC;
      `;
      const rows = await this.dataSource.query(sql);
      return rows;
    } catch (err) {
      // จะถูก Nest แปลงเป็น 500 ให้เอง
      console.error('🔥 SQL ERROR (showInpatients):', err.message || err);
      throw err;
    }
  }



  async addWaitinglist(data: any) {
    try {
      const reslut = this.dataSource.query(`
        INSERT INTO waiting_list(
          patient_id,
          ward_id,
          date_added,
          priority_level
        )VALUES(?,?,?,?)
        `, [data.patient_id, data.ward_id, data.date_added, data.priority_level])

      return reslut;
    } catch (err) {
      console.error('🔥 SQL ERROR (showInpatients):', err);
      throw err;
    }
  }

  async tableWaitingL() {
    try {
      const result = await this.dataSource.query(`
      SELECT 
        wl.waiting_list_id,
        wl.patient_id,
        CONCAT(p.first_name,' ',p.last_name) AS name,
        wl.ward_id,
        wl.date_added,
        wl.priority_level,
        wl.status
      FROM waiting_list wl
      JOIN patient p ON p.patient_id = wl.patient_id
      WHERE wl.status = 'waiting';
      `);

      return result;
    } catch (err) {
      console.error('🔥 SQL ERROR (showInpatients):', err);
      throw err;
    }

  }

  async upTablewaitingL(data: any[]) {
    for (const row of data) {
      if (row?.waiting_list_id == null) continue; // กันพลาด
      await this.dataSource.query(
        'UPDATE `waiting_list` SET `status` = ? WHERE `waiting_list_id` = ?',
        [row.status, row.waiting_list_id],
      );
    }
    return { success: true };
  }

  async AllPatient(){
    try{
      const result = await this.dataSource.query(`
      SELECT
        p.patient_id,
        CONCAT(p.first_name,' ',p.last_name) AS name,
        p.date_registered,
        p.gender
      FROM patient p
      WHERE NOT EXISTS (
        SELECT 1 FROM appointment a
        WHERE a.patient_id = p.patient_id
      )
      ORDER BY p.patient_id ASC;

      
      `)

      return result;
    }catch(err){
      console.error('🔥 SQL ERROR (showInpatients):', err);
      throw err;
    }
    
  }

  async AllPatientW(){
    try{
      const result = await this.dataSource.query(`
      SELECT
        p.patient_id,
        CONCAT(p.first_name,' ',p.last_name) AS name,
        p.date_registered,
        p.gender
      FROM patient p
      WHERE NOT EXISTS (
        SELECT 1 FROM appointment a
        WHERE a.patient_id = p.patient_id
      )
      ORDER BY p.patient_id ASC;

      
      `)

      return result;
    }catch(err){
      console.error('🔥 SQL ERROR (showInpatients):', err);
      throw err;
    }
    
  }

  async searchInpatients(params: SearchParams) {
  const { wardId, limit = 50, offset = 0, current = true } = params;

  const qr = this.dataSource.createQueryRunner();
  await qr.connect();

  try {
    let sql = `
      SELECT
        i.patient_id,
        CONCAT(p.first_name,' ',p.last_name) AS name,
        i.date_admitted,
        i.expected_dis_date,
        i.bed_id,
        b.ward_id,
        w.ward_name
      FROM inpatient i
      JOIN patient p ON p.patient_id = i.patient_id
      JOIN bed     b ON b.bed_id     = i.bed_id
      JOIN ward    w ON w.ward_id    = b.ward_id
      WHERE 1=1
    `;

    const args: any[] = [];

    if (current) {
      sql += ` AND i.actual_dis_date IS NULL `;
    }

    // 🔹 กรองเฉพาะเมื่อ wardId > 0 (0 = ทั้งหมด)
    const wid = typeof wardId === 'string' ? Number(wardId) : wardId;
    if (Number.isFinite(wid) && wid! > 0) {
      sql += ` AND b.ward_id = ? `;
      args.push(wid);
    }

    const safeLimit = Math.min(Math.max(limit ?? 50, 1), 200);
    const safeOffset = Math.max(offset ?? 0, 0);

    sql += ` ORDER BY i.date_admitted DESC, i.patient_id DESC `;
    sql += ` LIMIT ? OFFSET ? `;
    args.push(safeLimit, safeOffset);

    const rows = await qr.query(sql, args);
    return rows;
  } finally {
    await qr.release();
  }
}

  async showBedLimit(){
    const result = this.dataSource.query(`
      
      `)
  }

  async tableBed() {
    try {
      const result = await this.dataSource.query(`
      SELECT 
        wl.waiting_list_id,
        wl.patient_id,
        CONCAT(p.first_name,' ',p.last_name) AS name,
        wl.ward_id,
        wl.date_added,
        wl.priority_level,
        wl.status
      FROM waiting_list wl
      JOIN patient p ON p.patient_id = wl.patient_id
      WHERE wl.status = 'admitted';
      `);

      return result;
    } catch (err) {
      console.error('🔥 SQL ERROR ', err);
      throw err;
    }

  }


  async getAvailableBeds(params: BedSearch) {
    const {
      wardId,
      fromWard = 1,
      toWard,
      limit = 200,
      offset = 0,
    } = params;

    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      let sql = `
        SELECT
          b.bed_id,
          b.ward_id,
          b.status
        FROM bed b
        JOIN ward w ON w.ward_id = b.ward_id
        WHERE b.status = 'available'
      `;
      const args: any[] = [];

      if (wardId && wardId > 0) {
        sql += ` AND b.ward_id = ?`;
        args.push(wardId);
      } else {
        // ไม่มี wardId ระบุ -> ใช้ช่วงตั้งแต่ fromWard (ดีฟอลต์ = 1)
        if (Number.isFinite(fromWard)) {
          sql += ` AND b.ward_id >= ?`;
          args.push(fromWard);
        }
        if (Number.isFinite(toWard)) {
          sql += ` AND b.ward_id <= ?`;
          args.push(toWard);
        }
      }

      const safeLimit = Math.min(Math.max(limit, 1), 500);
      const safeOffset = Math.max(offset, 0);

      sql += ` ORDER BY b.ward_id, b.bed_id`;
      sql += ` LIMIT ? OFFSET ?`;
      args.push(safeLimit, safeOffset);

      return await qr.query(sql, args);
    } finally {
      await qr.release();
    }
  }






}