export const environment = {
  production: false,
  apiUrl: '/api/v1',
  appName: 'Registro MRI',
  appVersion: '2.0.0',
  organization: 'FEMSA Salud',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip', 'text/plain'],
  passwordExpiryDays: 60,
  passwordExpiryWarningDays: 7,
};
