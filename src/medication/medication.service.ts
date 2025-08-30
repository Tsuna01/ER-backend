import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MedicationService {
  constructor(private dataSource: DataSource) { }
  async createDrug(patient_id: number, item_id: number, prescribes_by: string, units_per_day: number, start_date: string, end_date: string): Promise<any> {
    const result = await this.dataSource.query(`
      INSERT INTO medication (
        patient_id,
        item_id,
        prescribes_by,
        units_per_day,
        start_date,
        end_date
      ) VALUES (?,?,?,?,?,?)
      `, [patient_id, item_id, prescribes_by, units_per_day, start_date, end_date])

    return result;
  }

  async showDatadrug() {
    const result = await this.dataSource.query(`
      SELECT 
          m.medication,
          m.patient_id,
          CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
          m.units_per_day,
          m.start_date,
          m.end_date
      FROM medication m
      LEFT JOIN patient p ON m.patient_id = p.patient_id;
      `)
    return result;
  }
}
