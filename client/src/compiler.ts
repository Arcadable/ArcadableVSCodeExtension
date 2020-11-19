import * as vscode from 'vscode';
import { SystemConfig, ArcadableParser, Arcadable, ParsedFile, ValueType, Value, InstructionType,
	AnalogInputValue, DigitalInputValue, EvaluationValue, ListValue, NumberValue, PixelValue,
	SystemConfigValue, TextValue, NumberValueTypePointer, NumberValueType,
	ClearInstruction, DrawCircleInstruction, DrawLineInstruction, DrawPixelInstruction, DrawRectInstruction,
	DrawTextInstruction, DrawTriangleInstruction, FillCircleInstruction, FillRectInstruction, FillTriangleInstruction,
	MutateValueInstruction, RunConditionInstruction, RunSetInstruction, SetRotationInstruction,
	InstructionSetPointer, InstructionSet, InstructionPointer, ListDeclaration, DebugLogInstruction, FunctionParseResult,
	ValueParseResult, DrawImageInstruction, ImageValue, DataValue, NumberArrayValueTypePointer} from 'arcadable-shared';
import { ValueArrayValueTypePointer, ValueArrayValueType } from 'arcadable-shared/out/model/values/valueArrayValueType';
import { Console } from 'console';
import { ImageValueType, ImageValueTypePointer } from 'arcadable-shared/out/model/values/imageValueType';

export class ArcadableCompiler {
	tempContent = '';
	compileResult: CompileResult;
	constructor(public config: SystemConfig, public docs: { [key: string]: vscode.TextDocument | string, main: string, root: string,}) {
		this.compileResult = new CompileResult(this.config);
	}

	async startCompile(): Promise<CompileResult> {
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

			Object.keys(parseResult)


			const parsedProgram = new ParsedProgram();
			await parsedProgram.init(parseResult);
			this.compileResult.compileErrors.push(...parsedProgram.compileErrors);
			if (this.compileResult.compileErrors.length === 0) {

				const gameData = this.checkAndMerge(parsedProgram);

				this.compileResult.compileErrors = gameData.compileErrors;
				if (this.compileResult.compileErrors.length === 0) {
					const mainInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'main') !== -1);
					const renderInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'render') !== -1);
	
					if (mainInstructionSet === -1) {
						this.compileResult.compileErrors.push({
							file: '',
							line: 0,
							pos: 0,
							error: 'Cannot find "Main" function'
						})
					} 
					if (renderInstructionSet === -1) {
						this.compileResult.compileErrors.push({
							file: '',
							line: 0,
							pos: 0,
							error: 'Cannot find "Render" function'
						})
					} 
					
					if (mainInstructionSet !== -1 && renderInstructionSet !== -1) {
						this.compileResult.assignGameData(gameData);
					}
				}
			}
		}
		return this.compileResult;
	}


	checkAndMerge(parsedProgram: ParsedProgram): ParsedProgram {

		parsedProgram = this.checkForReferenceProblems(parsedProgram);
		if (parsedProgram.compileErrors.length === 0) {

			parsedProgram = this.compress(parsedProgram);
		}
		return parsedProgram;
	}

	compress(data: ParsedProgram): ParsedProgram {
		let compressedValues: {
			type: ValueType,
			value: any,
			mutatable,
			linked: {
				name: string;
				type: ValueType;
				value: any;
				line: number;
				pos: number;
				file: string;
				compressedIndex?: number;
			}[]
		}[] = [];

		data.values.forEach((v, index) => {

			let valueIndex = -1;
			let mutatable = false;
			if (v.type === ValueType.number && (v.value  + '').charAt(0) === '.') {
				v.value = '0' + v.value;
			} else if (v.type === ValueType.number) {
				v.value = '' + v.value;
			}
			let watchForNames = [v.name];
			const listsContainingValue = data.values.filter(v2 =>
				(v2.type === ValueType.listDeclaration || v2.type === ValueType.text) &&
				(v2.value.values as string[]).findIndex(listValue => listValue === v.name) !== -1);

			const listsContainingValuePointers = data.values.filter(v =>
				v.type === ValueType.listValue &&
				listsContainingValue.findIndex(list => list.name === v.value.list) !== -1);
			if (listsContainingValuePointers.length > 0) {
				watchForNames = [...watchForNames, ...listsContainingValuePointers.map(p => p.name)];
			}

			if (data.instructionSets.findIndex(is => is.instructions.findIndex(i => i.type === InstructionType.MutateValue && watchForNames.findIndex(n => n === i.params[0]) !== -1) !== -1) === -1) {
				valueIndex = compressedValues.findIndex(vc => !vc.mutatable && vc.type === v.type && JSON.stringify(vc.value) === JSON.stringify(v.value));
			} else {
				mutatable = true;
			}

			if (valueIndex === -1) {
				valueIndex = compressedValues.push({
					type: v.type,
					value: v.value,
					mutatable,
					linked: []
				}) - 1;
			}

			data.values[index].compressedIndex = valueIndex;
			compressedValues[valueIndex].linked.push(v);
		});

		let compressedInstructions: {
			type: InstructionType;
			params: string[];
			linked: {
				line: number;
				pos: number;
				file: string;
			}[];
		}[] = [];
		let compressedInstructionSets: {
			instructions: number[];
			linked: {
				name: string;
			}[];
		}[] = [];
		data.instructionSets.forEach((is, index) => {
			const instructions: number[] = [];
			is.instructions.forEach((i, index2) => {
				let instructionIndex = compressedInstructions.findIndex(ic => ic.type === i.type && JSON.stringify(ic.params) === JSON.stringify(i.params));
				if (instructionIndex === -1) {
					instructionIndex = compressedInstructions.push({
						type: i.type,
						params: i.params,
						linked: []
					}) - 1;
				}
				data.instructionSets[index].instructions[index2].compressedIndex = instructionIndex;
				compressedInstructions[instructionIndex].linked.push(i);
				instructions.push(instructionIndex);
			})

			let instructionSetIndex = compressedInstructionSets.findIndex(isc => {
				if (isc.instructions === instructions) return true;
				if (isc.instructions == null || instructions == null) return false;
				if (isc.instructions.length != instructions.length) return false;		  
				for (var i = 0; i < isc.instructions.length; ++i) {
				  if (isc.instructions[i] !== instructions[i]) return false;
				}
				return true;
			});
			if (instructionSetIndex === -1) {
				instructionSetIndex = compressedInstructionSets.push({
					instructions,
					linked: []
				}) - 1;
			}
			data.instructionSets[index].compressedIndex = instructionSetIndex;
			compressedInstructionSets[instructionSetIndex].linked.push(is);
		});



		let optimized = true;
		let optimizationLoops = 0;
		while (optimized && optimizationLoops < 100) {

			optimizationLoops++;
			optimized = false;
			compressedInstructionSets.forEach((is, setIndex) => {
				compressedInstructions.forEach((i) => {
					if (i.type === InstructionType.RunSet && isNaN(+i.params[0]) && is.linked.findIndex(l => l.name === i.params[0]) !== -1) {

						i.params[0] = setIndex.toString();
						optimized = true;
					}
					if (i.type === InstructionType.RunCondition) {
						if (isNaN(+i.params[1]) && is.linked.findIndex(l => l.name === i.params[1]) !== -1) {
							i.params[1] = setIndex.toString();
							optimized = true;
						}
						if (isNaN(+i.params[2]) && is.linked.findIndex(l => l.name === i.params[2]) !== -1) {
							i.params[2] = setIndex.toString();
							optimized = true;
						}
					}
				});
			});

			compressedValues.forEach((v, valueIndex) => {
				compressedInstructions.filter(i => i.type !== InstructionType.RunSet).forEach(i => {
					const paramIndexes = i.params.reduce((acc, curr, index) => (isNaN(+curr) && v.linked.findIndex(l => l.name === curr) !== -1) ? [...acc, index] : acc, [] as number[]);
					
					paramIndexes.filter(p => i.type !== InstructionType.RunCondition || p === 0).forEach(p => {
						i.params[p] = valueIndex.toString();
						optimized = true;
					});
				});
				compressedValues.forEach((v2, value2Index) => {
					if (value2Index !== valueIndex) {
						switch(v2.type) {
							case ValueType.evaluation: {
								if (isNaN(+v2.value.left) && v.linked.findIndex(l => l.name === v2.value.left) !== -1) {
									v2.value.left = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.right) && v.linked.findIndex(l => l.name === v2.value.right) !== -1) {
									v2.value.right = valueIndex.toString();
									optimized = true;
								}
								break;
							}
							case ValueType.text:
							case ValueType.listDeclaration: {
								const listIndexes = v2.value.values.reduce((acc, curr, index) => (isNaN(+curr) && v.linked.findIndex(l => l.name === curr) !== -1) ? [...acc, index] : acc, []);
								listIndexes.forEach(p => {
									v2.value.values[p] = valueIndex.toString();
									optimized = true;
								});
								break;
							}
							case ValueType.listValue: {
								if (isNaN(+v2.value.list) && v.linked.findIndex(l => l.name === v2.value.list) !== -1) {
									v2.value.list = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.index) && v.linked.findIndex(l => l.name === v2.value.index) !== -1) {
									v2.value.index = valueIndex.toString();
									optimized = true;
								}
								break;
							}
							case ValueType.pixelIndex: {
								if (isNaN(+v2.value.x) && v.linked.findIndex(l => l.name === v2.value.x) !== -1) {
									v2.value.x = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.y) && v.linked.findIndex(l => l.name === v2.value.y) !== -1) {
									v2.value.y = valueIndex.toString();
									optimized = true;
								}
								break;
							}
							case ValueType.image: {
								if (isNaN(+v2.value.width) && v.linked.findIndex(l => l.name === v2.value.width) !== -1) {
									v2.value.width = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.height) && v.linked.findIndex(l => l.name === v2.value.height) !== -1) {
									v2.value.height = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.keyColor) && v.linked.findIndex(l => l.name === v2.value.keyColor) !== -1) {
									v2.value.keyColor = valueIndex.toString();
									optimized = true;
								}
								if (isNaN(+v2.value.data) && v.linked.findIndex(l => l.name === v2.value.data) !== -1) {
									v2.value.data = valueIndex.toString();
									optimized = true;
								}
								break;
							}
						}
					}
				});
			});
			const indexChanges = {};
			compressedValues = compressedValues.reduce((acc, curr, oldIndex) => {
				const existingIndex = acc.findIndex(existing =>
					!existing.mutatable &&
					!curr.mutatable &&
					existing.type === curr.type &&
					JSON.stringify(existing.value) === JSON.stringify(curr.value)
				);
				if (existingIndex !== -1) {
					indexChanges[oldIndex] = existingIndex;
					acc[existingIndex].linked.push(...curr.linked);
				} else if (oldIndex !== acc.length) {
					indexChanges[oldIndex] = acc.length;
				}

				return existingIndex !== -1 ? acc : [...acc, curr];
			}, [] as {
				type: ValueType,
				value: any,
				mutatable,
				linked: {
					name: string;
					type: ValueType;
					value: any;
					line: number;
					pos: number;
					file: string;
					compressedIndex?: number;
				}[]
			}[]);

			Object.keys(indexChanges).forEach(oldIndex => {
				const newIndex = indexChanges[oldIndex];
				compressedInstructions.filter(i => i.type !== InstructionType.RunSet).forEach((i) => {
					const paramIndexes = i.params.reduce((acc, curr, index) => (!isNaN(+curr) && curr === oldIndex) ? [...acc, index] : acc, []);

					paramIndexes.filter(p => i.type !== InstructionType.RunCondition || p === 0).forEach(p => {

						i.params[p] = newIndex.toString();
						optimized = true;
					});
				});
				compressedValues.forEach((v, i) => {
					switch(v.type) {
						case ValueType.evaluation: {
							if (!isNaN(+v.value.left) && v.value.left === oldIndex) {
								v.value.left = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.right) && v.value.right === oldIndex) {
								v.value.right = newIndex.toString();
								optimized = true;
							}
							break;
						}
						case ValueType.text:
						case ValueType.listDeclaration: {
							const listIndexes = v.value.values.reduce((acc, curr, index) => (!isNaN(+curr) && curr === oldIndex) ? [...acc, index] : acc, []);
							listIndexes.forEach(p => {
								v.value.values[p] = newIndex.toString();
								optimized = true;
							});
							break;
						}
						case ValueType.listValue: {
							if (!isNaN(+v.value.list) && v.value.list === oldIndex) {
								v.value.list = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.index) && v.value.index === oldIndex) {
								v.value.index = newIndex.toString();
								optimized = true;
							}
							break;
						}
						case ValueType.pixelIndex: {
							if (!isNaN(+v.value.x) && v.value.x === oldIndex) {
								v.value.x = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.y) && v.value.y === oldIndex) {
								v.value.y = newIndex.toString();
								optimized = true;
							}
							break;
						}
						case ValueType.image: {
							if (!isNaN(+v.value.width) && v.value.width === oldIndex) {
								v.value.width = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.height) && v.value.height === oldIndex) {
								v.value.height = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.keyColor) && v.value.keyColor === oldIndex) {
								v.value.keyColor = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.data) && v.value.data === oldIndex) {
								v.value.data = newIndex.toString();
								optimized = true;
							}
							break;
						}
					}
				})
			});

			const instrIndexChanges = {};
			compressedInstructions = compressedInstructions.reduce((acc, curr, oldIndex) => {
				const existingIndex = acc.findIndex(existing =>
					existing.type === curr.type &&
					JSON.stringify(existing.params) === JSON.stringify(curr.params)
				);
				if (existingIndex !== -1) {
					instrIndexChanges[oldIndex] = existingIndex;
					acc[existingIndex].linked.push(...curr.linked);
				} else if (oldIndex !== acc.length) {
					instrIndexChanges[oldIndex] = acc.length;
				}

				return existingIndex !== -1 ? acc : [...acc, curr];
			}, [] as {
				type: InstructionType;
				params: string[];
				linked: {
					line: number;
					pos: number;
					file: string;
				}[];
			}[]);
			Object.keys(instrIndexChanges).forEach(oldIndex => {
				const newIndex = instrIndexChanges[oldIndex];
				compressedInstructionSets.forEach(is => {
					const instrIndexes = is.instructions.reduce((acc, curr, index) => (curr === +oldIndex) ? [...acc, index] : acc, []);
					instrIndexes.forEach(p => {
						is.instructions[p] = newIndex;
						optimized = true;
					});
				});
			});

			const instrSetIndexChanges = {};
			compressedInstructionSets = compressedInstructionSets.reduce((acc, curr, oldIndex) => {
				const existingIndex = acc.findIndex(existing =>
					JSON.stringify(existing.instructions) === JSON.stringify(curr.instructions)
				);
				if (existingIndex !== -1) {
					instrSetIndexChanges[oldIndex] = existingIndex;
					acc[existingIndex].linked.push(...curr.linked);
				} else if (oldIndex !== acc.length) {
					instrSetIndexChanges[oldIndex] = acc.length;
				}

				return existingIndex !== -1 ? acc : [...acc, curr];
			}, [] as {
				instructions: number[];
				linked: {
					name: string;
				}[];
			}[]);
			Object.keys(instrSetIndexChanges).forEach(oldIndex => {
				const newIndex = instrSetIndexChanges[oldIndex];
				compressedInstructions.forEach(i => {
					if (i.type === InstructionType.RunSet && !isNaN(+i.params[0]) && i.params[0] === oldIndex) {
						i.params[0] = newIndex.toString();
						optimized = true;
					}
					if (i.type === InstructionType.RunCondition) {
						if (!isNaN(+i.params[1]) && i.params[1] === oldIndex) {
							i.params[1] = newIndex.toString();
							optimized = true;
						}
						if (!isNaN(+i.params[2]) && i.params[2] === oldIndex) {
							i.params[2] = newIndex.toString();
							optimized = true;
						}
					}
				});
			});
		}
		data.compressedValues = compressedValues;
		data.compressedInstructions = compressedInstructions;
		data.compressedInstructionSets = compressedInstructionSets;
		return data;
	}

	checkForReferenceProblems(data: ParsedProgram): ParsedProgram {

		data.values.forEach(v => {
			let count = 0;
			data.values.forEach(vv => {
				if (vv.name === v.name) {
					count++;
				}
			});
			if (count > 1) {
				data.compileErrors.push({
					file: v.file,
					line: v.line,
					pos: v.pos,
					error: 'Value with identifier "' + v.name + '" is declared multiple times.'
				})
			}

			if (v.type === ValueType.listDeclaration || v.type === ValueType.text) {
				const value = (v.value as {type: ValueType, values: string[]});
				value.values.forEach(v1 => {
					const valueIndex = data.values.findIndex(v2 => v2.name === v1)
					if (valueIndex === -1) {
						data.compileErrors.push(this.referenceNotFoundError(v.file, v.line, v.pos, v1));
					} else if (data.values[valueIndex].type !== value.type) {
						data.compileErrors.push({
							file: v.file,
							line: v.line,
							pos: v.pos,
							error: 'Type of value with identifier "' + v1 + '" does not match this list type.'
						})
					}
				});
			} else if (v.type === ValueType.pixelIndex) {
				const values = [v.value.x, v.value.y] as string[];
				data.compileErrors.push(...this.checkNumbericalReferences(values, data, v.file, v.line, v.pos));
			} else if (v.type === ValueType.image) {
				const values = [v.value.width, v.value.height, v.value.keyColor] as string[];
				data.compileErrors.push(...this.checkNumbericalReferences(values, data, v.file, v.line, v.pos));

				const dataValueIndex = data.values.findIndex(v2 => v2.name === v.value.data)
				if (dataValueIndex === -1) {
					data.compileErrors.push(this.referenceNotFoundError(v.file, v.line, v.pos, v.value.data));
				} else if (data.values[dataValueIndex].type !== ValueType.data) {
					data.compileErrors.push({
						file: v.file,
						line: v.line,
						pos: v.pos,
						error: 'Value "' + v.value.data + '" not of type "Data" cannot be used here.'
					});
				}
			} else if (v.type === ValueType.evaluation) {
				const values = [v.value.left, v.value.right] as string[];
				data.compileErrors.push(...this.checkNumbericalReferences(values, data, v.file, v.line, v.pos));
			} else if (v.type === ValueType.listValue) {
				data.compileErrors.push(...this.checkNumbericalReferences([v.value.index], data, v.file, v.line, v.pos));
				const valueIndex = data.values.findIndex(v2 => v2.name === v.value.list)
				if (valueIndex === -1) {
					data.compileErrors.push(this.referenceNotFoundError(v.file, v.line, v.pos, v.value.list));
				}
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
					data.compileErrors.push({
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
						case InstructionType.DrawTriangle: 
						case InstructionType.FillCircle: 
						case InstructionType.FillRect: 
						case InstructionType.FillTriangle:
						case InstructionType.SetRotation: {
							data.compileErrors.push(...this.checkNumbericalReferences(instruction.params, data, instruction.file, instruction.line, instruction.pos));
							break;
						} 
						case InstructionType.MutateValue: {
							const valueIndex = data.values.findIndex(v2 => v2.name === instruction.params[0]);
							if (valueIndex === -1) {
								data.compileErrors.push(this.referenceNotFoundError(instruction.file, instruction.line, instruction.pos, instruction.params[0]));
							} else {
								if (data.values[valueIndex].type === ValueType.text || data.values[valueIndex].type === ValueType.listDeclaration) {
									data.compileErrors.push(...this.checkListReferences([instruction.params[1]], data, instruction.file, instruction.line, instruction.pos));
								} else {
									data.compileErrors.push(...this.checkNumbericalReferences(instruction.params, data, instruction.file, instruction.line, instruction.pos));
								}
							}
							break;
						}
						case InstructionType.RunCondition: {
							data.compileErrors.push(...this.checkInstructionSetReferences([instruction.params[1], instruction.params[1]], data, instruction.file, instruction.line, instruction.pos));
							break;
						} 
						case InstructionType.RunSet: {
							data.compileErrors.push(...this.checkInstructionSetReferences(instruction.params, data, instruction.file, instruction.line, instruction.pos));
							break;
						}
						case InstructionType.DrawText: {
							data.compileErrors.push(...this.checkNumbericalReferences(instruction.params.filter((p, i) => i !== 2), data, instruction.file, instruction.line, instruction.pos));
							data.compileErrors.push(...this.checkListReferences([instruction.params[2]], data, instruction.file, instruction.line, instruction.pos));
							break;
						}
						case InstructionType.DrawImage: {
							data.compileErrors.push(...this.checkNumbericalReferences(instruction.params.filter((p, i) => i !== 2), data, instruction.file, instruction.line, instruction.pos));
							data.compileErrors.push(...this.checkImageReferences([instruction.params[2]], data, instruction.file, instruction.line, instruction.pos));
							break;
						}
						case InstructionType.DebugLog: {
							const valueIndex = data.values.findIndex(v2 => v2.name === instruction.params[0]);
							if (valueIndex === -1) {
								data.compileErrors.push(this.referenceNotFoundError(instruction.file, instruction.line, instruction.pos, instruction.params[0]));
							} else if (data.values[valueIndex].type === ValueType.listDeclaration) {
								data.compileErrors.push({
									file: instruction.file,
									line: instruction.line,
									pos: instruction.pos,
									error: 'Value "' + instruction.params[0] + '" with type "List" cannot be used here.'
								});
							}

							break;
						}
					}
				});
			}
		});


		return data;
	}

	checkNumbericalReferences(values: string[], data: ParsedProgram, file: string, line: number, pos: number) {
		const errors = [];
		values.forEach(v1 => {
			const valueIndex = data.values.findIndex(v2 => v2.name === v1)
			if (valueIndex === -1) {
				errors.push(this.referenceNotFoundError(file, line, pos, v1));
			} else if (
				data.values[valueIndex].type === ValueType.listDeclaration ||
				data.values[valueIndex].type === ValueType.text ||
				data.values[valueIndex].type === ValueType.image ||
				data.values[valueIndex].type === ValueType.data
			) {
				errors.push({
					file: file,
					line: line,
					pos: pos,
					error: 'Value "' + v1 + '" with type "List", "String", "Image" or "Data" cannot be used here.'
				});
			}
		});
		return errors;
	}

	checkImageReferences(values: string[], data: ParsedProgram, file: string, line: number, pos: number) {
		const errors = [];
		values.forEach(v1 => {
			const valueIndex = data.values.findIndex(v2 => v2.name === v1)
			if (valueIndex === -1) {
				errors.push(this.referenceNotFoundError(file, line, pos, v1));
			} else if (data.values[valueIndex].type !== ValueType.image) {
				errors.push({
					file: file,
					line: line,
					pos: pos,
					error: 'Value "' + v1 + '" not of type "Image" cannot be used here.'
				});
			}
		});
		return errors;
	}

	checkListReferences(values: string[], data: ParsedProgram, file: string, line: number, pos: number) {
		const errors = [];
		values.forEach(v1 => {
			const valueIndex = data.values.findIndex(v2 => v2.name === v1)
			if (valueIndex === -1) {
				errors.push(this.referenceNotFoundError(file, line, pos, v1));
			} else if (data.values[valueIndex].type !== ValueType.listDeclaration && data.values[valueIndex].type !== ValueType.text) {
				errors.push({
					file: file,
					line: line,
					pos: pos,
					error: 'Value "' + v1 + '" not of type "List" or "String" cannot be used here.'
				});
			}
		});
		return errors;
	}

	checkInstructionSetReferences(instructionSets: string[], data: ParsedProgram, file: string, line: number, pos: number) {
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

export class ParsedProgram {
	values: {
        name: string;
        type: ValueType;
        value: any;
        line: number;
        pos: number;
		file: string;
		compressedIndex?: number;
	}[] = [];
	data: {[key: string]: number[]} = {};
    instructionSets: {
        name: string;
        instructions: {
            line: number;
            pos: number;
            file: string;
            type: InstructionType;
			params: string[];
			compressedIndex?: number;
		}[];
		compressedIndex?: number;
    }[] = [];
    compressedValues: {
        type: ValueType,
		value: any,
		mutatable: boolean,
        linked:{
            name: string;
            line: number;
            pos: number;
            file: string;
		}[];
		compressedIndex?: number;
    }[] = [];
    compressedInstructions: {
        type: InstructionType,
        params: string[],
        linked:{
            line: number;
            pos: number;
            file: string;
        }[]
    }[] = [];
    compressedInstructionSets: {
		instructions: number[],
		linked: {
			name: string;
		}[]
	}[] = [];
	compileErrors: {file: string, line: number, pos: number, error: string}[] = [];

	constructor() {}

	async init(data: {[key: string]: ParsedFile}) {
		const functionParseResultExecutables: {
			file: string,
			executables: (() => FunctionParseResult[])[]
		}[] = Object.keys(data).reduce((acc, curr) => [
			...acc,
			{
				file: data[curr].filePath,
				executables: data[curr].functionParseResults
			}
		], []);

		const valueParseResults: {
			parseResult: ValueParseResult | null;
			line: number;
			pos: number;
			file: string;
		}[] = Object.keys(data).reduce((acc, curr) => [
			...acc,
			...data[curr].valueParseResults
		], [])
		functionParseResultExecutables.forEach(e => {
			e.executables.forEach(executable => {

				const functions = executable();
				this.instructionSets.push(
					...functions.map(f => ({
						name: f.name,
						instructions: f.instructions.map(i => ({
							line: i.line,
							pos: i.pos,
							file: e.file,
							type: i.type,
							params: i.params
						}))
					}))
				);

				this.compileErrors.push(
					...functions
						.reduce((acc, curr) => [...acc, ...curr.errors.map(err => ({
							file: e.file,
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

				valueParseResults.push(...functions.reduce((acc, curr) => [...acc, ...curr.values.map(v => ({
					parseResult: {
						value: {
							type: v.type,
							value: v.value,
							name: v.name,
						},
						errors: []
					},
					line: v.line,
					pos: v.pos,
					file: e.file
				}))], [] as {
					parseResult: ValueParseResult | null;
					line: number;
					pos: number;
					file: string;
				}[]));
			});

		});

		if (valueParseResults && valueParseResults.length > 0) {
			this.values.push(...(await Promise.all(valueParseResults.filter(v => !!v.parseResult && !!v.parseResult.value).map(async v => {
				let value = ((v.parseResult as ValueParseResult).value as any).value;
				if(((v.parseResult as ValueParseResult).value as any).type === ValueType.data) {
					const baseName = (v.file.match(/[^\/]*?\.arc/g) as RegExpMatchArray)[0];
					const baseDir = v.file.replace(baseName, '');
					let dataPath = baseDir + value;
					let backMatch = dataPath.match(/[^\/]*?\/\.\.\//g);
					while (backMatch) {
						dataPath = dataPath.replace(/[^\/]*?\/\.\.\//g, '');
						backMatch = dataPath.match(/[^\/]*?\/\.\.\//g);
					}
					value = dataPath;
					if(!this.data[value]) {
						const file = vscode.Uri.file(value);
						try {
							this.data[value] = Array.from((await vscode.workspace.fs.readFile(file)));
						} catch(e) {
							this.compileErrors.push({file: v.file, line: v.line, pos: v.pos, error: `Unable to read file ${value}`});
						}
					}
	
				}
				return {
					name: ((v.parseResult as ValueParseResult).value as any).name,
					type: ((v.parseResult as ValueParseResult).value as any).type,
					value,
					line: v.line,
					pos: v.pos,
					file: v.file
				}
			}))));
			this.compileErrors.push(
				...valueParseResults
					.filter(v => !!v.parseResult)
					.reduce((acc, curr) => [
						...acc,
						...(curr.parseResult as ValueParseResult).errors.map(e => ({
							file: curr.file,
							line: curr.line,
							pos: e.pos,
							error: e.error
						}))
					], [] as {
					file: string;
					line: number;
					pos: number;
					error: string;
				}[])
			);
		}

	}
}

export class CompileResult {
	parsedProgram: ParsedProgram;
	game: Arcadable;
	compileErrors: {file: string, line: number, pos: number, error: string}[];
	parseErrors: {file: string, line: number, pos: number, error: string}[];
	constructor(config: SystemConfig) {
		this.game = new Arcadable(config);
		this.compileErrors = [];
		this.parseErrors = [];
	}

	
	assignGameData(gameData: ParsedProgram) {
		this.parsedProgram = gameData;
		const values = gameData.compressedValues.map((v, i) => {
			switch(v.type) {
				
				case ValueType.analogInputPointer: {
					return new AnalogInputValue(i, +v.value, '', this.game);
				}
				case ValueType.digitalInputPointer: {
					return new DigitalInputValue(i, +v.value, '', this.game);
				}
				case ValueType.evaluation: {
					return new EvaluationValue(
						i,
						new NumberValueTypePointer<NumberValueType>(+v.value.left, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.right, this.game),
						v.value.evaluation,
						v.value.static,
						'',
						this.game
					);
				}
				case ValueType.listValue: {
					return new ListValue(
						i,
						new ValueArrayValueTypePointer<ValueArrayValueType>(+v.value.list, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.index, this.game),
						'',
						this.game
					);
				}
				case ValueType.listDeclaration: {
					switch (v.value.type) {
						case ValueType.analogInputPointer:
						case ValueType.digitalInputPointer:
						case ValueType.evaluation:
						case ValueType.number:
						case ValueType.pixelIndex:
						case ValueType.systemPointer: {
							return new ListDeclaration(
								i,
								v.value.values.length,
								v.value.values.map(value => new NumberValueTypePointer<NumberValueType>(+value, this.game)),
								'',
								this.game
							);
						}
						case ValueType.text: {

							return new ListDeclaration(
								i,
								v.value.values.length,
								v.value.values.map(value => new ValueArrayValueTypePointer<TextValue<NumberValueType>>(+value, this.game)),
								'',
								this.game
							);
						}
					}

				}
				case ValueType.number: {
					return new NumberValue(i, +v.value, 4, '', this.game);
				}
				case ValueType.pixelIndex: {
					return new PixelValue(
						i,
						new NumberValueTypePointer<NumberValueType>(+v.value.x, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.y, this.game),
						'',
						this.game
					);
				}
				case ValueType.systemPointer: {
					return new SystemConfigValue(i, +v.value, '', this.game);
				}
				case ValueType.text: {
					return new TextValue(
						i,
						v.value.values.map(value => new NumberValueTypePointer<NumberValueType>(+value, this.game)),
						v.value.values.length,
						'',
						this.game
					);
				}
				case ValueType.data: {
					return new DataValue(
						i,
						gameData.data[v.value],
						'',
						this.game
					);
				}
				case ValueType.image: {
					return new ImageValue(
						i,
						new NumberArrayValueTypePointer<DataValue>(+v.value.data, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.width, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.height, this.game),
						new NumberValueTypePointer<NumberValueType>(+v.value.keyColor, this.game),
						'',
						this.game
					);
				}
			}
		});
		const instructions = gameData.compressedInstructions.map((inst, i) => {
			switch(inst.type) {
				case InstructionType.Clear : {
					return new ClearInstruction(i, '', this.game);
				}
				case InstructionType.DrawCircle : {
					return new DrawCircleInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawLine : {
					return new DrawLineInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawPixel : {
					return new DrawPixelInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawImage : {
					return new DrawImageInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new ImageValueTypePointer<ImageValueType>(+inst.params[2], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawRect : {
					return new DrawRectInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawText : {
					return new DrawTextInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new ValueArrayValueTypePointer<TextValue<NumberValueType>>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DrawTriangle : {
					return new DrawTriangleInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[5], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[6], this.game),
						'',
						this.game
					);
				}
				case InstructionType.FillCircle : {
					return new FillCircleInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						'',
						this.game
					);
				}
				case InstructionType.FillRect : {
					return new FillRectInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						'',
						this.game
					);
				}
				case InstructionType.FillTriangle : {
					return new FillTriangleInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[2], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[3], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[4], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[5], this.game),
						new NumberValueTypePointer<NumberValueType>(+inst.params[6], this.game),
						'',
						this.game
					);
				}
				case InstructionType.MutateValue : {
					if (values[+inst.params[0]].type === ValueType.text) {
						return new MutateValueInstruction(
							i,
							new ValueArrayValueTypePointer<TextValue<NumberValueType>>(+inst.params[0], this.game),
							new ValueArrayValueTypePointer<TextValue<NumberValueType>>(+inst.params[1], this.game),
							'',
							this.game
						);
					} else if (values[+inst.params[0]].type === ValueType.listDeclaration) {
						return new MutateValueInstruction(
							i,
							new ValueArrayValueTypePointer<ValueArrayValueType>(+inst.params[0], this.game),
							new ValueArrayValueTypePointer<ValueArrayValueType>(+inst.params[1], this.game),
							'',
							this.game
						);
					} else {
						return new MutateValueInstruction(
							i,
							new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
							new NumberValueTypePointer<NumberValueType>(+inst.params[1], this.game),
							'',
							this.game
						);
					}

				}
				case InstructionType.RunCondition : {
					return new RunConditionInstruction(
						i,
						new NumberValueTypePointer<EvaluationValue>(+inst.params[0], this.game),
						new InstructionSetPointer(+inst.params[1], this.game),
						inst.params[2].length > 0 ? new InstructionSetPointer(+inst.params[2], this.game) : null,
						'',
						this.game
					);
				}
				case InstructionType.RunSet : {
					return new RunSetInstruction(
						i,
						new InstructionSetPointer(+inst.params[0], this.game),
						'',
						this.game
					);
				}
				case InstructionType.SetRotation : {
					return new SetRotationInstruction(
						i,
						new NumberValueTypePointer<NumberValueType>(+inst.params[0], this.game),
						'',
						this.game
					);
				}
				case InstructionType.DebugLog : {
					return new DebugLogInstruction(
						i,
						new NumberValueTypePointer<Value>(+inst.params[0], this.game),
						'',
						this.game
					);
				}
			}
		});
		const instructionSets = gameData.compressedInstructionSets.map((is, i) => new InstructionSet(
			i,
			is.instructions.length,
			is.instructions.map(inst => 
				new InstructionPointer(inst, this.game)
			),
			'',
			this.game
		));
		const mainInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'main') !== -1);
		const renderInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'render') !== -1);

		this.game.setGameLogic(
			values,
			instructions,
			instructionSets,
			mainInstructionSet,
			renderInstructionSet
		);
	}
}
