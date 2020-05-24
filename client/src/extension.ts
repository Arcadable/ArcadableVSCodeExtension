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

export function activate(context: ExtensionContext) {
	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	let emulator: Emulator;

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

	emulator = new Emulator(arcLog);
	let disposable = vscode.commands.registerCommand('arcadable-emulator.start', () => {
		if (currentPanel && !(currentPanel as any)._store._isDisposed) {
			currentPanel.reveal(vscode.ViewColumn.Beside);
		} else {
			currentPanel = emulator.openEmulatorWindow(context, vscode.ViewColumn.Beside);
		}

		currentPanel.onDidDispose(() => {
			if(emulator.compileResult.game) {
				emulator.compileResult.game.stop();
			}
			currentPanel = null;
		});
	});
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}


