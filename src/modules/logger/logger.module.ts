import { Global, Module } from '@nestjs/common'
import { createProvidersForDecorated } from './InjectorLoggerService'
import { Logger } from './Logger'
import { LoggerService } from './logger.service'

@Global()
@Module({
  providers: [Logger, LoggerService],
  exports: [Logger, LoggerService],
})
export class LoggerModule {
  static forRoot() {
    const decorated = createProvidersForDecorated()
    return {
      module: LoggerModule,
      providers: [Logger, LoggerService, ...decorated],
      exports: [Logger, LoggerService, ...decorated],
    }
  }
}
