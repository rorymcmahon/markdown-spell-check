import * as vscode from 'vscode';
import { SpellChecker } from './spellChecker';
import { DiagnosticProvider } from './diagnosticProvider';

let diagnosticProvider: DiagnosticProvider;

export function activate(context: vscode.ExtensionContext) {
    const spellChecker = new SpellChecker(context);
    diagnosticProvider = new DiagnosticProvider(spellChecker);
    
    // Register for markdown files only
    const selector: vscode.DocumentSelector = { language: 'markdown', scheme: 'file' };
    
    // Register diagnostic provider
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(selector, diagnosticProvider),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.languageId === 'markdown') {
                diagnosticProvider.updateDiagnostics(e.document);
            }
        }),
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'markdown') {
                diagnosticProvider.updateDiagnostics(document);
            }
        })
    );

    // Check currently open markdown documents
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'markdown') {
            diagnosticProvider.updateDiagnostics(document);
        }
    });
}

export function deactivate() {
    if (diagnosticProvider) {
        diagnosticProvider.dispose();
    }
}
