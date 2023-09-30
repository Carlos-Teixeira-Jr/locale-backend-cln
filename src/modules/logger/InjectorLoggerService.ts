import { Inject, Provider } from '@nestjs/common'
import { LoggerService } from './logger.service'

const decoratedTokenPrefix = 'LoggerService:'

const decoratedLoggers = new Set<string>()

export function InjectorLoggerService(context: string) {
  decoratedLoggers.add(context)
  return Inject(getLoggerToken(context))
}

function createDecoratedLoggerProvider(
  context: string,
): Provider<LoggerService> {
  return {
    provide: getLoggerToken(context),
    useFactory: (logger: LoggerService) => {
      logger.setContext(context)
      return logger
    },
    inject: [LoggerService],
  }
}

export function createProvidersForDecorated(): Array<Provider<LoggerService>> {
  return [...decoratedLoggers.values()].map(context =>
    createDecoratedLoggerProvider(context),
  )
}

export function getLoggerToken(context: string): string {
  return `${decoratedTokenPrefix}${context}`
}
