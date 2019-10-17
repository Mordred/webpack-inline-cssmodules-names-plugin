const HarmonyImportSideEffectDependency = require('webpack/lib/dependencies/HarmonyImportSideEffectDependency');
const HarmonyImportSpecifierDependency = require('webpack/lib/dependencies/HarmonyImportSpecifierDependency');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');

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
                                // Mark the dependency for removal: we'll remove it after we're finished
                                // traversing the dependency graph.
                                importSpecifierDependencies.push( dep );

                                const classNames = dep.module._source.source().replace('module.exports = ', '').replace(/;$/, '');
                                const inlineDep = new ConstDependency('/* inline */ ' + classNames, dep.range);
                                inlineDep.loc = dep.loc;
                                module.addDependency(inlineDep);

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