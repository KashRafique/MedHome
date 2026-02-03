#!/usr/bin/env node

/**
 * Merge Plan Generator
 * Generates actionable recommendations for merging two backends
 */

import * as fs from 'fs';
import * as path from 'path';

interface MergeRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'route' | 'model' | 'controller' | 'dependency' | 'architecture';
  action: string;
  description: string;
  files?: string[];
  conflicts?: string[];
}

interface MergePlan {
  baseRepository: string;
  recommendations: MergeRecommendation[];
  estimatedEffort: string;
  riskLevel: 'low' | 'medium' | 'high';
}

function analyzePackageJson(repo1Path: string, repo2Path: string): MergeRecommendation[] {
  const recommendations: MergeRecommendation[] = [];
  
  const pkg1Path = path.join(repo1Path, 'package.json');
  const pkg2Path = path.join(repo2Path, 'package.json');
  
  if (!fs.existsSync(pkg1Path) || !fs.existsSync(pkg2Path)) {
    return recommendations;
  }
  
  try {
    const pkg1 = JSON.parse(fs.readFileSync(pkg1Path, 'utf-8'));
    const pkg2 = JSON.parse(fs.readFileSync(pkg2Path, 'utf-8'));
    
    const deps1 = pkg1.dependencies || {};
    const deps2 = pkg2.dependencies || {};
    const devDeps1 = pkg1.devDependencies || {};
    const devDeps2 = pkg2.devDependencies || {};
    
    // Check for version conflicts
    const allDeps = new Set([...Object.keys(deps1), ...Object.keys(deps2)]);
    const versionConflicts: string[] = [];
    
    allDeps.forEach(dep => {
      if (deps1[dep] && deps2[dep] && deps1[dep] !== deps2[dep]) {
        versionConflicts.push(`${dep}: ${deps1[dep]} vs ${deps2[dep]}`);
      }
    });
    
    if (versionConflicts.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'dependency',
        action: 'Resolve dependency version conflicts',
        description: `Found ${versionConflicts.length} dependency version conflicts. Review and align versions.`,
        conflicts: versionConflicts
      });
    }
    
    // Check for missing dependencies
    const missingIn1: string[] = [];
    const missingIn2: string[] = [];
    
    Object.keys(deps2).forEach(dep => {
      if (!deps1[dep]) {
        missingIn1.push(dep);
      }
    });
    
    Object.keys(deps1).forEach(dep => {
      if (!deps2[dep]) {
        missingIn2.push(dep);
      }
    });
    
    if (missingIn1.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'dependency',
        action: 'Add missing dependencies from Repository 2',
        description: `Add ${missingIn1.length} dependencies that exist in Repository 2 but not in Repository 1.`,
        files: missingIn1
      });
    }
    
    if (missingIn2.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'dependency',
        action: 'Review dependencies unique to Repository 1',
        description: `Review ${missingIn2.length} dependencies that exist only in Repository 1.`,
        files: missingIn2
      });
    }
    
  } catch (error) {
    console.error('Error analyzing package.json:', error);
  }
  
  return recommendations;
}

function analyzeRoutes(repo1Path: string, repo2Path: string): MergeRecommendation[] {
  const recommendations: MergeRecommendation[] = [];
  
  const routes1Dir = path.join(repo1Path, 'src', 'routes');
  const routes2Dir = path.join(repo2Path, 'src', 'routes');
  
  if (!fs.existsSync(routes1Dir) || !fs.existsSync(routes2Dir)) {
    return recommendations;
  }
  
  const routes1 = fs.readdirSync(routes1Dir).filter(f => f.endsWith('.ts'));
  const routes2 = fs.readdirSync(routes2Dir).filter(f => f.endsWith('.ts'));
  
  const onlyIn2 = routes2.filter(r => !routes1.includes(r));
  const onlyIn1 = routes1.filter(r => !routes2.includes(r));
  
  if (onlyIn2.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'route',
      action: 'Port missing route files from Repository 2',
      description: `Add ${onlyIn2.length} route file(s) that exist in Repository 2 but not in Repository 1.`,
      files: onlyIn2.map(r => `src/routes/${r}`)
    });
  }
  
  if (onlyIn1.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'route',
      action: 'Review routes unique to Repository 1',
      description: `Review ${onlyIn1.length} route file(s) that exist only in Repository 1.`,
      files: onlyIn1.map(r => `src/routes/${r}`)
    });
  }
  
  // Check for route conflicts in common files
  const commonRoutes = routes1.filter(r => routes2.includes(r));
  if (commonRoutes.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'route',
      action: 'Review common route files for endpoint differences',
      description: `Review ${commonRoutes.length} route file(s) that exist in both repositories. Check for endpoint differences.`,
      files: commonRoutes.map(r => `src/routes/${r}`)
    });
  }
  
  return recommendations;
}

function analyzeModels(repo1Path: string, repo2Path: string): MergeRecommendation[] {
  const recommendations: MergeRecommendation[] = [];
  
  const models1Dir = path.join(repo1Path, 'src', 'models');
  const models2Dir = path.join(repo2Path, 'src', 'models');
  
  if (!fs.existsSync(models1Dir) || !fs.existsSync(models2Dir)) {
    return recommendations;
  }
  
  const models1 = fs.readdirSync(models1Dir).filter(f => f.endsWith('.ts'));
  const models2 = fs.readdirSync(models2Dir).filter(f => f.endsWith('.ts'));
  
  const onlyIn2 = models2.filter(m => !models1.includes(m));
  const onlyIn1 = models1.filter(m => !models2.includes(m));
  
  if (onlyIn2.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'model',
      action: 'Port missing model files from Repository 2',
      description: `Add ${onlyIn2.length} model file(s) that exist in Repository 2 but not in Repository 1.`,
      files: onlyIn2.map(m => `src/models/${m}`)
    });
  }
  
  if (onlyIn1.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'model',
      action: 'Review models unique to Repository 1',
      description: `Review ${onlyIn1.length} model file(s) that exist only in Repository 1.`,
      files: onlyIn1.map(m => `src/models/${m}`)
    });
  }
  
  // Check for schema conflicts in common models
  const commonModels = models1.filter(m => models2.includes(m));
  if (commonModels.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'model',
      action: 'Review schema differences in common models',
      description: `Review ${commonModels.length} model file(s) that exist in both repositories. Check for schema field differences that may require database migrations.`,
      files: commonModels.map(m => `src/models/${m}`)
    });
  }
  
  return recommendations;
}

function analyzeControllers(repo1Path: string, repo2Path: string): MergeRecommendation[] {
  const recommendations: MergeRecommendation[] = [];
  
  const controllers1Dir = path.join(repo1Path, 'src', 'controllers');
  const controllers2Dir = path.join(repo2Path, 'src', 'controllers');
  
  if (!fs.existsSync(controllers1Dir) || !fs.existsSync(controllers2Dir)) {
    return recommendations;
  }
  
  const controllers1 = fs.readdirSync(controllers1Dir).filter(f => f.endsWith('.ts'));
  const controllers2 = fs.readdirSync(controllers2Dir).filter(f => f.endsWith('.ts'));
  
  const onlyIn2 = controllers2.filter(c => !controllers1.includes(c));
  const onlyIn1 = controllers1.filter(c => !controllers2.includes(c));
  
  if (onlyIn2.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'controller',
      action: 'Port missing controller files from Repository 2',
      description: `Add ${onlyIn2.length} controller file(s) that exist in Repository 2 but not in Repository 1.`,
      files: onlyIn2.map(c => `src/controllers/${c}`)
    });
  }
  
  if (onlyIn1.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'controller',
      action: 'Review controllers unique to Repository 1',
      description: `Review ${onlyIn1.length} controller file(s) that exist only in Repository 1.`,
      files: onlyIn1.map(c => `src/controllers/${c}`)
    });
  }
  
  // Check for function signature conflicts in common controllers
  const commonControllers = controllers1.filter(c => controllers2.includes(c));
  if (commonControllers.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'controller',
      action: 'Review function signature differences in common controllers',
      description: `Review ${commonControllers.length} controller file(s) that exist in both repositories. Check for function signature differences that may break existing routes.`,
      files: commonControllers.map(c => `src/controllers/${c}`)
    });
  }
  
  return recommendations;
}

function determineBaseRepository(repo1Path: string, repo2Path: string): string {
  // Count files to determine which is more complete
  const countFiles = (dir: string): number => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        count += countFiles(fullPath);
      } else if (item.endsWith('.ts')) {
        count++;
      }
    }
    return count;
  };
  
  const src1 = path.join(repo1Path, 'src');
  const src2 = path.join(repo2Path, 'src');
  
  const count1 = countFiles(src1);
  const count2 = countFiles(src2);
  
  // Also check for package.json completeness
  const pkg1Path = path.join(repo1Path, 'package.json');
  const pkg2Path = path.join(repo2Path, 'package.json');
  
  let pkg1Deps = 0;
  let pkg2Deps = 0;
  
  if (fs.existsSync(pkg1Path)) {
    try {
      const pkg1 = JSON.parse(fs.readFileSync(pkg1Path, 'utf-8'));
      pkg1Deps = Object.keys(pkg1.dependencies || {}).length;
    } catch {}
  }
  
  if (fs.existsSync(pkg2Path)) {
    try {
      const pkg2 = JSON.parse(fs.readFileSync(pkg2Path, 'utf-8'));
      pkg2Deps = Object.keys(pkg2.dependencies || {}).length;
    } catch {}
  }
  
  // Determine base (prefer the more complete one)
  const score1 = count1 + pkg1Deps;
  const score2 = count2 + pkg2Deps;
  
  if (score1 >= score2) {
    return 'Repository 1 (more complete)';
  } else {
    return 'Repository 2 (more complete)';
  }
}

function estimateEffort(recommendations: MergeRecommendation[]): string {
  const high = recommendations.filter(r => r.priority === 'high').length;
  const medium = recommendations.filter(r => r.priority === 'medium').length;
  const low = recommendations.filter(r => r.priority === 'low').length;
  
  const hours = (high * 4) + (medium * 2) + (low * 0.5);
  
  if (hours <= 8) {
    return '1 day';
  } else if (hours <= 16) {
    return '2-3 days';
  } else if (hours <= 40) {
    return '1 week';
  } else {
    return '2+ weeks';
  }
}

function assessRisk(recommendations: MergeRecommendation[]): 'low' | 'medium' | 'high' {
  const highPriority = recommendations.filter(r => r.priority === 'high').length;
  const schemaConflicts = recommendations.filter(r => 
    r.category === 'model' && r.description.includes('schema')
  ).length;
  const versionConflicts = recommendations.filter(r => 
    r.category === 'dependency' && r.description.includes('version')
  ).length;
  
  if (highPriority > 10 || schemaConflicts > 5 || versionConflicts > 5) {
    return 'high';
  } else if (highPriority > 5 || schemaConflicts > 2 || versionConflicts > 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

function generateMergePlan(repo1Path: string, repo2Path: string): MergePlan {
  const recommendations: MergeRecommendation[] = [];
  
  // Analyze different aspects
  recommendations.push(...analyzePackageJson(repo1Path, repo2Path));
  recommendations.push(...analyzeRoutes(repo1Path, repo2Path));
  recommendations.push(...analyzeModels(repo1Path, repo2Path));
  recommendations.push(...analyzeControllers(repo1Path, repo2Path));
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  const baseRepo = determineBaseRepository(repo1Path, repo2Path);
  const effort = estimateEffort(recommendations);
  const risk = assessRisk(recommendations);
  
  return {
    baseRepository: baseRepo,
    recommendations,
    estimatedEffort: effort,
    riskLevel: risk
  };
}

function generateMarkdownPlan(plan: MergePlan, repo1Path: string, repo2Path: string): string {
  let markdown = `# Backend Merge Plan

**Generated:** ${new Date().toLocaleString()}

## Overview

- **Repository 1:** \`${repo1Path}\`
- **Repository 2:** \`${repo2Path}\`
- **Recommended Base:** ${plan.baseRepository}
- **Estimated Effort:** ${plan.estimatedEffort}
- **Risk Level:** ${plan.riskLevel.toUpperCase()}

---

## Merge Strategy

### Recommended Approach

1. **Use ${plan.baseRepository} as the base repository**
2. **Create a feature branch:** \`git checkout -b merge-backends\`
3. **Port features incrementally** following the priority order below
4. **Test after each major change** with both app and web frontends
5. **Resolve conflicts** as they arise, prioritizing data compatibility

### Risk Mitigation

${plan.riskLevel === 'high' ? 
  '⚠️ **HIGH RISK** - Consider:\n- Creating a comprehensive test suite before merging\n- Performing the merge in a staging environment first\n- Having a rollback plan ready\n- Coordinating closely with the backend developer' :
  plan.riskLevel === 'medium' ?
  '⚠️ **MEDIUM RISK** - Recommended:\n- Test thoroughly after each major change\n- Keep the backend developer informed of progress\n- Document any breaking changes' :
  '✅ **LOW RISK** - Standard merge process should be sufficient'
}

---

## Prioritized Action Items

### High Priority

`;

  const highPriority = plan.recommendations.filter(r => r.priority === 'high');
  if (highPriority.length > 0) {
    highPriority.forEach((rec, index) => {
      markdown += `#### ${index + 1}. ${rec.action}\n\n`;
      markdown += `**Category:** ${rec.category}\n\n`;
      markdown += `${rec.description}\n\n`;
      if (rec.files && rec.files.length > 0) {
        markdown += `**Files to review:**\n`;
        rec.files.forEach(file => {
          markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
      }
      if (rec.conflicts && rec.conflicts.length > 0) {
        markdown += `**Conflicts:**\n`;
        rec.conflicts.forEach(conflict => {
          markdown += `- ${conflict}\n`;
        });
        markdown += `\n`;
      }
    });
  } else {
    markdown += `*No high priority items*\n\n`;
  }

  markdown += `\n### Medium Priority\n\n`;

  const mediumPriority = plan.recommendations.filter(r => r.priority === 'medium');
  if (mediumPriority.length > 0) {
    mediumPriority.forEach((rec, index) => {
      markdown += `#### ${index + 1}. ${rec.action}\n\n`;
      markdown += `**Category:** ${rec.category}\n\n`;
      markdown += `${rec.description}\n\n`;
      if (rec.files && rec.files.length > 0) {
        markdown += `**Files to review:**\n`;
        rec.files.forEach(file => {
          markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
      }
    });
  } else {
    markdown += `*No medium priority items*\n\n`;
  }

  markdown += `\n### Low Priority\n\n`;

  const lowPriority = plan.recommendations.filter(r => r.priority === 'low');
  if (lowPriority.length > 0) {
    lowPriority.forEach((rec, index) => {
      markdown += `#### ${index + 1}. ${rec.action}\n\n`;
      markdown += `**Category:** ${rec.category}\n\n`;
      markdown += `${rec.description}\n\n`;
      if (rec.files && rec.files.length > 0) {
        markdown += `**Files to review:**\n`;
        rec.files.forEach(file => {
          markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
      }
    });
  } else {
    markdown += `*No low priority items*\n\n`;
  }

  markdown += `\n---\n\n## Merge Checklist\n\n`;

  const categories = ['dependency', 'model', 'route', 'controller'];
  categories.forEach(category => {
    const categoryRecs = plan.recommendations.filter(r => r.category === category);
    if (categoryRecs.length > 0) {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}s\n\n`;
      categoryRecs.forEach(rec => {
        markdown += `- [ ] ${rec.action}\n`;
      });
      markdown += `\n`;
    }
  });

  markdown += `### Testing\n\n`;
  markdown += `- [ ] Test all API endpoints with web frontend\n`;
  markdown += `- [ ] Test all API endpoints with app frontend\n`;
  markdown += `- [ ] Verify authentication works for both clients\n`;
  markdown += `- [ ] Test file uploads from both clients\n`;
  markdown += `- [ ] Verify database migrations (if any)\n`;
  markdown += `- [ ] Check CORS configuration for both origins\n\n`;

  markdown += `---\n\n## Next Steps\n\n`;
  markdown += `1. Review this plan with your backend developer\n`;
  markdown += `2. Create a feature branch for the merge\n`;
  markdown += `3. Start with high priority items\n`;
  markdown += `4. Test incrementally after each major change\n`;
  markdown += `5. Document any breaking changes\n`;
  markdown += `6. Update API documentation if needed\n\n`;

  markdown += `---\n\n*Plan generated by generate-merge-plan.ts*\n`;

  return markdown;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: ts-node generate-merge-plan.ts <repo1-path> <repo2-path> [output-file]');
  process.exit(1);
}

const repo1Path = path.resolve(args[0]);
const repo2Path = path.resolve(args[1]);
const outputFile = args[2] || 'backend-merge-plan.md';

if (!fs.existsSync(repo1Path)) {
  console.error(`Error: Repository 1 path does not exist: ${repo1Path}`);
  process.exit(1);
}

if (!fs.existsSync(repo2Path)) {
  console.error(`Error: Repository 2 path does not exist: ${repo2Path}`);
  process.exit(1);
}

console.log('Generating merge plan...');
console.log(`Repository 1: ${repo1Path}`);
console.log(`Repository 2: ${repo2Path}`);

const plan = generateMergePlan(repo1Path, repo2Path);
const markdown = generateMarkdownPlan(plan, repo1Path, repo2Path);

fs.writeFileSync(outputFile, markdown, 'utf-8');

console.log(`\nMerge plan generated successfully!`);
console.log(`Plan saved to: ${outputFile}`);
console.log(`\nSummary:`);
console.log(`- Base Repository: ${plan.baseRepository}`);
console.log(`- Total Recommendations: ${plan.recommendations.length}`);
console.log(`- High Priority: ${plan.recommendations.filter(r => r.priority === 'high').length}`);
console.log(`- Estimated Effort: ${plan.estimatedEffort}`);
console.log(`- Risk Level: ${plan.riskLevel.toUpperCase()}`);
