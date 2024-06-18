import { SyncConfigType } from '@nangohq/shared';
declare class ParserService {
    getImportedFiles(filePath: string): string[];
    callsAreUsedCorrectly(filePath: string, type: SyncConfigType, modelNames: string[]): boolean;
}
declare const parserService: ParserService;
export default parserService;
