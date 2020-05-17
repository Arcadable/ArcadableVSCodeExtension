import * as vscode from 'vscode';
import { SystemConfig, ArcadableParser, Arcadable, ParsedFile, ValueType, Value, InstructionType } from 'arcadable-shared';


export class ArcadableCompiler {
	tempContent = '';
	compileResult: CompileResult;
	constructor(public config: SystemConfig, public docs: { [key: string]: vscode.TextDocument | string, main: string, root: string,}) {
		this.compileResult = new CompileResult(this.config);
	}

	startCompile(): CompileResult {

		this.tempContent = '';
		this.compileResult = new CompileResult(this.config);

		const parseResult: {[key: string]: ParsedFile} = {};
		const mainDoc = this.docs[this.docs['root'] + this.docs['main']] as vscode.TextDocument;
		parseResult[mainDoc.uri.path] = new ArcadableParser().parse(mainDoc.uri.path, mainDoc.getText().split(/\n/g));

		let imports: {[key: string]: string} = {};
		if (parseResult[mainDoc.uri.path].imports && parseResult[mainDoc.uri.path].imports.length > 0) {
			imports = parseResult[mainDoc.uri.path].imports.reduce((acc, curr, i) => ({...acc, [parseResult[mainDoc.uri.path].filePath + '////' + i]: curr}), {});
		}

		while (Object.keys(imports).length > 0) {
			const currentKey = Object.keys(imports)[0];
			const fullBasePath = currentKey.replace(/\/\/\/\/.*/g, '');
			const baseName = (fullBasePath.match(/[^\/]*?\.arc/g) as RegExpMatchArray)[0];
			const baseDir = fullBasePath.replace(baseName, '');
			let importPath = baseDir + imports[currentKey];
			let backMatch = importPath.match(/[^\/]*?\/\.\.\//g);
			while (backMatch) {
				importPath = importPath.replace(/[^\/]*?\/\.\.\//g, '');
				backMatch = importPath.match(/[^\/]*?\/\.\.\//g);
			}
			if(parseResult[importPath] === undefined) {
				const importDoc = this.docs[importPath] as vscode.TextDocument;
				if (importDoc) {
					parseResult[importPath] = new ArcadableParser().parse(importDoc.uri.path, importDoc.getText().split(/\n/g));
					if (parseResult[importPath].imports && parseResult[importPath].imports.length > 0) {
						imports = parseResult[importPath].imports.reduce((acc, curr, i) => ({...acc, [parseResult[importPath].filePath + '////' + i]: curr}), imports);
					}
				} else {
					parseResult[fullBasePath].errors.push({
						file: fullBasePath,
						line: 0,
						pos: 0,
						error: 'Cannot find import file: "' + importPath + '"'
					});
				}
			}
			delete imports[currentKey];
		}

		const parseErrors = Object.keys(parseResult).reduce((acc, curr) => [...acc, ...parseResult[curr].errors], [] as {
			file: string,
			line: number,
			pos: number,
			error: string
		}[]);
		this.compileResult.parseErrors = parseErrors;
		if (parseErrors.length === 0) {
			const mergedParseResult = this.checkAndMerge(parseResult);
            this.compileResult.parseErrors = mergedParseResult.errors;
		}
		//todo check and merge duplicate values
		//convert parsed file into game object
		//add drawpixel and drawtext parsing
		//add set list index and get list value instructions (mylist[9]) 
		//if index is outside of list size, return 0
		return this.compileResult;
	}


	checkAndMerge(parseResult: {[key: string]: ParsedFile}) {
		let combinedResult: ParsedFile = Object.keys(parseResult).reduce((acc, curr) => ({
			...acc,
			values: [
				...acc.values,
				...parseResult[curr].values
			],
			instructionSets: [
				...acc.instructionSets,
				...parseResult[curr].instructionSets
			],
		}), {
			filePath: '',
			imports: [],
			values: [],
			instructionSets: [],
			errors: []
		} as ParsedFile);

		combinedResult = this.checkForReferenceProblems(combinedResult);

		return combinedResult;
	}

	checkForReferenceProblems(data: ParsedFile): ParsedFile {
		data.values.forEach(v => {
			let count = 0;
			data.values.forEach(vv => {
				if (vv.name === v.name) {
					count++;
				}
			});
			if (count > 1) {
				data.errors.push({
					file: v.file,
					line: v.line,
					pos: v.pos,
					error: 'Value with identifier "' + v.name + '" is declared multiple times.'
				})
			}

			if (v.type === ValueType.list) {
				const value = (v.value as {type: ValueType, values: string[]});
				value.values.forEach(v1 => {
					const valueIndex = data.values.findIndex(v2 => v2.name === v1)
					if (valueIndex === -1) {
						data.errors.push(this.referenceNotFoundError(v.file, v.line, v.pos, v1));
					} else if (data.values[valueIndex].type !== value.type) {
						data.errors.push({
							file: v.file,
							line: v.line,
							pos: v.pos,
							error: 'Type of value with identifier "' + v1 + '" does not match this list type.'
						})
					}
				});
			} else if (v.type === ValueType.pixelIndex) {
				const values = [v.value.x, v.value.y] as string[];
				data.errors.push(...this.checkNumbericalReferences(values, data, v.file, v.line, v.pos));
			} else if (v.type === ValueType.evaluation) {
				const values = [v.value.left, v.value.right] as string[];
				data.errors.push(...this.checkNumbericalReferences(values, data, v.file, v.line, v.pos));
			}
		});

		data.instructionSets.forEach(i => {
			if (i.instructions.length > 0) {
				let count = 0;
				data.instructionSets.forEach(ii => {
					if (ii.name === i.name) {
						count++;
					}
				});
				if (count > 1) {
					data.errors.push({
						file: i.instructions[0].file,
						line: i.instructions[0].line,
						pos: 0,
						error: 'Function with identifier "' + i.name + '" is declared multiple times.'
					})
				}

				i.instructions.forEach(instruction => {
					switch (instruction.type) {
						case InstructionType.DrawCircle: 
						case InstructionType.DrawLine: 
						case InstructionType.DrawPixel: 
						case InstructionType.DrawRect: 
						case InstructionType.DrawText: 
						case InstructionType.DrawTriangle: 
						case InstructionType.FillCircle: 
						case InstructionType.FillRect: 
						case InstructionType.FillTriangle:
						case InstructionType.MutateValue:
						case InstructionType.SetRotation: {
							data.errors.push(...this.checkNumbericalReferences(instruction.params, data, instruction.file, instruction.line, instruction.pos));
							break;
						} 
						case InstructionType.RunCondition: {
							data.errors.push(...this.checkInstructionSetReferences([instruction.params[1], instruction.params[1]], data, instruction.file, instruction.line, instruction.pos));
							break;
						} 
						case InstructionType.RunSet: {
							data.errors.push(...this.checkInstructionSetReferences(instruction.params, data, instruction.file, instruction.line, instruction.pos));
							break;
						}
					}
				});
			} else {
				data.errors.push({
					file: '',
					line: 0,
					pos: 0,
					error: 'Empty function with identifier "' + i.name + '".'
				})
			}
		});


		return data;
	}

	checkNumbericalReferences(values: string[], data: ParsedFile, file: string, line: number, pos: number) {
		const errors = [];
		values.forEach(v1 => {
			const valueIndex = data.values.findIndex(v2 => v2.name === v1)
			if (valueIndex === -1) {
				errors.push(this.referenceNotFoundError(file, line, pos, v1));
			} else if (data.values[valueIndex].type === ValueType.list || data.values[valueIndex].type === ValueType.text) {
				errors.push({
					file: file,
					line: line,
					pos: pos,
					error: 'Value "' + v1 + '" with type "List" or "String" cannot be used here.'
				});
			}
		});
		return errors;
	}

	checkInstructionSetReferences(instructionSets: string[], data: ParsedFile, file: string, line: number, pos: number) {
		const errors = [];
		instructionSets.forEach(i1 => {
			const instructionSetIndex = data.instructionSets.findIndex(i2 => i2.name === i1)
			if (instructionSetIndex === -1) {
				errors.push({
					file: file,
					line: line,
					pos: pos,
					error: 'Function with identifier "' + i1 + '" cannot be found.'
				});
			}
		});
		return errors;
	}

	referenceNotFoundError(file: string, line: number, pos: number, name: string) {
		return {
			file: file,
			line: line,
			pos: pos,
			error: 'Reference to value with identifier "' + name + '" cannot be found.'
		};
	}
}


export class CompileResult {
	game: Arcadable;
	compileErrors: {file: string, line: number, pos: number, error: string}[];
	parseErrors: {file: string, line: number, pos: number, error: string}[];
	constructor(config: SystemConfig) {
		this.game = new Arcadable(config);
		this.compileErrors = [];
		this.parseErrors = [];
	}
}
