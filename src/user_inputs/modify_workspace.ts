import { Range } from "vscode";
import * as vscode from 'vscode';

export async function modifyDocument(range: Range, translationKey: string, document: vscode.TextDocument) {
    // get file settings
    const { translationKeyPattern, importStatement } = await getFileSpecificSettings(document.fileName);

    const edit = new vscode.WorkspaceEdit();

    // check if file already has import statement, but only if an import statement is configured
    if (importStatement !== undefined && !checkIfDocumentHasImportStatement(document, importStatement)) {
        // if it does add the import at the top of the file
        edit.insert(document.uri, new vscode.Position(0, 0), importStatement + '\n');
    }

    // replace the source text with the translation key
    const translationStatement = translationKeyPattern.replace('%%s%%', translationKey);
    edit.replace(document.uri, range, translationStatement);

    await vscode.workspace.applyEdit(edit);
}

async function getFileSpecificSettings(filepath: string) {
    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    const fileSpecificTranslationKeyPatterns = config.get<{ [key: string]: string }>('fileSpecificTranslationKeyPatterns') || {};
    const fileSpecificImportStatements = config.get<{ [key: string]: string }>('fileTypesForAutomaticImport') || {};

    const fileType = filepath.split('.').pop() || '';

    const translationKeyPattern = fileSpecificTranslationKeyPatterns[fileType];
    const importStatement = fileSpecificImportStatements[fileType];

    return { translationKeyPattern, importStatement };
}

function checkIfDocumentHasImportStatement(document: vscode.TextDocument, importStatement: string) {
    const fileText = document.getText();
    return fileText.includes(importStatement);
}