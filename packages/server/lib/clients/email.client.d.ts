declare class EmailClient {
    private static instance;
    private client;
    private constructor();
    static getInstance(): EmailClient;
    send(email: string, subject: string, html: string): any;
}
export default EmailClient;
