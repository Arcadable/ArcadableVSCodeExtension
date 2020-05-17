import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';
import * as vscode from 'vscode';
import { Emulator } from './emulator';

let client: LanguageClient;
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	let serverOptions: ServerOptions = {
		run: {
			module: serverModule,
			transport: TransportKind.ipc
		},
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
	};

	client = new LanguageClient(
		'ArcadableServer',
		'Arcadable Server',
		serverOptions,
		clientOptions
	);

	client.start();

	const arcLog = vscode.window.createOutputChannel("Arcadable");

	const emulator = new Emulator(arcLog);
	let disposable = vscode.commands.registerCommand('arcadable-emulator.start', () => {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: vscode.ViewColumn.One;

		if (this.currentPanel) {
			this.currentPanel.reveal(columnToShowIn);
		} else {
			this.currentPanel = emulator.openEmulatorWindow(context, columnToShowIn);
		}
	});
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}


