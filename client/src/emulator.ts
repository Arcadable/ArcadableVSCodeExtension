import * as vscode from 'vscode';
import { Subscription } from 'rxjs';
import { Arcadable, SystemConfig } from 'arcadable-shared/';
import path = require('path');
import fs = require('fs');
import { ArcadableCompiler, CompileResult } from './compiler';

export class Emulator {
	getPixelCallback: (color: number) => {};
	instructionSubscription: Subscription;
	interruptionSubscription: Subscription;

	compileResult: CompileResult;
	exportPath: string;
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
					case 'export': {
						if (this.compileResult.game) {
							(async () => {
								this.log.append('Exported Arcadable script');
								const startTime = process.hrtime();
								const bytes = this.compileResult.game.export();
								let path = this.exportPath;
								if (path.charAt(path.length - 1) === '/') {
									path = path.substr(0, path.length - 2);
								}
								fs.writeFile(vscode.workspace.rootPath + path + '/export.bin' , bytes, (e) => {
									this.log.appendLine('Write error: ' + e.message);
								});
								fs.writeFile(vscode.workspace.rootPath + path + '/export.json' , `{
	"size": ${bytes.length},
	"data": "${bytes.reduce((acc, curr, i) => i === 0 ? curr : acc + ',' + curr, '')}"
}`, (e) => {
									this.log.appendLine('Write error: ' + e.message);
								});
								const diff = process.hrtime(startTime);
								const duration =  Math.floor((diff[0] * 1000 + diff[1] / 1000000)*1000)/1000;
								this.log.appendLine(' in ' + duration + 'ms.');
								this.log.appendLine('Export size: ' + bytes.length + ' bytes.');
								this.log.appendLine('Export path: ' + vscode.workspace.rootPath + path + '/export.json');
								this.log.appendLine('Export path: ' + vscode.workspace.rootPath + path + '/export.bin');

							})();
						} else {
							this.log.appendLine('Cannot export, code probably has errors.');
						}
						return;
					}
					case 'digitalChanged': {
						if (this.compileResult.game) {
							this.compileResult.game.systemConfig.realTimeDigitalInputValues[message.index] = message.value;
						}
						return;
					}
					case 'analogChanged': {
						if (this.compileResult.game) {
							this.compileResult.game.systemConfig.realTimeAnalogInputValues[message.index] = message.value;
						}
						return;
					}
				}
			},
			undefined,
			context.subscriptions
		);

		currentPanel.onDidDispose(
			() => {
				currentPanel = undefined;
				this.instructionSubscription.unsubscribe();
				this.interruptionSubscription.unsubscribe();
			},
			null,
			context.subscriptions
		);
		currentPanel.onDidChangeViewState(
			e => {
				const visible = e.webviewPanel.visible;
				if(visible) {
					this.refreshView(currentPanel);
				}
			},
			null,
			context.subscriptions
		);
		vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
			if ((document.fileName.endsWith('.arc') || document.fileName.endsWith('arcadable.config.json')) && document.uri.scheme === 'file') {
				if(this.compileResult) {
					if(this.instructionSubscription) {
						this.instructionSubscription.unsubscribe();
					}
					if(this.interruptionSubscription) {
						this.interruptionSubscription.unsubscribe();
					}
					this.compileResult.game.stop();
				}
				this.loadGame(currentPanel).then(() => {
					this.refreshView(currentPanel);
				});
			}
		});

		this.loadGame(currentPanel).then(() => {
			this.refreshView(currentPanel);
		});
		return currentPanel;
	}

	closeEmulatorWindow() {
		if(this.compileResult) {
			this.compileResult.game.stop();
		}
	}

	refreshView(currentPanel: vscode.WebviewPanel) {

		if(this.compileResult) {
			currentPanel.webview.postMessage({
				command: 'setDimensions',
				width: this.compileResult.game.systemConfig.screenWidth,
				height: this.compileResult.game.systemConfig.screenHeight
			});
			currentPanel.webview.postMessage({
				command: 'setInputs',
				digitalInputs: this.compileResult.game.systemConfig.digitalInputPinsAmount,
				analogInputs: this.compileResult.game.systemConfig.analogInputPinsAmount
			});
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
		if(compileResult.game && compileResult.parseErrors.length === 0 && compileResult.compileErrors.length === 0) {
			this.compileResult = compileResult;
			const game = this.compileResult.game;

			this.instructionSubscription = game.instructionEmitter.subscribe((instruction: any) => {
 				if (instruction.command === 'getPixel') {
					this.getPixelCallback = instruction.callback;
				}
				if (instruction.command === 'log') {
					if(!isNaN(+instruction.value)) {
						this.log.appendLine(instruction.value + '');
					} else if (instruction.value.length !== undefined && instruction.value.length > 0) {
						const message = String.fromCharCode(...(instruction.value as number[]));
						this.log.appendLine(message);
					}
				} else {
					(currentPanel as vscode.WebviewPanel).webview.postMessage(instruction);
				}
			});
			this.interruptionSubscription = game.interruptedEmitter.subscribe((interruption: {
				message: string,
				values: number[],
				instructions: number[]
			}) => {
				this.instructionSubscription.unsubscribe();
				this.interruptionSubscription.unsubscribe();

				this.log.appendLine('Program interrupted.');
				this.log.appendLine(interruption.message);
				if (interruption.values.length > 0) {
					this.log.appendLine('Values that could be involved with the interruption:');
					interruption.values.forEach(v => {
						compileResult.parsedProgram.compressedValues[v].linked.forEach(linked => {
							this.log.appendLine(linked.file.replace(vscode.workspace.rootPath, '') + ':' + linked.line + ':' + linked.pos + ':' + linked.name);
						});
					});
				}
				if (interruption.instructions.length > 0) {
					this.log.appendLine('Instructions that could be involved with the interruption:');
					interruption.instructions.forEach(v => {
						compileResult.parsedProgram.compressedInstructions[v].linked.forEach(linked => {
							this.log.appendLine(linked.file.replace(vscode.workspace.rootPath, '') + ':' + linked.line + ':' + linked.pos);
						});
					});
				}
			});
	

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
				mainsPerSecond: number,
				rendersPerSecond: number,
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
		this.exportPath = (config as any).project.export;
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
			Math.floor(1000 / config.system.mainsPerSecond),
			Math.floor(1000 / config.system.rendersPerSecond),
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
			result += '"project", ';
		} else {
			if (!config.project.name) {
				result += '"project.name", ';
			}
			if (!config.project.version) {
				result += '"project.version", ';
			}
			if (!config.project.main) {
				result += '"project.main", ';
			}
			if (!config.project.export) {
				result += '"project.export", ';
			}
		}
	
		if (!config.system) {
			result += '"system", ';
		} else {
			if (!config.system.screenWidth) {
				result += '"system.screenWidth", ';
			}
			if (!config.system.screenHeight) {
				result += '"system.screenHeight", ';
			}
			if (!config.system.mainsPerSecond) {
				result += '"system.mainsPerSecond", ';
			}
			if (!config.system.rendersPerSecond) {
				result += '"system.rendersPerSecond", ';
			}
			if (!config.system.digitalInputAmount) {
				result += '"system.digitalInputAmount", ';
			}
			if (!config.system.analogInputAmount) {
				result += '"system.analogInputAmount", ';
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

		const templateFilePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, 'client', 'src', 'html', 'index.html'));
		const styleSrcUrl = currentPanel.webview.asWebviewUri(
			vscode.Uri.file(
				path.join(context.extensionPath, 'client', 'src', 'css', 'style.css')
			)
		).toString();

		const mainScriptSrcUrl = currentPanel.webview.asWebviewUri(
			vscode.Uri.file(
				path.join(context.extensionPath, 'client', 'src', 'js', 'main.js')
			)
		).toString();

		const drawFunctionsScriptSrcUrl = currentPanel.webview.asWebviewUri(
			vscode.Uri.file(
				path.join(context.extensionPath, 'client', 'src', 'js', 'drawFunctions.js')
			)
		).toString();

		currentPanel.webview.html = fs.readFileSync(templateFilePath.fsPath, 'utf8')
			.replace('{{styleSrc}}', styleSrcUrl)
			.replace('{{mainScriptSrc}}', mainScriptSrcUrl)
			.replace('{{functionScriptSrc}}', drawFunctionsScriptSrcUrl);

		
		return currentPanel;
	}
	
	
}
