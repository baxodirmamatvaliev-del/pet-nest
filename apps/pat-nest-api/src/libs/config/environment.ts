const DEFAULT_CLIENT_ORIGIN = 'http://localhost:3000';

export const getClientOrigins = (): string[] => {
  const origins = process.env.CLIENT_URLS
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return origins?.length ? origins : [DEFAULT_CLIENT_ORIGIN];
};

export const corsOriginHandler = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void => {
  if (!origin || getClientOrigins().includes(origin.replace(/\/$/, ''))) {
    callback(null, true);
    return;
  }

  callback(null, false);
};

export const validateEnvironment = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoKey = isProduction ? 'MONGO_PROD' : 'MONGO_DEV';
  const requiredKeys = ['SECRET_TOKEN', mongoKey];

  if (isProduction) requiredKeys.push('CLIENT_URLS');

  requiredKeys.forEach((key) => {
    if (!process.env[key]?.trim()) throw new Error(`${key} must be configured`);
  });

  const port = Number(process.env.PORT_API ?? 3002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT_API must be a valid port number');
  }
};
