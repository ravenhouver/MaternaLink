import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicineCategory, MedicineType, PuskesmasType, RainyAccess } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

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
}
