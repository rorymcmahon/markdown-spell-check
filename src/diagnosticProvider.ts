import * as vscode from 'vscode';
import { SpellChecker } from './spellChecker';

export class DiagnosticProvider implements vscode.CodeActionProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private spellChecker: SpellChecker;

    constructor(spellChecker: SpellChecker) {
        this.spellChecker = spellChecker;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('markdownSpellCheck');
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        const config = vscode.workspace.getConfiguration('markdownSpellCheck');
        if (!config.get('enabled', true)) {
            this.diagnosticCollection.delete(document.uri);
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const words = this.spellChecker.extractWords(text);

        for (const wordInfo of words) {
            if (!this.spellChecker.checkWord(wordInfo.word)) {
                const range = new vscode.Range(
                    document.positionAt(wordInfo.start),
                    document.positionAt(wordInfo.end)
                );

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Spelling: "${wordInfo.word}" is not recognized`,
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.source = 'Markdown Spell Check';
                diagnostic.code = 'spelling-error';
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source === 'Markdown Spell Check') {
                const word = document.getText(diagnostic.range);
                const suggestions = this.spellChecker.getSuggestions(word);

                for (const suggestion of suggestions) {
                    const action = new vscode.CodeAction(
                        `Replace with "${suggestion}"`,
                        vscode.CodeActionKind.QuickFix
                    );
                    action.edit = new vscode.WorkspaceEdit();
                    action.edit.replace(document.uri, diagnostic.range, suggestion);
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }

                // Add "Add to dictionary" action (placeholder for now)
                const addToDictAction = new vscode.CodeAction(
                    `Add "${word}" to dictionary`,
                    vscode.CodeActionKind.QuickFix
                );
                addToDictAction.command = {
                    command: 'markdownSpellCheck.addToDict',
                    title: 'Add to dictionary',
                    arguments: [word]
                };
                actions.push(addToDictAction);
            }
        }

        return actions;
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
