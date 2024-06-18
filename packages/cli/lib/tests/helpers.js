var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import fs from 'fs/promises';
export const copyDirectoryAndContents = (source, destination) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs.mkdir(destination, { recursive: true });
    const files = yield fs.readdir(source, { withFileTypes: true });
    for (const file of files) {
        const sourcePath = path.join(source, file.name);
        const destinationPath = path.join(destination, file.name);
        if (file.isDirectory()) {
            yield copyDirectoryAndContents(sourcePath, destinationPath);
        }
        else {
            yield fs.copyFile(sourcePath, destinationPath);
        }
    }
});
//# sourceMappingURL=helpers.js.map