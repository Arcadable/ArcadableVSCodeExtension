import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');
import { Arcadable } from './model/arcadable';
import { SystemConfig } from './model/systemConfig';
import { Subscription } from 'rxjs';
import { ArcadableCompiler } from './compiler/arcadableCompiler';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let getPixelCallback: (color: number) => {};
let instructionSubscription: Subscription;
export function activate(context: vscode.ExtensionContext) {


	let disposable = vscode.commands.registerCommand('arcadable-emulator.start', () => {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (currentPanel) {
			currentPanel.reveal(columnToShowIn);
		} else {
			currentPanel = initExtensionLayout(context, columnToShowIn as vscode.ViewColumn);
			currentPanel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'getPixelResult':
							const color = message.color;
							getPixelCallback(color);
							return;
					}
				},
				undefined,
				context.subscriptions
			);

			currentPanel.onDidDispose(
				() => {
					currentPanel = undefined;
					instructionSubscription.unsubscribe();
				},
				null,
				context.subscriptions
			);
			currentPanel.onDidChangeViewState(
				e => {
					const visible = e.webviewPanel.visible;
				},
				null,
				context.subscriptions
			);

			vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
				if ((document.fileName.endsWith('.arc') || document.fileName.endsWith('arcadable.config.json')) && document.uri.scheme === "file") {
					loadGame();
				}
			});

			loadGame();
		}
	});
}
function loadGame() {
	const game = compile();
	if (game) {

		instructionSubscription = game.drawInstruction.subscribe((instruction: any) => {
			if (instruction.command = 'getPixel') {
				getPixelCallback = instruction.callback;
			}
			(currentPanel as vscode.WebviewPanel).webview.postMessage(instruction);
		});

		(currentPanel as vscode.WebviewPanel).webview.postMessage({
			command: 'setDimensions',
			width: game.systemConfig.screenWidth,
			height: game.systemConfig.screenHeight
		});

		console.log(game);
	}
}

function compile(): Arcadable | undefined {

	const configDoc = vscode.workspace.textDocuments.find(t => t.fileName == vscode.workspace.rootPath + '/arcadable.config.json');
	let config: {
		project: {
			name: string,
			version: string,
			main: string
		},
		system: {
			screenWidth: number,
			screenHeight: number,
			targetFramerate: number,
			digitalInputAmount: number,
			analogInputAmount: number
		}
	};
	if (configDoc) {
		config = JSON.parse(configDoc.getText());
		const configTest = checkConfig(config);
		if (configTest !== 'ok') {
			vscode.window.showErrorMessage(configTest)
			return undefined;
		}
	} else {
		vscode.window.showErrorMessage(`No config file found at path: "${vscode.workspace.rootPath}/arcadable.config.json"`)
		return undefined;
	}
	const mainPath = vscode.workspace.rootPath + (config as any).project.main;
	const mainDoc = vscode.workspace.textDocuments.find(t => t.fileName == mainPath);
	if (!mainDoc) {
		vscode.window.showErrorMessage(`No main file found at path: "${mainPath}"`);
		return undefined;
	}
	const docs = vscode.workspace.textDocuments.filter(t => t.fileName.endsWith('.arc')).reduce((acc, curr) => ({
		...acc,
		[curr.fileName]: curr.getText()
	}), {
		'main': mainDoc.getText()
	});

	const compileResult = new ArcadableCompiler(
		new SystemConfig(
			config.system.screenWidth,
			config.system.screenHeight,
			Math.floor(1000 / config.system.targetFramerate),
			false,
			config.system.digitalInputAmount,
			config.system.analogInputAmount,
			0
		),
		docs
	).startCompile();
	if (compileResult.errors?.length !== undefined && compileResult.errors?.length > 0) {
		compileResult.errors.forEach(e => {
			vscode.window.showErrorMessage(e);
		});
	}
	if (!compileResult.game) {
		vscode.window.showErrorMessage('Could not complete code compilation.');
		return undefined;
	}
	vscode.window.showInformationMessage('Arcadable compiled succesSfully!');

	return compileResult.game;
}

function checkConfig(config: any): string {
	let result = 'Config missing property: ';
	if (!config.project) {
		result = '"project", ';
	} else {
		if (!config.project.name) {
			result = '"project.name", ';
		}
		if (!config.project.version) {
			result = '"project.version", ';
		}
		if (!config.project.main) {
			result = '"project.main", ';
		}
	}

	if (!config.system) {
		result = '"system", ';
	} else {
		if (!config.system.screenWidth) {
			result = '"system.screenWidth", ';
		}
		if (!config.system.screenHeight) {
			result = '"system.screenHeight", ';
		}
		if (!config.system.targetFramerate) {
			result = '"system.targetFramerate", ';
		}
		if (!config.system.digitalInputAmount) {
			result = '"system.digitalInputAmount", ';
		}
		if (!config.system.analogInputAmount) {
			result = '"system.analogInputAmount", ';
		}
	}
	if (result === 'Config missing property: ') {
		result = 'ok';
	}
	return result;

}

function initExtensionLayout(context: vscode.ExtensionContext, columnToShowIn: vscode.ViewColumn) {

	currentPanel = vscode.window.createWebviewPanel(
		'ArcadableEmulator',
		'Arcadable Emulator',
		columnToShowIn as vscode.ViewColumn,
		{
			enableScripts: true
		}
	);

	const templateFilePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, 'src', 'html', 'index.html'));
	const styleSrcUrl = currentPanel.webview.asWebviewUri(
		vscode.Uri.file(
			path.join(context.extensionPath, 'src', 'css', 'style.css')
		)
	).toString();
	const scriptSrcUrl = currentPanel.webview.asWebviewUri(
		vscode.Uri.file(
			path.join(context.extensionPath, 'src', 'js', 'main.js')
		)
	).toString();
	currentPanel.webview.html = fs.readFileSync(templateFilePath.fsPath, 'utf8')
		.replace('{{styleSrc}}', styleSrcUrl)
		.replace('{{scriptSrc}}', scriptSrcUrl);

	return currentPanel;
}

