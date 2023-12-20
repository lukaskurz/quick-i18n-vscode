export abstract class TranslationApi {
    abstract registerApiKey(apiKey: string): Promise<boolean>;
    abstract translate(text: string, sourceLanguage: string | undefined, targetLanguages: string[]): Promise<{ [key: string]: string }>;
}
