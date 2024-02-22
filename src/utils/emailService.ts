import nodemailer from 'nodemailer';
import { ShardeumFlags } from '../shardeum/shardeumFlags';

class NotificationService {
    userPreferences;
    emailClient = undefined;
    receipient = "";
    
    constructor() {
        // Initialize other services if needed
        this.emailClient = this.initializeEmailClient();
        this.receipient = process.env.EMAIL_RECEIPIENT;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    initializeEmailClient() {
        // Check if all of the required env vars are set
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
            console.error("Email client not initialized. Missing required environment variables.");
            return;
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // SMTP Host
            port: parseInt(process.env.EMAIL_PORT), // SMTP Port 
            secure: false, // true for 465, false for other ports
        });
    }

    async sendEmailNotification(message: string, subject: string): Promise<void> {
        try {
            if (!this.emailClient) {
                throw new Error("Email client not initialized. Missing required environment variables.");
            }
            if (this.receipient === "") {
                throw new Error("No receipient email address provided.");
            }
            const info = await this.emailClient.sendMail({
                from: 'node@shardeum.org', // sender address
                to: this.receipient, // list of receivers
                subject: subject, // Subject line
                text: message, // plain text body
                // html: "<b>Hello world?</b>", // html body (optional)
            });

            if(ShardeumFlags.VerboseLogs) {
                console.log("Message sent: %s", info.messageId);
            }
        } catch (error) {
            console.error("Error sending email:", error);
        }
    }

    // ... methods for other platforms
}

export default NotificationService;