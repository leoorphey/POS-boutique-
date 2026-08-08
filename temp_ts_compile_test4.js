const ts = require('typescript');
const tests = [
  {
    name: 'import-equals-export-const',
    src: 'import categorySchema = require("./schemas/category.schema");\nexport const createCategorySchema = categorySchema.createCategorySchema;\nexport type CreateCategoryInput = categorySchema.CreateCategoryInput;'
  },
  {
    name: 'import-equals-export-const-named-import',
    src: 'import { createCategorySchema } from "./schemas/category.schema";\nexport const createCategorySchema2 = createCategorySchema;'
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
