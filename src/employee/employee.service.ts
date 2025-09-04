import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class EmployeeService {
  constructor(private dataSource: DataSource) { }

  async registerPatient(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Insert doctor 
      const doctorResult = await queryRunner.query(
        `INSERT INTO local_doctor (doctor_name, lo_last_name, lo_address_line, lo_phone)
       VALUES (?, ?, ?, ?)`,
        [
          data.doctor.doctor_name,
          data.doctor.lo_last_name,
          data.doctor.lo_address_line,
          data.doctor.lo_phone,
        ],
      );

      const clinicNo = doctorResult.insertId;

      // Insert patient (อ้างอิง clinic_no)
      const patientResult = await queryRunner.query(
        `INSERT INTO patient (first_name, last_name, date_of_birth, gender, address_line, phone, date_registered, clinic_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.patient.first_name,
          data.patient.last_name,
          data.patient.date_of_birth,
          data.patient.gender,
          data.patient.address_line,
          data.patient.phone,
          data.patient.date_registered,
          clinicNo,
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
      return { success: true, patientId, clinicNo };
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
      LEFT JOIN appointment AS a ON p.patient_id = a.patient_id
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






}