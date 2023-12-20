import * as vscode from "vscode";


export interface StringLiteral {
    value: string;
    range: vscode.Range;
}

export class QuickFixTranslationProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        let stringLiteral: StringLiteral | null = null;
        if (range.start.line == range.end.line && range.start.character == range.end.character) {
            // Cursor mode

            // pick current line
            const selection = document.lineAt(range.start.line).text;

            const stringLiteralsRegex = /(['"])(?:(?!\1)[^\\]|\\.)*\1/g;
            let match: RegExpExecArray | null;

            while (match = stringLiteralsRegex.exec(selection)) {
                const matchTextValue = match[0];

                // get matchRange 
                const matchRange = new vscode.Range(
                    new vscode.Position(range.start.line, match.index),
                    new vscode.Position(range.start.line, match.index + matchTextValue.length)
                );

                if (matchRange.end.isBeforeOrEqual(range.start)) {
                    // before selection
                    continue;
                } else if (matchRange.start.isAfterOrEqual(range.end)) {
                    // after selection
                    break;
                }

                if (matchRange.contains(range)) {
                    // fits in selection -> only one possible match anyways
                    // cut off string literal quotes
                    stringLiteral = { value: matchTextValue.slice(1, -1), range }
                    break;
                }
            }
        } else {
            // Selection mode

            // get selected text
            const selection = document.getText(range);

            // check if selection is a string literal or just text like in a html tag
            if (
                (selection.startsWith('"') && selection.endsWith('"')) ||
                (selection.startsWith("'") && selection.endsWith("'"))
            ) {
                stringLiteral = { value: selection.slice(1, -1), range };
            } else {
                stringLiteral = { value: selection, range };
            }
        }

        if (stringLiteral == null) {
            // no string literal found
            return;
        }

        console.log(JSON.stringify(stringLiteral));

        var title = `Translate '${stringLiteral.value}'`;
        // cut off title at 30 chars
        if (title.length > 30) {
            title = title.substring(0, 30) + '...';
        }
        const codeAction = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        codeAction.command = {
            command: 'quick-i18n-gen.translateText',
            title: title,
            arguments: [stringLiteral, document],
        };

        return [codeAction];
    }
}