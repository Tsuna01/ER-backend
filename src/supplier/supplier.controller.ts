import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SupplierService } from './supplier.service';


@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post('/SupplierForm')
  addSupplier(@Body() data:any ){
    return this.supplierService.addSupplier(data)
  }

  @Post('/NumericInput')
  async create(@Body() body: any) {
    return this.supplierService.createRequisition(body);
  }
}
