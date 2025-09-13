import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SupplierService {
  constructor(private dataSource: DataSource) { }

  addSupplier(data: any) {
    try{
      const result = this.dataSource.query(`
      INSERT INTO supplier(
        supplier_name,
        address_line,
        phone,
        fax
      )VALUES(?,?,?,?)
      `,[data.supplier_name,data.address_line,data.phone,data.fax])

        return result;
    }catch(err){
      console.log('บันทึกข้อมูลไม่ได้ ',err);
    }

  }

  async createRequisition(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      const result: any = await queryRunner.query(
        `
        INSERT INTO requisition (ward_id, requested_by, approved_by, date_ordered)
        VALUES (?, ?, ?, ?)
      `,
        [data.ward_id, data.requested_by, data.approved_by, data.request_date],
      );

      // MySQL คืน insertId ออกมา
      const requisitionId = result.insertId;

      // 2) insert items
      for (const item of data.items) {
        await queryRunner.query(
          `
          INSERT INTO requisition_item (requisition_id, item_id, quantity, cost_per_unit)
          VALUES (?, ?, ?, ?)
        `,
          [requisitionId, item.item_id, item.quantity, item.unit_price],
        );
      }

      await queryRunner.commitTransaction();
      return { requisitionId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async tableRequisition() {
    try{
      const result = await this.dataSource.query(`
      SELECT t.item_id as id, 
      t.name, 
      r.ward_id,
      r.requested_by,
      r.approved_by,
      r.date_ordered
      FROM item as t , requisition as r,requisition_item as ri
      WHERE t.item_id = ri.item_id AND r.requisition_id = ri.requisition_id
      ORDER BY r.date_ordered DESC
     
    `);
    return result;
    }catch(err){
      console.log('ดึงข้อมูลไม่ได้ ',err);
    }
  }

  async tableItem() {
    try{
      const result = await this.dataSource.query(`
      SELECT item_id as id, 
      name, 
      item_type,
      quantity_in_stock,
      cost_per_unit
      FROM item 
    `);
    return result;
    }catch(err){
      console.log('ดึงข้อมูลไม่ได้ ',err);
    }
  }

  async tablePharma() {
    try{
      const result = await this.dataSource.query(`
      SELECT item_id as id, 
      name, 
      item_type,
      quantity_in_stock,
      cost_per_unit
      FROM item 
      WHERE item_type = 'pharmaceutical'
    `);
    return result;
    }catch(err){
      console.log('ดึงข้อมูลไม่ได้ ',err);
    }
  }
}
