const ts = require('typescript');
const tests = [
  {
    name: 'export-from',
    src: 'export { createCategorySchema } from "./schemas/category.schema";'
  },
  {
    name: 'import-star-export-const',
    src: 'import * as category_schema_1 from "./schemas/category.schema"; export const createCategorySchema = category_schema_1.createCategorySchema;'
  },
  {
    name: 'import-named-export-named',
    src: 'import { createCategorySchema } from "./schemas/category.schema"; export { createCategorySchema };'
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
