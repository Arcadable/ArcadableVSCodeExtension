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
let connection: IConnection = createConnection(process.stdin, process.stdout);
connection.console.log("arc - Open server.js");

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	connection.console.log("arc - connection.onInitialize");

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
	connection.console.log("arc - hasConfigurationCapability " + hasConfigurationCapability);
	connection.console.log("arc - hasWorkspaceFolderCapability " + hasWorkspaceFolderCapability);
	connection.console.log("arc - hasDiagnosticRelatedInformationCapability " + hasDiagnosticRelatedInformationCapability);

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
	connection.console.log("arc - connection.onInitialized");

	if (hasConfigurationCapability) {
		connection.console.log("arc - if hasConfigurationCapability");

		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.console.log("arc - if hasWorkspaceFolderCapability");

		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log("arc - connection.workspace.onDidChangeWorkspaceFolders");

			connection.console.log('Workspace folder change event received.');
		});
	}
});


documents.onDidChangeContent(change => {
	connection.console.log("arc - documents.onDidChangeContent");

	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	connection.console.log("arc - validateTextDocument");

	let diagnostics: Diagnostic[] = [];
	const data = new ArcadableParser().parse(textDocument.uri, textDocument.getText().split(/\n/g));
	connection.console.log(JSON.stringify(data));

	const functionParseResultExecutables = {
		file: data.filePath,
		executables: data.functionParseResults
	};


	functionParseResultExecutables.executables.forEach(executable => {
		connection.console.log("arc - functionParseResultExecutables.executables.forEach");

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
	connection.console.log(JSON.stringify(diagnostics));

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		connection.console.log("arc - connection.onCompletion");

		return [
			...valueTypes.filter(v => !!v.codeValue).map(v => ({label: v.codeValue as string, detail: v.viewValue, data: v.value, kind: CompletionItemKind.TypeParameter})),
			...instructionTypes.map(i => ({label: i.codeValue as string, detail: i.viewValue, data: i.value, kind: CompletionItemKind.Function}))
		];
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		connection.console.log("arc - connection.onCompletionResolve");

		return item;
	}
);

documents.listen(connection);
connection.listen();
