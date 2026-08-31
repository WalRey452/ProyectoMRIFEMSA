import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  // private transporter;

  constructor() {
    // this.transporter = nodemailer.createTransport({ ... });
  }

  async sendWelcomeEmail(user: any, temporaryPassword: string): Promise<void> {
    console.log(`Sending welcome email to ${user.email} with pass: ${temporaryPassword}`);
  }

  async sendPasswordExpiryWarning(user: any, daysUntilExpiry: number): Promise<void> {
    console.log(`Sending expiry warning to ${user.email}. Expira en: ${daysUntilExpiry} días`);
  }

  async sendPasswordChangedNotification(user: any): Promise<void> {
    console.log(`Sending password changed notification to ${user.email}`);
  }

  async sendPasswordResetEmail(user: any, resetToken: string): Promise<void> {
    console.log(`Sending password reset to ${user.email} con token: ${resetToken}`);
  }

  async sendIncidenteNotification(incidente: any, recipients: string[]): Promise<void> {
    console.log(`Sending incidente notif para ${incidente.codigoIncidente} a ${recipients.join(', ')}`);
  }
}
