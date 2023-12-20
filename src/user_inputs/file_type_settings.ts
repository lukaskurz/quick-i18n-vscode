import * as vscode from 'vscode';

export async function configureFileTypeSettings(): Promise<void> {
    let fileType = await vscode.window.showInputBox(
        {
            title: 'File Type',
            ignoreFocusOut: false,
            prompt: `Enter file type ending (e.g., json, yaml) for which to configure settings`,
        }
    );
    if (fileType === undefined) { return; }
    if (fileType.startsWith('.')) {
        fileType = fileType.substring(1);
    }

    const translationKeyPattern = await vscode.window.showInputBox(
        {
            title: 'Translation Key Pattern',
            ignoreFocusOut: false,
            prompt: `Enter the translation key pattern with %%s%% as placeholder for the translation key`,
        }
    );
    if (translationKeyPattern === undefined) { return; }

    const needImportResponse = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        {
            placeHolder: 'Do you want to configure an import statement for this file type?',
            ignoreFocusOut: false,
        }
    );
    if (needImportResponse === undefined) { return; }

    let importStatement: string | undefined;
    if (needImportResponse === 'Yes') {
        importStatement = await vscode.window.showInputBox(
            {
                title: 'Import Statement',
                ignoreFocusOut: false,
                prompt: `Enter the import statement to use for the file type .${fileType}`,
            }
        );
        if (importStatement === undefined) { return; }
    }

    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    let importConfigs = config.get<{ [key: string]: string }>('fileTypesForAutomaticImport') || {};
    if (importStatement !== undefined) {
        importConfigs[fileType] = importStatement;
    }


    const fileSpecificPatterns = config.get<{ [key: string]: string }>('fileSpecificTranslationKeyPatterns') || {};
    fileSpecificPatterns[fileType] = translationKeyPattern;

    await config.update('fileTypesForAutomaticImport', importConfigs, true);
    await config.update('fileSpecificTranslationKeyPatterns', fileSpecificPatterns, true);
}


