import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	IConnection
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { ArcadableParser, valueTypes, instructionTypes, ParsedFile, FunctionParseResult, ValueParseResult } from 'arcadable-shared/';
let connection: IConnection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {

	let capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {

	if (hasConfigurationCapability) {

		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {

		connection.workspace.onDidChangeWorkspaceFolders(_event => {

		});
	}
});


documents.onDidChangeContent(change => {

	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {

	let diagnostics: Diagnostic[] = [];
	const data = new ArcadableParser().parse(textDocument.uri, textDocument.getText().split(/\n/g));

	const functionParseResultExecutables = {
		file: data.filePath,
		executables: data.functionParseResults
	};


	functionParseResultExecutables.executables.forEach(executable => {

		const functions = executable();

		data.errors.push(
			...functions
				.reduce((acc, curr) => [...acc, ...curr.errors.map(err => ({
					file: functionParseResultExecutables.file,
					line: err.line,
					pos: err.pos,
					error: err.error
				}))], [] as {
				file: string;
				line: number;
				pos: number;
				error: string;
			}[])
		);
	});

	data.errors.forEach(e => {

		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: {line: e.line-1, character: e.pos},
				end: {line: e.line-1, character: e.pos}
			},
			message: e.error,
			source: 'arc'
		};
		diagnostics.push(diagnostic);
	});

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {

		return [
			...valueTypes.filter(v => !!v.codeValue).map(v => ({label: v.codeValue as string, detail: v.viewValue, data: v.value, kind: CompletionItemKind.TypeParameter})),
			...instructionTypes.map(i => ({label: i.codeValue as string, detail: i.viewValue, data: i.value, kind: CompletionItemKind.Function}))
		];
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {

		return item;
	}
);

documents.listen(connection);
connection.listen();
