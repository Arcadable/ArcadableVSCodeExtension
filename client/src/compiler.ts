import * as vscode from 'vscode';
import { SystemConfig, ArcadableParser, Arcadable, ParsedFile, ValueType, Value, InstructionType, AnalogInputValue, DigitalInputValue, EvaluationValue, ListValue, NumberValue, PixelValue, SystemConfigValue, TextValue, NumberValueTypePointer, NumberValueType, ValuePointer, NumberArrayValueTypePointer, ClearInstruction, DrawCircleInstruction, DrawLineInstruction, DrawPixelInstruction, DrawRectInstruction, DrawTextInstruction, DrawTriangleInstruction, FillCircleInstruction, FillRectInstruction, FillTriangleInstruction, MutateValueInstruction, RunConditionInstruction, RunSetInstruction, SetRotationInstruction, NumberArrayValueType, InstructionSetPointer, InstructionSet, InstructionPointer } from 'arcadable-shared';
import { SlowBuffer } from 'buffer';


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
			const gameData = this.checkAndMerge(parseResult);
			this.compileResult.parseErrors = gameData.errors;
			if (this.compileResult.parseErrors.length === 0) {
				const rootInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'main') !== -1);
				if (rootInstructionSet !== -1) {
					this.compileResult.assignGameData(gameData);
				} else {
					this.compileResult.compileErrors.push({
						file: '',
						line: 0,
						pos: 0,
						error: 'Cannot find "Main" function'
					})
				}
			}
		}
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
			errors: [],
			compressedValues: [],
			compressedInstructions: [],
			compressedInstructionSets: []
		});

		combinedResult = this.checkForReferenceProblems(combinedResult);
		if (combinedResult.errors.length === 0) {
			combinedResult = this.compress(combinedResult);
		}
		return combinedResult;
	}

	compress(data: ParsedFile): ParsedFile {

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
			if (data.instructionSets.findIndex(is => is.instructions.findIndex(i => i.type === InstructionType.MutateValue && i.params[0] === v.name) !== -1) === -1) {
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
				compressedInstructions.forEach(i => {
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
				compressedInstructions.forEach(i => {
					const paramIndexes = i.params.reduce((acc, curr, index) => (isNaN(+curr) && v.linked.findIndex(l => l.name === curr) !== -1) ? [...acc, index] : acc, []);
					paramIndexes.forEach(p => {
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
							case ValueType.list: {
								const listIndexes = v2.value.values.reduce((acc, curr, index) => (isNaN(+curr) && v.linked.findIndex(l => l.name === curr) !== -1) ? [...acc, index] : acc, []);
								listIndexes.forEach(p => {
									v2.value.values[p] = valueIndex.toString();
									optimized = true;
								});
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
				compressedInstructions.forEach(i => {
					const paramIndexes = i.params.reduce((acc, curr, index) => (!isNaN(+curr) && curr === oldIndex) ? [...acc, index] : acc, []);
					paramIndexes.forEach(p => {
						i.params[p] = newIndex.toString();
						optimized = true;
					});
				});
				compressedValues.forEach(v => {
					switch(v.type) {
						case ValueType.evaluation: {
							if (!isNaN(+v.value.left) && v.value.left === oldIndex) {
								v.value.left = newIndex.toString();
								optimized = true;
							}
							if (!isNaN(+v.value.right) && v.value.left === oldIndex) {
								v.value.right = newIndex.toString();
								optimized = true;
							}
							break;
						}
						case ValueType.list: {
							const listIndexes = v.value.values.reduce((acc, curr, index) => (!isNaN(+curr) && curr === oldIndex) ? [...acc, index] : acc, []);
							listIndexes.forEach(p => {
								v.value.values[p] = newIndex.toString();
								optimized = true;
							});
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
	
	assignGameData(gameData: ParsedFile) {
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
				case ValueType.list: {
					switch (v.value.type) {
						case ValueType.analogInputPointer:
						case ValueType.digitalInputPointer:
						case ValueType.evaluation:
						case ValueType.number:
						case ValueType.pixelIndex:
						case ValueType.systemPointer: {
							return new ListValue(
								i,
								0,
								v.value.values.length,
								v.value.values.map(value => new NumberValueTypePointer<NumberValueType>(+value, this.game)),
								'',
								this.game
							);
						}
						case ValueType.text: {
							return new ListValue(
								i,
								0,
								v.value.values.length,
								v.value.values.map(value => new NumberArrayValueTypePointer<TextValue>(+value, this.game)),
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
						[...(v.value as string)].map(c => c.charCodeAt(0)),
						(v.value as string).length,
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
				/*case InstructionType.DrawPixel : {
					return new DrawPixelInstruction();
				}*/
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
				/*case InstructionType.DrawText : {
					return new DrawTextInstruction();
				}*/
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
					if (values[+inst.params[0]].type === ValueType.text || values[+inst.params[0]].type === ValueType.list) {
						return new MutateValueInstruction(
							i,
							new NumberArrayValueTypePointer<NumberArrayValueType>(+inst.params[0], this.game),
							new NumberArrayValueTypePointer<NumberArrayValueType>(+inst.params[1], this.game),
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
						new InstructionSetPointer(+inst.params[2], this.game),
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
		const rootInstructionSet = gameData.compressedInstructionSets.findIndex(is => is.linked.findIndex(l => l.name.toLowerCase() === 'main') !== -1);

		this.game.setGameLogic(
			values,
			instructions,
			instructionSets,
			rootInstructionSet
		);
	}
}
