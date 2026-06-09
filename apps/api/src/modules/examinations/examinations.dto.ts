import { PartialType } from '@nestjs/mapped-types';
import { ExaminationSource } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class ExaminationDiagnosisDto {
  @IsString()
  kondisiId!: string;

  @IsInt()
  jumlahKasus!: number;
}

export class ExaminationSymptomDto {
  @IsString()
  gejalaId!: string;

  @IsInt()
  jumlah!: number;
}

export class ExaminationMedicationDto {
  @IsString()
  obatId!: string;

  @IsInt()
  quantity!: number;
}

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  queueId?: string;

  @IsString()
  patientId!: string;

  @IsString()
  pregnancyId!: string;

  @IsOptional()
  @IsEnum(ExaminationSource)
  source?: ExaminationSource;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsInt()
  gestationalAge?: number;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsArray()
  diagnosis?: ExaminationDiagnosisDto[];

  @IsOptional()
  @IsArray()
  symptoms?: ExaminationSymptomDto[];

  @IsOptional()
  @IsArray()
  medication?: ExaminationMedicationDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExaminationDto extends PartialType(CreateExaminationDto) {}
