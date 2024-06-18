declare class VerificationService {
    necessaryFilesExist({
        fullPath,
        autoConfirm,
        debug,
        checkDist
    }: {
        fullPath: string;
        autoConfirm: boolean;
        debug?: boolean;
        checkDist?: boolean;
    }): Promise<void>;
    filesMatchConfig({ fullPath }: { fullPath: string }): Promise<boolean>;
}
declare const verificationService: VerificationService;
export default verificationService;
