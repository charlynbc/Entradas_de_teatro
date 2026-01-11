/**
 * Logger simple con emojis para facilitar lectura
 * Fácilmente migrable a winston/pino si se necesita después
 */

export const logger = {
  info: (msg, ...args) => console.log('ℹ️ ', msg, ...args),
  success: (msg, ...args) => console.log('✅', msg, ...args),
  error: (msg, ...args) => console.error('❌', msg, ...args),
  warn: (msg, ...args) => console.warn('⚠️ ', msg, ...args),
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍', msg, ...args);
    }
  }
};
