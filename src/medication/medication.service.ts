import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MedicationService {
  constructor(private dataSource: DataSource) { }

  async createDrug(
    patient_id: number,
    item_id: number,
    prescribed_by: string,
    units_per_day: number,
    start_date: string,
    end_date: string,
  ) {
    // ตรวจสอบข้อมูลก่อน
    if (
      !patient_id ||
      !item_id ||
      !prescribed_by ||
      !units_per_day ||
      !start_date ||
      !end_date
    ) {
      throw new Error('Missing required fields');
    }

    const result = await this.dataSource.query(
      `
    INSERT INTO medication (
      patient_id,
      item_id,
      prescribed_by,
      units_per_day,
      start_date,
      end_date
    ) VALUES (?, ?, ?, ?, ?, ?)
    `,
      [patient_id, item_id, prescribed_by, units_per_day, start_date, end_date],
    );

    return { success: true, insertId: result.insertId };
  }

  async fulluser() {


    try{
      const user = await this.dataSource.query(
        `SELECT m.medication_id, m.patient_id, 
                CONCAT(p.first_name, ' ', p.last_name) AS name, 
                i.name as item_name, m.units_per_day, m.start_date, 
                m.end_date, 
                CONCAT(s.first_name, ' ', s.last_name) AS prescribed_by 
         FROM medication as m,
                patient as p,
                staff as s ,
                item as i
         WHERE s.staff_id = m.prescribed_by AND m.patient_id = p.patient_id AND m.item_id = i.item_id;
  
        `
      );
      return user;
    }catch (err) {
      console.error('❌ SQL Error:', err);
      throw err;
    }
  }


  }
