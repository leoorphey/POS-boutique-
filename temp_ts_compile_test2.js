const ts = require('typescript');
const tests = [
  {
    name: 'named-import-const-export',
    src: 'import { createCategorySchema as createCategorySchemaImport } from "./schemas/category.schema"; export const createCategorySchema = createCategorySchemaImport;'
  },
  {
    name: 'named-import-export',
    src: 'import { createCategorySchema } from "./schemas/category.schema"; export const createCategorySchema = createCategorySchema;'
  },
  {
    name: 'import-star-const-export',
    src: 'import * as categorySchema from "./schemas/category.schema"; export const createCategorySchema = categorySchema.createCategorySchema;'
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
