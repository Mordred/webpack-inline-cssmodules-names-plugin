const HarmonyImportSideEffectDependency = require('webpack/lib/dependencies/HarmonyImportSideEffectDependency');
const HarmonyImportSpecifierDependency = require('webpack/lib/dependencies/HarmonyImportSpecifierDependency');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');
const SourceLocation = require("acorn").SourceLocation; // TODO: Should be listed in peerDependency?

function removeDependency(module, dep) {
    module.removeDependency(dep);
    dep.module.reasons = dep.module.reasons.filter(r => r.dependency !== dep);
}

class InlineCSSModuleNamesPlugin {
	/*
	 * `matchers` is a regular expression or an array of regular expressions that are used
	 * to match module paths. Only constants from matching modules will be inlined.
	 */
    constructor(matchers) {
        if (Array.isArray(matchers)) {
            this.matchers = matchers;
        } else {
            this.matchers = [matchers];
        }
    }

    isConstantsModule(module) {
        return module && this.matchers.some(matcher => matcher.test(module.resource));
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap(
            'InlineCSSModuleNamesPlugin',
            (compilation, { normalModuleFactory }) => {
                compilation.hooks.optimizeDependencies.tap('InlineCSSModuleNamesPlugin', (modules) => {
                    for (const module of modules) {

                        const importSideEffectDependencies = new Map(); // Module -> Dependency
                        const usesConstantDependencies = new Map(); // Module -> Boolean
                        const usesNonConstantDependencies = new Map(); // Module -> Boolean
                        const importSpecifierDependencies = []; // [ ImportSpecifierDependency ]

                        for (const dep of module.dependencies) {
                            if (!this.isConstantsModule(dep.module)) {
                                continue;
                            }

                            /*
                             * The ImportSideEffectDependency is created whenever webpack sees an import statement:
                             *   import { foo } from 'foo'
                             * Webpack replaces the statement with code that loads the module and executes it
                             *
                             * We track these dependencies per-module because if all the imported bindings
                             * turn out to be constants and we inline them, we'll remove the import completely.
                             * That means that we treat constant modules as side-effect fee, i.e., we can safely
                             * remove the import.
                             */
                            if (dep instanceof HarmonyImportSideEffectDependency) {
                                importSideEffectDependencies.set(dep.module, dep);
                            }

                            if (dep instanceof HarmonyImportSpecifierDependency) {
                                const classNames = JSON.parse(dep.module._source.source().match(/{.*}/s)[0]);

                                let canRemove = true;

                                let value;
                                // Clone
                                let loc = new SourceLocation(module.parser, dep.loc.start, dep.loc.end);
                                let range = dep.range;

                                // styles.Example - dot object access
                                const simple = module._source.source().slice(dep.range[1]).match(/^\.(\w+)/);
                                if (simple) {
                                    value = classNames[simple[1]];
                                    loc.end = loc.end.offset(simple[0].length);
                                    range[1] += simple[0].length;
                                }

                                const bracked = module._source.source().slice(dep.range[1]).match(/^\[(.+?)\]/);
                                if (bracked) {
                                    const key = bracked[1];
                                    if (key[0] === "'" || key[0] === '"') {
                                        // styles['Example'] or styles["Example"]
                                        value = classNames[bracked[1].substr(1, bracked[1].length - 2)];
                                        loc.end = loc.end.offset(bracked[0].length);
                                        range[1] += bracked[0].length;
                                    } else if (key[0] === '`') {
                                        // styles[`Example`] - template string
                                        // This case is problematic, because it can contains variables - in that case we cannot inline classname
                                        if (/\${.+}/.test(key)) {
                                            // We have variable in the template string - ignore
                                            continue
                                        } else {
                                            value = classNames[bracked[1].substr(1, bracked[1].length - 2)];
                                            loc.end = loc.end.offset(bracked[0].length);
                                            range[1] += bracked[0].length;
                                        }
                                    }
                                }

                                const inlineDep = new ConstDependency(`/* inline-classname */ ${value ? '"' + value + '"' : value}`, dep.range);
                                inlineDep.loc = loc;
                                module.addDependency(inlineDep);

                                // Mark the dependency for removal: we'll remove it after we're finished
                                // traversing the dependency graph.
                                importSpecifierDependencies.push(dep);

                                /* Remember the fact that we inlined some constant. We remove import statements
                                 * only for modules where we inlined at least something. The other modules we
                                 * leave as they are. */
                                usesConstantDependencies.set(dep.module, true);
                            }
                        }

                        /* Remove the import statements if all the imported bindings were inlined */
                        for (const [depModule, depImport] of importSideEffectDependencies) {
                            if (usesConstantDependencies.get(depModule)) {
                                removeDependency(module, depImport);
                            }
                        }

                        /* Remove the ImportSpecifierDependencies that were replaced with ConstDependencies */
                        for (const dep of importSpecifierDependencies) {
                            removeDependency(module, dep);
                        }
                    }
                });
            }
        );
    }
}

module.exports = InlineCSSModuleNamesPlugin;