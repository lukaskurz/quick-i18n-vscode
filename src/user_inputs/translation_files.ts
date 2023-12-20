import * as vscode from "vscode";
import * as fs from "fs/promises";

export async function selectTranslationFilesWithLanguages() {
    const fileUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true, // Allow multiple file selection
        openLabel: 'Select Translation Files',
        filters: {
            'Translation Files': ['arb'],
        },
        title: 'Select Translation Files',
    });

    if (!fileUris || fileUris.length === 0) {
        return; // User canceled the file selection
    }

    // Ask for language codes for each selected file
    const languageCodes: { [key: string]: string } = {};

    for (const fileUri of fileUris) {
        const languageCode = await vscode.window.showInputBox({
            prompt: `Enter a language code for ${fileUri.fsPath}:`,
        });

        if (!languageCode) {
            vscode.window.showWarningMessage(`Language code not provided for ${fileUri.fsPath}. Skipping.`);
            continue;
        }

        languageCodes[fileUri.fsPath] = languageCode;
    }

    // Store the selected files and their language codes
    await setTranslationFilesAndLanguages(fileUris, languageCodes);
}

async function setTranslationFilesAndLanguages(
    fileUris: vscode.Uri[],
    languageCodes: { [key: string]: string }
) {
    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    const translationFiles: { [key: string]: string } = {};

    for (const fileUri of fileUris) {
        const lc = languageCodes[fileUri.fsPath];
        translationFiles[lc] = fileUri.fsPath;
    }

    await config.update(`translationFiles`, translationFiles, true);

    let message = 'Translation Files and Language Codes set:\n';

    for (const fileUri of fileUris) {
        message += `${fileUri.fsPath} - Language Code: ${languageCodes[fileUri.fsPath]}\n`;
    }

    vscode.window.showInformationMessage(message);
}

export async function getTranslationFilesAndLanguages() {
    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    const translationFiles = config.get<{ [key: string]: string }>('translationFiles');

    if (!translationFiles) {
        throw new Error('No Translation Files set. Please go to settings and configure the translation files.');
    }

    return translationFiles;
}

export async function writeToTranslationFile(filePath: string, translationKey: string, translationValue: string) {
    if (filePath.endsWith('.arb')) {
        const file = await fs.readFile(filePath, 'utf8');

        const data = JSON.parse(file);

        if (data[translationKey]) {
            throw new Error(`Translation Key '${translationKey}' already exists in the file`);
        }

        data[translationKey] = translationValue;

        const updatedData = JSON.stringify(data, null, 2);

        await fs.writeFile(filePath, updatedData);
    } else {
        throw new Error(`Unknown Translation File Type ${filePath.split('.').pop()}`);
    }
}