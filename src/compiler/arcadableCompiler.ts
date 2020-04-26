import { Arcadable } from "../model/arcadable";
import { SystemConfig } from "../model/systemConfig";

export class ArcadableCompiler {

    constructor(public config: SystemConfig, public docs: {[key: string]: string}) {

    }

    startCompile(): CompileResult {
        return {
            game: {},
            errors: {}
        } as CompileResult;
    }

    compile(file: string) {

    }
}

export class CompileResult {
    game?: Arcadable;
    errors?: string[];
}
