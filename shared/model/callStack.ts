export class Executable {
	constructor(
		public action: () => Promise<Executable[]>,
		public async: boolean,
		public awaiting: Executable[],
		public parentAwait: Executable | null
	) {}
	withParentAwait(p: Executable): Executable {
		this.parentAwait = p;
		return this;
	}
}
export class CallStack {
	private storage: Executable[] = [];

	constructor(private capacity: number = Infinity) { }

	pushback(...items: Executable[]): void {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		this.storage.push(...items);
	}
	pushinfrontof(infrontof: Executable, ...items: Executable[]) {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		const index = this.storage.findIndex(e => e === infrontof);
		if(index !== -1) {
			this.storage.splice(index, 0, ...items);
		}
	}
	pushbehind(behind: Executable, ...items: Executable[]) {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		const index = this.storage.findIndex(e => e === behind);
		if(index !== -1) {
			this.storage.splice(index+1, 0, ...items);
		}
	}
	pushfront(...items: Executable[]): void {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		this.storage.splice(0, 0, ...items);
	}

	pop(): Executable | undefined {
		return this.storage.shift();
	}

	size(): number {
		return this.storage.length;
	}
}