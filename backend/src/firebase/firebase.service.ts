import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log(
          `Firebase Admin SDK initialized for project: ${projectId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      // В режиме разработки не блокируем запуск, если ключи фейковые
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string | number | boolean>,
  ) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase App not initialized. Skipping push.');
      return;
    }

    try {
      const message: admin.messaging.Message = {
        notification: { title, body },
        token,
        data: this.serializeData(data),
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent push: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending push notification', error);
    }
  }

  private serializeData(data?: Record<string, string | number | boolean>) {
    if (!data) return {};

    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  }
}
