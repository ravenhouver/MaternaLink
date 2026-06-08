import { QueueStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  patientId!: string;

  @IsString()
  pregnancyId!: string;
}

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus)
  status!: QueueStatus;

  @IsOptional()
  @IsString()
  assignedDoctor?: string;
}
