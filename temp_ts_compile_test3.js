const ts = require('typescript');
const tests = [
  {
    name: 'export-const-require',
    src: 'export const createCategorySchema = require("./schemas/category.schema").createCategorySchema;'
  },
  {
    name: 'export-type-import',
    src: 'export type CreateCategoryInput = import("./schemas/category.schema").CreateCategoryInput;'
  }
];
for (const test of tests) {
  console.log('---', test.name, '---');
  console.log(ts.transpileModule(test.src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    }
  }).outputText);
}
