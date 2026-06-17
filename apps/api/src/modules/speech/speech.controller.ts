import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { SpeechService } from './speech.service';

type UploadedAudioFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@ApiTags('speech')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS)
@Controller('speech')
export class SpeechController {
  constructor(private readonly service: SpeechService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Transcribe an examination voice recording and return review draft fields' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiResponse({ status: 201, description: 'Speech transcript and draft returned' })
  transcribe(@UploadedFile() file: UploadedAudioFile) {
    return this.service.transcribe(file);
  }
}
