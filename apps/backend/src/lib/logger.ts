import { env } from "../env";

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

class Logger {
  #formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.#formatMessage(LogLevel.INFO, message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.#formatMessage(LogLevel.WARN, message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this.#formatMessage(LogLevel.ERROR, message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (env.NODE_ENV === "development") {
      console.debug(this.#formatMessage(LogLevel.DEBUG, message), ...args);
    }
  }
}

export const logger = new Logger();
