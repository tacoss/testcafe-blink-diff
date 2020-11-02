declare module 'testcafe-blink-diff' {
	/** Additional options to pass to takeSnapshot */
	interface TestcafeBlinkDiffOptions {
		/** Readable name for the taken snapshot */
		label?: string;
		/** Valid identifier for later comparison */
		as?: string;
		/** Custom folder for saving the taken snapshot */
		base?: string;
		/** Waiting time before taking snapshots */
		timeout?: number;
		/**
		 * String, or `Selector()` to match on the DOM
		 * @remark If you set `selector` as an array, then the list of _possible nodes_ will be used to the snapshot.
		 * @remark If no selectors are given, then it'll take page-screenshot of the visible content, unless `fullPage` is enabled.
		 */
		selector?: string | string[] | Selector | Selector[];
		/**
		 * List of `Selector()` nodes to "block-out" on the snapshot
		 * @remark "Block-out" means matched DOM nodes are covered by a solid-color overlay, helping to reduce unwanted differences if they change often, e.g. ads
		 */
		blockOut?: Selector | Selector[];
		/** Enable `fullPage: true` as options passed to `takeScreenshot(...)` */
		fullPage?: boolean;
	}

	/**
	 * Takes a snapshot using blink-diff
	 *
	 * Step 1: Call the `takeSnapshot()` helper within your tests, e.g.
	 *
	 * Step 2: Each time you run tests with `--take-snapshot base` it'll take the **base** screenshots.
	 *
	 * ```
	 * $ npx testcafe chrome:headless tests/e2e/cases -s tests/screenshots --take-snapshot
	 * ```
	 *
	 * Step 3: Now run the same tests `--take-snapshot actual` to take the **actual** screenshots to compare with.
	 *
	 * Step 4: Finally, invoke the CLI for generating a simple `generated/index.html` report, e.g.
	 *
	 * ```
	 * $ npx testcafe-blink-diff tests/screenshots --compare base:actual --open --threshold 0.03 # <= 3% is OK
	 * ```
	 *
	 * That's all, explore the generated report and enjoy!
	 *
	 * @description If the given selector does not exists on the DOM, a warning will be raised.
	 * @description Type `npx testcafe-blink-diff --help` to list all available options.
	 * @param t The TestController instance
	 * @param labelOrOptions Readable name for the taken snapshot, or the {@link TestcafeBlinkDiffOptions} options
	 * @param options Options to pass to the the takeSnapshot function
	 */
    export function takeSnapshot(t: TestController, labelOrOptions?: string | TestcafeBlinkDiffOptions, options?: TestcafeBlinkDiffOptions): TestController;
}
