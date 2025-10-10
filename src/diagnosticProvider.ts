import * as vscode from 'vscode';
import { SpellChecker } from './spellChecker';
import { MarkdownFormatter } from './markdownFormatter';

export class DiagnosticProvider implements vscode.CodeActionProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private spellChecker: SpellChecker;
    private markdownFormatter: MarkdownFormatter;

    constructor(spellChecker: SpellChecker) {
        this.spellChecker = spellChecker;
        this.markdownFormatter = new MarkdownFormatter();
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('markdownSpellCheck');
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        const config = vscode.workspace.getConfiguration('markdownSpellCheck');
        const spellCheckEnabled = config.get('enabled', true);
        const formattingEnabled = config.get('formatting.enabled', true);
        
        if (!spellCheckEnabled && !formattingEnabled) {
            this.diagnosticCollection.delete(document.uri);
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        
        // Add spell checking diagnostics
        if (spellCheckEnabled) {
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
        }
        
        // Add formatting diagnostics
        if (formattingEnabled) {
            const formattingIssues = this.markdownFormatter.checkFormatting(document);
            
            for (const issue of formattingIssues) {
                const diagnostic = new vscode.Diagnostic(
                    issue.range,
                    issue.message,
                    issue.severity
                );
                diagnostic.source = 'Markdown Formatting';
                diagnostic.code = issue.code;
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
                // Spell check actions
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
            } else if (diagnostic.source === 'Markdown Formatting') {
                // Formatting actions
                const formattingIssues = this.markdownFormatter.checkFormatting(document);
                const issue = formattingIssues.find(i => 
                    i.range.isEqual(diagnostic.range) && i.code === diagnostic.code
                );
                
                if (issue) {
                    if (issue.fix) {
                        // Direct text replacement
                        const action = new vscode.CodeAction(
                            'Fix formatting',
                            vscode.CodeActionKind.QuickFix
                        );
                        action.edit = new vscode.WorkspaceEdit();
                        action.edit.replace(document.uri, diagnostic.range, issue.fix);
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    } else {
                        // Blank line actions
                        if (issue.code.includes('blank-line')) {
                            const action = new vscode.CodeAction(
                                'Add blank line',
                                vscode.CodeActionKind.QuickFix
                            );
                            action.edit = new vscode.WorkspaceEdit();
                            
                            if (issue.code.includes('before')) {
                                action.edit.insert(document.uri, diagnostic.range.start, '\n');
                            } else if (issue.code.includes('after')) {
                                const lineEnd = new vscode.Position(diagnostic.range.start.line, document.lineAt(diagnostic.range.start.line).text.length);
                                action.edit.insert(document.uri, lineEnd, '\n');
                            }
                            
                            action.diagnostics = [diagnostic];
                            actions.push(action);
                        } else if (issue.code === 'multiple-blank-lines') {
                            const action = new vscode.CodeAction(
                                'Remove extra blank lines',
                                vscode.CodeActionKind.QuickFix
                            );
                            action.edit = new vscode.WorkspaceEdit();
                            action.edit.delete(document.uri, diagnostic.range);
                            action.diagnostics = [diagnostic];
                            actions.push(action);
                        }
                    }
                }
            }
        }

        return actions;
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
