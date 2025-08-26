import { Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorService {
  create(createDoctorDto: CreateDoctorDto) {
    return 'This action adds a new doctor';
  }

  findAll() {
    return [
      { id: 1, name: 'Dr. John Doe', position: 'Cardiologist', department: 'Cardiology' },
      { id: 2, name: 'Dr. Jane Smith', position: 'Neurologist', department: 'Neurology' },
      { id: 3, name: 'Dr. Emily Johnson', position: 'Pediatrician', department: 'Pediatrics' },
      { id: 4, name: 'Dr. Michael Brown', position: 'Dermatologist', department: 'Dermatology' },
      { id: 5, name: 'Dr. Sarah Davis', position: 'Oncologist', department: 'Oncology' },


    ];
  }

  findOne(id: number) {
    return `This action returns a #${id} doctor`;
  }

  update(id: number, updateDoctorDto: UpdateDoctorDto) {
    return `This action updates a #${id} doctor`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctor`;
  }
}
