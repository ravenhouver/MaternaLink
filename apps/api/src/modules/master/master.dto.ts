import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { MedicineCategory, MedicineType, PuskesmasType, RainyAccess } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePuskesmasDto {
  @ApiProperty({ example: 'PKM-002' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Puskesmas Kotagede' })
  @IsString()
  nama!: string;

  @ApiProperty({ example: 'Kotagede' })
  @IsString()
  kecamatan!: string;

  @ApiPropertyOptional({ example: 'Kab. Manggarai' })
  @IsOptional()
  @IsString()
  kabupatenKota?: string;

  @ApiPropertyOptional({ example: 'NTT' })
  @IsOptional()
  @IsString()
  provinsi?: string;

  @ApiProperty({ enum: PuskesmasType })
  @IsEnum(PuskesmasType)
  tipe!: PuskesmasType;

  @ApiPropertyOptional({ enum: RainyAccess })
  @IsOptional()
  @IsEnum(RainyAccess)
  rainyAccess?: RainyAccess;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  coldChainReady?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  statusEndemisMalaria?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  ketersediaanLab?: boolean;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  kapasitasSimpanObat?: number;

  @ApiPropertyOptional({ example: 85.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  jarakKeIfkKm?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeHari?: number;

  @ApiPropertyOptional({ example: -7.8014 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 110.3916 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  skorAksesibilitas?: number;
}

export class CreateObatDto {
  @ApiProperty({ example: 'OBT-011' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Asam Folat' })
  @IsString()
  nama!: string;

  @ApiProperty({ enum: MedicineCategory })
  @IsEnum(MedicineCategory)
  kategori!: MedicineCategory;

  @ApiProperty({ enum: MedicineType })
  @IsEnum(MedicineType)
  tipe!: MedicineType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  perluColdChain?: boolean;

  @ApiProperty({ example: 'tablet' })
  @IsString()
  satuan!: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dosisStandarHarian?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durasiPengobatanHari?: number;
}

export class UpdatePuskesmasDto extends PartialType(CreatePuskesmasDto) {}

export class UpdateObatDto extends PartialType(CreateObatDto) {}
