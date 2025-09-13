import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

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

   async findInfoById(id: number) {
    const [row] = await this.dataSource.query(
      `
      SELECT
        m.medication_id       AS medId,
        m.patient_id          AS patientId,
        m.item_id             AS itemId,
        m.units_per_day       AS unitsPerDay,
        m.start_date          AS startDate,
        m.end_date            AS endDate,
        m.prescribed_by       AS prescribedBy,

        p.first_name          AS pFirst,
        p.last_name           AS pLast,
        p.date_registered     AS pRegDate,

        i.name                AS itemName,
        i.item_type           AS itemType,
        i.method              AS itemMethod,
        i.dosage              AS itemDosage,
        i.description         AS itemDesc,
        i.quantity_in_stock   AS stock,
        i.cost_per_unit       AS costPerUnit,
        i.supplier_id         AS supplierId,

        s.supplier_name       AS supplierName,
        s.address_line        AS supplierAddress,
        s.phone               AS supplierPhone,
        s.fax                 AS supplierFax,

        st.first_name         AS dFirst,
        st.last_name          AS dLast
      FROM medication m
      LEFT JOIN patient  p  ON p.patient_id   = m.patient_id
      LEFT JOIN item     i  ON i.item_id      = m.item_id
      LEFT JOIN supplier s  ON s.supplier_id  = i.supplier_id
      LEFT JOIN staff    st ON st.staff_id    = m.prescribed_by
      WHERE m.medication_id = ?
      `,
      [id],
    );

    if (!row) throw new NotFoundException('ไม่พบข้อมูลการจ่ายยานี้');

    return {
      id: row.medId,
      prescription: {
        patientId: row.patientId,
        unitsPerDay: row.unitsPerDay,
        startDate: row.startDate,
        endDate: row.endDate,
        prescribedBy: row.prescribedBy ?? null,
        prescriberName:
          [row.dFirst, row.dLast].filter(Boolean).join(' ') || null,
      },
      patient: {
        id: row.patientId,
        name: [row.pFirst, row.pLast].filter(Boolean).join(' ') || null,
        dateRegistered: row.pRegDate ?? null,
      },
      item: {
        id: row.itemId,
        name: row.itemName ?? null,
        type: row.itemType ?? null,
        method: row.itemMethod ?? null,
        dosage: row.itemDosage ?? null,
        description: row.itemDesc ?? null,
        stock: row.stock ?? null,
        costPerUnit: row.costPerUnit ?? null,
      },
      supplier: {
        id: row.supplierId ?? null,
        name: row.supplierName ?? null,
        address: row.supplierAddress ?? null,
        phone: row.supplierPhone ?? null,
        fax: row.supplierFax ?? null,
      },
    };
  }

  // (ออปชัน) ถ้าต้องการดูรายการยาของผู้ป่วยทั้งหมด
  async listByPatientId(patientId: number) {
    return this.dataSource.query(
      `
      SELECT
        m.medication_id AS id,
        m.units_per_day AS unitsPerDay,
        m.start_date    AS startDate,
        m.end_date      AS endDate,
        i.name          AS itemName
      FROM medication m
      LEFT JOIN item i ON i.item_id = m.item_id
      WHERE m.patient_id = ?
      ORDER BY m.start_date DESC, m.medication_id DESC
      `,
      [patientId],
    );
  }


  }
