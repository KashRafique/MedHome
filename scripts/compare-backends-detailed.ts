#!/usr/bin/env node

/**
 * Detailed Backend Comparison Tool
 * Performs deep code analysis of two backend repositories
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  file: string;
  method: string;
  path: string;
  middleware?: string[];
  controller?: string;
}

interface ModelField {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
  unique?: boolean;
  enum?: string[];
}

interface ModelInfo {
  file: string;
  name: string;
  fields: ModelField[];
  indexes?: string[];
}

interface ControllerFunction {
  name: string;
  parameters: string[];
  returnType?: string;
}

interface ControllerInfo {
  file: string;
  functions: ControllerFunction[];
}

interface ComparisonResult {
  routes: {
    repo1Only: RouteInfo[];
    repo2Only: RouteInfo[];
    inBoth: RouteInfo[];
  };
  models: {
    repo1Only: ModelInfo[];
    repo2Only: ModelInfo[];
    inBoth: ModelInfo[];
    differences: Array<{
      model: string;
      field: string;
      repo1Value: string;
      repo2Value: string;
    }>;
  };
  controllers: {
    repo1Only: ControllerInfo[];
    repo2Only: ControllerInfo[];
    inBoth: ControllerInfo[];
    functionDifferences: Array<{
      controller: string;
      function: string;
      repo1Params: string[];
      repo2Params: string[];
    }>;
  };
}

function extractRoutes(filePath: string, repoName: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  if (!fs.existsSync(filePath)) {
    return routes;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const router = path.basename(filePath, '.ts');
  
  // Match route definitions: router.get('/path', middleware, controller)
  const routeRegex = /router\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*([^)]+)\)/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const rest = match[3];
    
    // Extract middleware and controller
    const parts = rest.split(',').map(p => p.trim());
    const middleware: string[] = [];
    let controller: string | undefined;
    
    parts.forEach(part => {
      if (part.includes('authenticateToken') || part.includes('auth')) {
        middleware.push('auth');
      } else if (part.includes('Controller') || part.includes('controller')) {
        controller = part.replace(/.*controller\.(\w+).*/, '$1');
      }
    });
    
    routes.push({
      file: router,
      method,
      path: routePath,
      middleware: middleware.length > 0 ? middleware : undefined,
      controller
    });
  }
  
  return routes;
}

function extractModelFields(content: string): ModelField[] {
  const fields: ModelField[] = [];
  
  // Match schema field definitions
  const fieldRegex = /(\w+):\s*\{[^}]*type:\s*(\w+)[^}]*\}/g;
  const detailedFieldRegex = /(\w+):\s*\{([^}]+)\}/g;
  
  let match;
  while ((match = detailedFieldRegex.exec(content)) !== null) {
    const fieldName = match[1];
    const fieldDef = match[2];
    
    const typeMatch = fieldDef.match(/type:\s*(\w+|\[.*?\])/);
    const requiredMatch = fieldDef.match(/required:\s*(true|false|function)/);
    const defaultMatch = fieldDef.match(/default:\s*([^,}]+)/);
    const uniqueMatch = fieldDef.match(/unique:\s*(true|false)/);
    const enumMatch = fieldDef.match(/enum:\s*\[([^\]]+)\]/);
    
    fields.push({
      name: fieldName,
      type: typeMatch ? typeMatch[1].trim() : 'Mixed',
      required: requiredMatch ? requiredMatch[1] === 'true' : undefined,
      default: defaultMatch ? defaultMatch[1].trim() : undefined,
      unique: uniqueMatch ? uniqueMatch[1] === 'true' : undefined,
      enum: enumMatch ? enumMatch[1].split(',').map(e => e.trim().replace(/['"]/g, '')) : undefined
    });
  }
  
  return fields;
}

function extractModelInfo(filePath: string): ModelInfo | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.ts');
  
  // Extract model name (usually from Schema or interface)
  const schemaMatch = content.match(/new\s+Schema<(\w+)>/);
  const interfaceMatch = content.match(/interface\s+I?(\w+)\s+extends/);
  const modelName = schemaMatch ? schemaMatch[1] : (interfaceMatch ? interfaceMatch[1] : fileName);
  
  const fields = extractModelFields(content);
  
  return {
    file: fileName,
    name: modelName,
    fields
  };
}

function extractControllerFunctions(filePath: string): ControllerFunction[] {
  const functions: ControllerFunction[] = [];
  
  if (!fs.existsSync(filePath)) {
    return functions;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Match exported functions: export const functionName = async (req, res) => {}
  const functionRegex = /export\s+(const|async\s+function|function)\s+(\w+)\s*[=:]\s*(?:async\s*)?\(([^)]*)\)/g;
  
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const funcName = match[2];
    const params = match[3].split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p);
    
    functions.push({
      name: funcName,
      parameters: params
    });
  }
  
  return functions;
}

function getAllFiles(dir: string, extension: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function compareBackends(repo1Path: string, repo2Path: string): ComparisonResult {
  const result: ComparisonResult = {
    routes: { repo1Only: [], repo2Only: [], inBoth: [] },
    models: { repo1Only: [], repo2Only: [], inBoth: [], differences: [] },
    controllers: { repo1Only: [], repo2Only: [], inBoth: [], functionDifferences: [] }
  };
  
  // Extract routes
  const repo1RoutesDir = path.join(repo1Path, 'src', 'routes');
  const repo2RoutesDir = path.join(repo2Path, 'src', 'routes');
  
  const repo1RouteFiles = getAllFiles(repo1RoutesDir, '.ts');
  const repo2RouteFiles = getAllFiles(repo2RoutesDir, '.ts');
  
  const repo1Routes: RouteInfo[] = [];
  const repo2Routes: RouteInfo[] = [];
  
  repo1RouteFiles.forEach(file => {
    repo1Routes.push(...extractRoutes(file, 'repo1'));
  });
  
  repo2RouteFiles.forEach(file => {
    repo2Routes.push(...extractRoutes(file, 'repo2'));
  });
  
  // Compare routes
  repo1Routes.forEach(route => {
    const match = repo2Routes.find(r => 
      r.method === route.method && 
      r.path === route.path &&
      r.file === route.file
    );
    
    if (match) {
      result.routes.inBoth.push(route);
    } else {
      result.routes.repo1Only.push(route);
    }
  });
  
  repo2Routes.forEach(route => {
    const match = repo1Routes.find(r => 
      r.method === route.method && 
      r.path === route.path &&
      r.file === route.file
    );
    
    if (!match) {
      result.routes.repo2Only.push(route);
    }
  });
  
  // Extract models
  const repo1ModelsDir = path.join(repo1Path, 'src', 'models');
  const repo2ModelsDir = path.join(repo2Path, 'src', 'models');
  
  const repo1ModelFiles = getAllFiles(repo1ModelsDir, '.ts');
  const repo2ModelFiles = getAllFiles(repo2ModelsDir, '.ts');
  
  const repo1Models: Map<string, ModelInfo> = new Map();
  const repo2Models: Map<string, ModelInfo> = new Map();
  
  repo1ModelFiles.forEach(file => {
    const model = extractModelInfo(file);
    if (model) {
      repo1Models.set(model.file, model);
    }
  });
  
  repo2ModelFiles.forEach(file => {
    const model = extractModelInfo(file);
    if (model) {
      repo2Models.set(model.file, model);
    }
  });
  
  // Compare models
  repo1Models.forEach((model, key) => {
    const otherModel = repo2Models.get(key);
    
    if (otherModel) {
      result.models.inBoth.push(model);
      
      // Compare fields
      const repo1Fields = new Map(model.fields.map(f => [f.name, f]));
      const repo2Fields = new Map(otherModel.fields.map(f => [f.name, f]));
      
      repo1Fields.forEach((field, fieldName) => {
        const otherField = repo2Fields.get(fieldName);
        if (otherField) {
          const type1 = field.type || 'undefined';
          const type2 = otherField.type || 'undefined';
          if (type1 !== type2) {
            result.models.differences.push({
              model: key,
              field: fieldName,
              repo1Value: type1,
              repo2Value: type2
            });
          }
        }
      });
    } else {
      result.models.repo1Only.push(model);
    }
  });
  
  repo2Models.forEach((model, key) => {
    if (!repo1Models.has(key)) {
      result.models.repo2Only.push(model);
    }
  });
  
  // Extract controllers
  const repo1ControllersDir = path.join(repo1Path, 'src', 'controllers');
  const repo2ControllersDir = path.join(repo2Path, 'src', 'controllers');
  
  const repo1ControllerFiles = getAllFiles(repo1ControllersDir, '.ts');
  const repo2ControllerFiles = getAllFiles(repo2ControllersDir, '.ts');
  
  const repo1Controllers: Map<string, ControllerInfo> = new Map();
  const repo2Controllers: Map<string, ControllerInfo> = new Map();
  
  repo1ControllerFiles.forEach(file => {
    const fileName = path.basename(file, '.ts');
    const functions = extractControllerFunctions(file);
    repo1Controllers.set(fileName, { file: fileName, functions });
  });
  
  repo2ControllerFiles.forEach(file => {
    const fileName = path.basename(file, '.ts');
    const functions = extractControllerFunctions(file);
    repo2Controllers.set(fileName, { file: fileName, functions });
  });
  
  // Compare controllers
  repo1Controllers.forEach((controller, key) => {
    const otherController = repo2Controllers.get(key);
    
    if (otherController) {
      result.controllers.inBoth.push(controller);
      
      // Compare functions
      const repo1Funcs = new Map(controller.functions.map(f => [f.name, f]));
      const repo2Funcs = new Map(otherController.functions.map(f => [f.name, f]));
      
      repo1Funcs.forEach((func, funcName) => {
        const otherFunc = repo2Funcs.get(funcName);
        if (otherFunc) {
          const params1 = func.parameters.join(', ');
          const params2 = otherFunc.parameters.join(', ');
          if (params1 !== params2) {
            result.controllers.functionDifferences.push({
              controller: key,
              function: funcName,
              repo1Params: func.parameters,
              repo2Params: otherFunc.parameters
            });
          }
        }
      });
    } else {
      result.controllers.repo1Only.push(controller);
    }
  });
  
  repo2Controllers.forEach((controller, key) => {
    if (!repo1Controllers.has(key)) {
      result.controllers.repo2Only.push(controller);
    }
  });
  
  return result;
}

function generateMarkdownReport(result: ComparisonResult, repo1Path: string, repo2Path: string): string {
  const timestamp = new Date().toISOString();
  
  let markdown = `# Detailed Backend Comparison Report

**Generated:** ${new Date().toLocaleString()}

## Repository Paths

- **Repository 1:** \`${repo1Path}\`
- **Repository 2:** \`${repo2Path}\`

---

## Executive Summary

### Routes
- **Routes only in Repo 1:** ${result.routes.repo1Only.length}
- **Routes only in Repo 2:** ${result.routes.repo2Only.length}
- **Routes in both:** ${result.routes.inBoth.length}

### Models
- **Models only in Repo 1:** ${result.models.repo1Only.length}
- **Models only in Repo 2:** ${result.models.repo2Only.length}
- **Models in both:** ${result.models.inBoth.length}
- **Schema differences:** ${result.models.differences.length}

### Controllers
- **Controllers only in Repo 1:** ${result.controllers.repo1Only.length}
- **Controllers only in Repo 2:** ${result.controllers.repo2Only.length}
- **Controllers in both:** ${result.controllers.inBoth.length}
- **Function signature differences:** ${result.controllers.functionDifferences.length}

---

## Route Comparison

### Routes Only in Repository 1

`;

  if (result.routes.repo1Only.length > 0) {
    markdown += `| Method | Path | File | Middleware |\n`;
    markdown += `|--------|------|------|------------|\n`;
    result.routes.repo1Only.forEach(route => {
      markdown += `| ${route.method} | \`${route.path}\` | ${route.file} | ${route.middleware?.join(', ') || '-'} |\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Routes Only in Repository 2\n\n`;

  if (result.routes.repo2Only.length > 0) {
    markdown += `| Method | Path | File | Middleware |\n`;
    markdown += `|--------|------|------|------------|\n`;
    result.routes.repo2Only.forEach(route => {
      markdown += `| ${route.method} | \`${route.path}\` | ${route.file} | ${route.middleware?.join(', ') || '-'} |\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Routes in Both Repositories\n\n`;

  if (result.routes.inBoth.length > 0) {
    markdown += `| Method | Path | File |\n`;
    markdown += `|--------|------|------|\n`;
    result.routes.inBoth.forEach(route => {
      markdown += `| ${route.method} | \`${route.path}\` | ${route.file} |\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n---\n\n## Model Comparison\n\n### Models Only in Repository 1\n\n`;

  if (result.models.repo1Only.length > 0) {
    result.models.repo1Only.forEach(model => {
      markdown += `#### ${model.name} (\`${model.file}.ts\`)\n\n`;
      if (model.fields.length > 0) {
        markdown += `| Field | Type | Required |\n`;
        markdown += `|-------|------|----------|\n`;
        model.fields.forEach(field => {
          markdown += `| ${field.name} | ${field.type} | ${field.required ? 'Yes' : 'No'} |\n`;
        });
      }
      markdown += `\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Models Only in Repository 2\n\n`;

  if (result.models.repo2Only.length > 0) {
    result.models.repo2Only.forEach(model => {
      markdown += `#### ${model.name} (\`${model.file}.ts\`)\n\n`;
      if (model.fields.length > 0) {
        markdown += `| Field | Type | Required |\n`;
        markdown += `|-------|------|----------|\n`;
        model.fields.forEach(field => {
          markdown += `| ${field.name} | ${field.type} | ${field.required ? 'Yes' : 'No'} |\n`;
        });
      }
      markdown += `\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Schema Differences in Common Models\n\n`;

  if (result.models.differences.length > 0) {
    markdown += `| Model | Field | Repo 1 Type | Repo 2 Type |\n`;
    markdown += `|-------|-------|-------------|-------------|\n`;
    result.models.differences.forEach(diff => {
      markdown += `| ${diff.model} | ${diff.field} | \`${diff.repo1Value}\` | \`${diff.repo2Value}\` |\n`;
    });
  } else {
    markdown += `*No schema differences found*\n`;
  }

  markdown += `\n---\n\n## Controller Comparison\n\n### Controllers Only in Repository 1\n\n`;

  if (result.controllers.repo1Only.length > 0) {
    result.controllers.repo1Only.forEach(controller => {
      markdown += `#### ${controller.file}\n\n`;
      if (controller.functions.length > 0) {
        controller.functions.forEach(func => {
          markdown += `- \`${func.name}(${func.parameters.join(', ')})\`\n`;
        });
      }
      markdown += `\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Controllers Only in Repository 2\n\n`;

  if (result.controllers.repo2Only.length > 0) {
    result.controllers.repo2Only.forEach(controller => {
      markdown += `#### ${controller.file}\n\n`;
      if (controller.functions.length > 0) {
        controller.functions.forEach(func => {
          markdown += `- \`${func.name}(${func.parameters.join(', ')})\`\n`;
        });
      }
      markdown += `\n`;
    });
  } else {
    markdown += `*None*\n`;
  }

  markdown += `\n### Function Signature Differences\n\n`;

  if (result.controllers.functionDifferences.length > 0) {
    markdown += `| Controller | Function | Repo 1 Parameters | Repo 2 Parameters |\n`;
    markdown += `|------------|----------|-------------------|-------------------|\n`;
    result.controllers.functionDifferences.forEach(diff => {
      markdown += `| ${diff.controller} | ${diff.function} | \`${diff.repo1Params.join(', ')}\` | \`${diff.repo2Params.join(', ')}\` |\n`;
    });
  } else {
    markdown += `*No function signature differences found*\n`;
  }

  markdown += `\n---\n\n## Recommendations\n\n1. **Review unique routes** in each repository to identify missing features\n`;
  markdown += `2. **Examine schema differences** to ensure data compatibility\n`;
  markdown += `3. **Check controller function signatures** for breaking changes\n`;
  markdown += `4. **Use the merge plan generator** to create an actionable merge strategy\n\n`;
  markdown += `---\n\n*Report generated by compare-backends-detailed.ts*\n`;

  return markdown;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: ts-node compare-backends-detailed.ts <repo1-path> <repo2-path> [output-file]');
  process.exit(1);
}

const repo1Path = path.resolve(args[0]);
const repo2Path = path.resolve(args[1]);
const outputFile = args[2] || 'backend-comparison-detailed.md';

if (!fs.existsSync(repo1Path)) {
  console.error(`Error: Repository 1 path does not exist: ${repo1Path}`);
  process.exit(1);
}

if (!fs.existsSync(repo2Path)) {
  console.error(`Error: Repository 2 path does not exist: ${repo2Path}`);
  process.exit(1);
}

console.log('Analyzing backends...');
console.log(`Repository 1: ${repo1Path}`);
console.log(`Repository 2: ${repo2Path}`);

const result = compareBackends(repo1Path, repo2Path);
const markdown = generateMarkdownReport(result, repo1Path, repo2Path);

fs.writeFileSync(outputFile, markdown, 'utf-8');

console.log(`\nDetailed comparison complete!`);
console.log(`Report saved to: ${outputFile}`);
