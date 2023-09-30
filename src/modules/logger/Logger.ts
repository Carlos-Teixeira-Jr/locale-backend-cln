import { Injectable, LoggerService as ILoggerService } from '@nestjs/common'
import { Logger as Log } from '@nestjs/common'

@Injectable()
export class Logger implements ILoggerService {
  protected context?: string

  error(err: any, subContext?: string, trace?: string): void {
    Log.error(err, this.subContextOrDefaultMessage(subContext, trace))
  }

  log(log: any, subContext?: string): void {
    Log.log(log, this.subContextOrDefaultMessage(subContext, 'log logger'))
  }

  info(log: any, subContext?: string): void {
    Log.log(log, this.subContextOrDefaultMessage(subContext, 'info logger'))
  }

  warn(log: any, subContext?: string): void {
    Log.warn(log, this.subContextOrDefaultMessage(subContext, 'warn logger'))
  }

  debug(log: any, subContext?: string): void {
    Log.debug(log, this.subContextOrDefaultMessage(subContext, 'debug logger'))
  }

  subContextOrDefaultMessage(
    subContext: string,
    defaultMessage: string,
  ): string {
    return subContext ? `${this.context} > ${subContext}` : defaultMessage
  }

  setContext(context: string): void {
    this.context = context
  }
}
