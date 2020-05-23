import * as vscode from 'vscode';
import { Subscription } from 'rxjs';
import { Arcadable, SystemConfig } from 'arcadable-shared/';
import path = require('path');
import fs = require('fs');
import { ArcadableCompiler, CompileResult } from './compiler';

export class Emulator {
	getPixelCallback: (color: number) => {};
	instructionSubscription: Subscription;
	compileResult: CompileResult;
	constructor(public log: vscode.OutputChannel) {
		
	}

	openEmulatorWindow(context: vscode.ExtensionContext, column: vscode.ViewColumn) {

		let currentPanel: vscode.WebviewPanel = this.initExtensionLayout(context, column);
		currentPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'getPixelResult':
						const color = message.color;
						this.getPixelCallback(color);
						return;
				}
			},
			undefined,
			context.subscriptions
		);

		currentPanel.onDidDispose(
			() => {
				currentPanel = undefined;
				this.instructionSubscription.unsubscribe();
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
			if ((document.fileName.endsWith('.arc') || document.fileName.endsWith('arcadable.config.json')) && document.uri.scheme === 'file') {
				this.loadGame(currentPanel);
			}
		});

		this.loadGame(currentPanel);

		return currentPanel;
	}

	closeEmulatorWindow() {
		if(this.compileResult) {
			this.compileResult.game.stop();
		}
	}

	async loadGame(currentPanel: any) {
		this.log.clear();
		const startTime = process.hrtime();
		const compileResult = await this.compile();
		const diff = process.hrtime(startTime);
		const duration =  Math.floor((diff[0] * 1000 + diff[1] / 1000000)*1000)/1000;
		if (!compileResult.game || compileResult.parseErrors.length > 0 || compileResult.compileErrors.length > 0) {
			this.log.appendLine('Arcadable compilation completed with errors in ' + duration + 'ms.')

			let error = 'Could not complete code compilation. ';
			if (compileResult.parseErrors.length > 0) {
				error += compileResult.parseErrors.length + ' file parsing errors. ';
			}
			if (compileResult.compileErrors.length > 0) {
				error += compileResult.compileErrors.length + ' compilation errors. ';
			}
			vscode.window.showErrorMessage(error);
			if (compileResult.parseErrors.length > 0) {
				this.log.appendLine('Parsing errors (' + compileResult.parseErrors.length + '):');
				compileResult.parseErrors.forEach((e, i) => {
					this.log.appendLine(i + ' - ' + e.file.replace(vscode.workspace.rootPath, '') + ':' + e.line + ':' + e.pos + ' - ' + e.error);
				})
			}
			if (compileResult.compileErrors.length > 0) {
				this.log.appendLine('Compile errors (' + compileResult.compileErrors.length + '):');
				compileResult.compileErrors.forEach((e, i) => {
					this.log.appendLine(i + ' - ' + e.file.replace(vscode.workspace.rootPath, '') + ':' + e.line + ':' + e.pos + ' - ' + e.error);
				})
			}
		} else {
			vscode.window.showInformationMessage('Arcadable compiled successfully!');
			this.log.appendLine('Arcadable compilation completed successfully in ' + duration + 'ms.')

		}

		this.log.show();
		this.compileResult = compileResult;
		const game = this.compileResult.game;
		console.log(game);
		if (game) {
			if(this.instructionSubscription) {
				this.instructionSubscription.unsubscribe();
			}
			this.instructionSubscription = game.drawInstruction.subscribe((instruction: any) => {
				if (instruction.command === 'getPixel') {
					this.getPixelCallback = instruction.callback;
				}
				console.log(instruction);
				(currentPanel as vscode.WebviewPanel).webview.postMessage(instruction);
			});
	
			(currentPanel as vscode.WebviewPanel).webview.postMessage({
				command: 'setDimensions',
				width: game.systemConfig.screenWidth,
				height: game.systemConfig.screenHeight
			});
			console.log('start');
			game.start();
		}
	}

	async compile(): Promise<CompileResult | undefined> {
		const configUri = (await vscode.workspace.findFiles('arcadable.config.json'))[0];
		const configDoc = await vscode.workspace.openTextDocument(configUri);

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
			const configTest = this.checkConfig(config);
			if (configTest !== 'ok') {
				this.log.appendLine(configTest);
				return undefined;
			}
		} else {
			this.log.appendLine(`No config file found at path: "${vscode.workspace.rootPath}/arcadable.config.json"`);
			return undefined;
		}
		const mainUri = (await vscode.workspace.findFiles((config as any).project.main))[0];
		const mainDoc = await vscode.workspace.openTextDocument(mainUri);
	
		if (!mainDoc) {
			this.log.appendLine(`No main file found at path: "${(config as any).project.main}"`);
			return undefined;
		}
		const mainSplit = ((config as any).project.main as string).split('/');
		const mainFileName = mainSplit[mainSplit.length - 1];
		const mainPath = ((config as any).project.main as string).split(mainFileName)[0];
		const files = (await vscode.workspace.findFiles('**/*.arc'));
		let docs: any = {
			'main': mainFileName,
			'root': vscode.workspace.rootPath + mainPath
		};
	
		await Promise.all(files.map((file) => 
			new Promise((res, rej) => {
				vscode.workspace.openTextDocument(file).then(fileOpened => {
					docs[file.path] = fileOpened;
					res();
				});
			})
		));
		const conf = new SystemConfig(
			config.system.screenWidth,
			config.system.screenHeight,
			Math.floor(1000 / config.system.targetFramerate),
			false,
			config.system.digitalInputAmount,
			config.system.analogInputAmount,
			0
		);
		const compileResult = new ArcadableCompiler(conf, docs).startCompile();
	
		return compileResult;
	}

	checkConfig(config: any): string {
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

	initExtensionLayout(context: vscode.ExtensionContext, columnToShowIn: vscode.ViewColumn) {

		const currentPanel = vscode.window.createWebviewPanel(
			'ArcadableEmulator',
			'Arcadable Emulator',
			columnToShowIn as vscode.ViewColumn,
			{
				enableScripts: true
			}
		);
	
		currentPanel.onDidDispose(() => {
			if(this.compileResult) {
				console.log('stop');
				this.compileResult.game.stop();
			}
		})

		const templateFilePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, 'client', 'src', 'html', 'index.html'));
		const styleSrcUrl = currentPanel.webview.asWebviewUri(
			vscode.Uri.file(
				path.join(context.extensionPath, 'client', 'src', 'css', 'style.css')
			)
		).toString();

		const scriptSrcUrl = currentPanel.webview.asWebviewUri(
			vscode.Uri.file(
				path.join(context.extensionPath, 'client', 'src', 'js', 'main.js')
			)
		).toString();

		currentPanel.webview.html = fs.readFileSync(templateFilePath.fsPath, 'utf8')
			.replace('{{styleSrc}}', styleSrcUrl)
			.replace('{{scriptSrc}}', scriptSrcUrl);


		return currentPanel;
	}
	
	
}
