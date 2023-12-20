import { SourceLanguageCode, TargetLanguageCode } from "deepl-node";
import { StringLiteral } from "../text_matching_provider";
import * as vscode from "vscode";
import DeeplApiManager from "../apis/deepl";
import { readFile } from "fs/promises";
import { appendFile } from "fs";
import { TranslationApi } from "../apis/translation_api";
import { getTranslationFilesAndLanguages, writeToTranslationFile } from "./translation_files";
import { modifyDocument } from "./modify_workspace";

async function showInputBox(value: String): Promise<string | undefined> {
    var title = `Translate '${value}'`;
    // cut off title at 30 chars
    if (title.length > 40) {
        title = title.substring(0, 40) + '...';
    }
    const translationKey = await vscode.window.showInputBox(
        {
            title: 'Translation Key', ignoreFocusOut: false, prompt: `Enter Translation Key for '${title}'`,
        }
    );
    if (translationKey === undefined) { return; }

    if (translationKey.length === 0 || translationKey.indexOf(' ') !== -1) {
        vscode.window.showErrorMessage('Translation key must not be empty or contain spaces');
        return;
    }

    return translationKey;
}

async function getTranslator(): Promise<TranslationApi> {
    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    const apiProvider = config.get<string>('apiProvider');

    if (apiProvider === 'DeepL') {
        return new DeeplApiManager();
    } else {
        throw new Error(`Unknown API Provider ${apiProvider}`);
    }
}

async function getLanguageCodes() {
    const config = vscode.workspace.getConfiguration('quick-i18n-gen');
    // const sourceLanguage = config.get<string>('sourceLanguage');
    const sourceLanguage = undefined; // automatic detection
    const translationFiles = config.get<string[]>('translationFiles') || {};
    const targetLanguages = Object.keys(translationFiles);

    if (targetLanguages === undefined || targetLanguages.length === 0) {
        throw new Error(`No target languages are set. Please go to settings and configure the target languages.`);
    }

    return { sourceLanguage, targetLanguages };
}

function getFilePathForLanguageCode(filePaths: { [key: string]: string }, languageCode: string) {
    // iterate over the filepath keys, and compare them to the language code
    for (const filePathLanguageCode of Object.keys(filePaths)) {
        if (filePathLanguageCode === languageCode) {
            return filePaths[filePathLanguageCode];
        }
    }

    // if no match is found, throw an error
    throw new Error(`No filepath found for language code ${languageCode}`);
}

export async function translateText(source: StringLiteral, document: vscode.TextDocument) {
    try {
        const translationKey = await showInputBox(source.value);

        if (translationKey === undefined) { return; }

        const translator = await getTranslator();

        const { sourceLanguage, targetLanguages } = await getLanguageCodes();

        const translations = await translator.translate(source.value, sourceLanguage, targetLanguages);

        const filePaths = await getTranslationFilesAndLanguages();

        const fileOperationPromises = targetLanguages.map((languageCode) => {
            const filePath = getFilePathForLanguageCode(filePaths, languageCode);
            return writeToTranslationFile(filePath, translationKey, translations[languageCode]);
        });

        await Promise.all(fileOperationPromises);

        // modify document
        await modifyDocument(source.range, translationKey, document);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        }
    }

}