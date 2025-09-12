import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryRunner } from 'typeorm';


@Injectable()
export class PatientService {
  constructor(private dataSource : DataSource){}

  async minList(q?: string) {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      let sql = `
        SELECT p.patient_id,
               CONCAT(p.first_name,' ',p.last_name) AS name
        FROM patient p
      `;
      const params: any[] = [];
      if (q) {
        sql += ` WHERE CONCAT(p.first_name,' ',p.last_name) LIKE ? `;
        params.push(`%${q}%`);
      }
      sql += ` ORDER BY p.patient_id DESC LIMIT 100`;
      return await qr.query(sql, params);
    } finally {
      await qr.release();
    }
  }
}
