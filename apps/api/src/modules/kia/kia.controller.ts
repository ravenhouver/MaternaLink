import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { KiaOcrService } from './kia-ocr.service';

type UploadedKiaFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@ApiTags('kia')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS)
@Controller('kia')
export class KiaController {
  constructor(private readonly service: KiaOcrService) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Extract patient and pregnancy fields from a KIA book photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiResponse({ status: 201, description: 'KIA OCR extraction result returned' })
  extract(@UploadedFile() file: UploadedKiaFile) {
    return this.service.extract(file);
  }
}
