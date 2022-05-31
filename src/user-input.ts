import { SourceLanguageCode, TargetLanguageCode } from "deepl-node";
import { appendFile } from "fs";
import { readFile } from "fs/promises";
import * as vscode from "vscode";
import DeeplApiManager from "./deepl";

export default class UserInputs {
    static async registerApi() {
        const apiProviders = ['DeepL'];
        const choice = await vscode.window.showQuickPick(
            apiProviders,
            {
                placeHolder: 'Select API Provider', ignoreFocusOut: true, title: 'API Provider'
            }
        );
        if (choice === undefined) { return; } // user cancelled
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const apiProvider = choice;
        await config.update(`apiProvider`, apiProvider, true);

        if (apiProvider === 'DeepL') {
            const apiKey = await vscode.window.showInputBox(
                {
                    title: 'API Key', ignoreFocusOut: true, prompt: `Enter API Key for ${apiProvider}`,
                }
            );
            if (apiKey === undefined || apiKey.length === 0) { return; }
            // save apiKey in configuration
            const isApiKeyValid = await new DeeplApiManager(apiKey).testApiKey();
            if (isApiKeyValid) {
                await config.update(`deepl.apiKey`, apiKey, true);
                vscode.window.showInformationMessage(`API Key for ${apiProvider} is valid`);
            } else {
                vscode.window.showErrorMessage(`Invalid API Key for ${apiProvider}`);
            }
        } else {
            vscode.window.showErrorMessage(`Unknown API Provider ${apiProvider}`);
        }

    }
    static async selectTranslationFile() {
        const filePath = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Translation File',
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Translation File': ['csv'],
            },
            title: 'Select Translation File',
        });
        if (filePath === undefined) { return; }
        await UserInputs.setTranslationFile(filePath[0]);
    }

    static async setTranslationFile(url: vscode.Uri) {
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const translationFilePath = url.fsPath;
        await config.update(`translationFilePath`, translationFilePath, true);
        vscode.window.showInformationMessage(`Translation File Path is set to ${translationFilePath}`);
    }

    static async translateText(source: StringLiteral, document: vscode.TextDocument) {
        const translationKey = await vscode.window.showInputBox(
            {
                title: 'Translation Key', ignoreFocusOut: false, prompt: `Enter Translation Key for ${source.value}`,
            }
        );
        if (translationKey === undefined) { return; }
        const config = vscode.workspace.getConfiguration('quick-i18n-gen');
        const apiProvider = config.get<string>('apiProvider');

        var translations: string[] = [];
        if (apiProvider === 'DeepL') {
            const sourceLanguage = config.get<SourceLanguageCode>('deepl.sourceLanguage');
            const targetLanguages = config.get<TargetLanguageCode[]>('deepl.targetLanguages');

            if (targetLanguages === undefined || targetLanguages.length === 0) {
                vscode.window.showErrorMessage(`No target languages are set. Please go to settings and configure the target languages.`);
                return;
            }

            const apiKey = config.get<string>('deepl.apiKey');
            if (apiKey === undefined || apiKey.length === 0) {
                vscode.window.showErrorMessage(`No API Key is set`);
                vscode.commands.executeCommand("quick-i18n-gen.registerApi")
                return;
            }

            const deeplApiManager = new DeeplApiManager(apiKey);
            translations = await deeplApiManager.translate(source.value, sourceLanguage ?? null, targetLanguages);
        }

        var filePath = config.get<string>('translationFilePath');
        if (filePath == null || filePath.length === 0) {
            vscode.window.showErrorMessage(`Translation File Path is not set`);
            vscode.commands.executeCommand("quick-i18n-gen.selectTranslationFile");
            return;
        }

        const fileType = config.get<string>('translationFileType');
        if (fileType === undefined) {
            vscode.window.showErrorMessage(`Translation File Type is not set`);
            return;
        } else if (fileType.toLowerCase() === 'csv') {
            const separator = config.get<string>('csv.separator') ?? ',';
            const quote = config.get<string>('csv.quote') ?? '"';
            const escape = config.get<string>('csv.escape') ?? '\\';
            const header = config.get<boolean>('csv.header') ?? true;
            const allowDuplicates = config.get<boolean>('csv.allowDuplicates') ?? true;

            const fileText = await readFile(filePath, 'utf8');
            const fileLines = fileText.split('\n');
            var duplicateFound = false;
            for (let i = header ? 1 : 0; i < fileLines.length; i++) {
                const line = fileLines[i];
                const elements = line.split(separator)
                if (elements[0] == translationKey) {
                    vscode.window.showErrorMessage(`Translation Key '${translationKey}' already exists in the file at line ${i}`);
                    return;
                }
                if (elements.slice(1).some((element) => element == source.value) && !duplicateFound) {
                    duplicateFound = true;
                    vscode.window.showWarningMessage(`Source Text '${source.value}' already exists in the file at line ${i}`);
                    if (!allowDuplicates) {
                        return;
                    }
                }
            }

            const escapedTranslations = translations
                .map((translation) => quote + translation.replace(new RegExp(quote, 'g'), `${escape}${quote}`,) + quote)

            const entry = [translationKey, ...escapedTranslations].join(separator);

            appendFile(filePath, `${entry}\n`, { encoding: "utf8" }, (err) => { });
        } else {
            vscode.window.showErrorMessage(`Unknown Translation File Type ${fileType}`);
            return;
        }

        // edit document
        const edit = new vscode.WorkspaceEdit();
        var replacementString = config.get<string>('replacementString') ?? 'I18n.{token}';
        replacementString = replacementString.replace('{token}', translationKey);
        edit.replace(document.uri, source.range, replacementString);
        await vscode.workspace.applyEdit(edit);
    }
}

interface StringLiteral {
    value: string;
    range: vscode.Range;
}

export class QuickFixTranslationProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const stringLiteralsRegex = /(?<!\\)(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g; // "(\\.|[^"\\])*"
        const text = document.getText()
        const stringLiterals: StringLiteral[] = [];
        let match: RegExpExecArray | null;
        while (match = stringLiteralsRegex.exec(text)) {
            const stringLiteral = match[0];
            const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + stringLiteral.length));
            stringLiterals.push({ value: stringLiteral.slice(1, -1), range });
        }

        const codeActions: vscode.CodeAction[] = stringLiterals.filter(stringLiteral => stringLiteral.range.contains(range)).map(stringLiteral => {
            var title = `Translate '${stringLiteral.value}'`;
            // cut off title at 30 chars
            if (title.length > 40) {
                title = title.substring(0, 40) + '...';
            }
            const codeAction = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
            codeAction.command = {
                command: 'quick-i18n-gen.translateText',
                title: title,
                arguments: [stringLiteral, document],
            };
            return codeAction;
        });

        return codeActions;
    }
}