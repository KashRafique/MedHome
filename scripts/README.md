# Backend Comparison Tool Suite

This directory contains tools to compare and merge two backend repositories for the MedHome project.

## Tools Overview

### 1. `compare-backends.ps1`
PowerShell script for quick structural comparison of two backend directories.

**Features:**
- Compares directory structures
- Lists files in routes, models, controllers, and services
- Compares `package.json` dependencies
- Generates a quick Markdown summary

### 2. `compare-backends-detailed.ts`
TypeScript tool for deep code analysis of backend repositories.

**Features:**
- Parses route definitions (endpoints, methods, middleware)
- Compares Mongoose model schemas (fields, types, validations)
- Analyzes controller implementations (function signatures)
- Generates detailed Markdown report with code-level differences

### 3. `generate-merge-plan.ts`
Generates actionable merge recommendations based on comparison results.

**Features:**
- Identifies which backend should be the base
- Lists features to port from each backend
- Creates a prioritized merge checklist
- Suggests conflict resolution strategies
- Estimates effort and risk level

## Prerequisites

- **PowerShell** (Windows) or PowerShell Core (cross-platform)
- **Node.js** (v18 or higher)
- **TypeScript** (installed globally or via npx)
- **ts-node** (for running TypeScript files directly)

### Installing TypeScript and ts-node

```bash
npm install -g typescript ts-node
```

Or use npx (no installation needed):
```bash
npx ts-node scripts/compare-backends-detailed.ts
```

## Usage

### Step 1: Clone Both Repositories

First, clone both backend repositories to temporary directories:

```bash
# Clone repositories
git clone https://github.com/talhareh/medhomie.git temp-medhomie
git clone https://github.com/KashRafique/MedHome.git temp-medhome
```

### Step 2: Run Quick Comparison (PowerShell)

Run the PowerShell script to get a quick overview:

```powershell
.\scripts\compare-backends.ps1 `
    -Repo1Path "temp-medhomie\backend" `
    -Repo2Path "temp-medhome\backend" `
    -OutputFile "backend-comparison-quick.md"
```

**Output:** `backend-comparison-quick.md`

This will generate a report with:
- File count comparisons
- Route, model, and controller file listings
- Dependency differences
- Quick summary

### Step 3: Run Detailed Analysis (TypeScript)

Run the TypeScript tool for deep code analysis:

```bash
# Using npx (recommended)
npx ts-node scripts/compare-backends-detailed.ts temp-medhomie/backend temp-medhome/backend

# Or if ts-node is installed globally
ts-node scripts/compare-backends-detailed.ts temp-medhomie/backend temp-medhome/backend
```

**Output:** `backend-comparison-detailed.md`

This will generate a detailed report with:
- Route endpoint comparisons
- Model schema differences
- Controller function signature differences
- Code-level analysis

### Step 4: Generate Merge Plan

Generate actionable merge recommendations:

```bash
npx ts-node scripts/generate-merge-plan.ts temp-medhomie/backend temp-medhome/backend
```

**Output:** `backend-merge-plan.md`

This will generate a merge plan with:
- Recommended base repository
- Prioritized action items
- Risk assessment
- Estimated effort
- Merge checklist

## Complete Workflow Example

```powershell
# 1. Clone repositories
git clone https://github.com/talhareh/medhomie.git temp-medhomie
git clone https://github.com/KashRafique/MedHome.git temp-medhome

# 2. Quick comparison
.\scripts\compare-backends.ps1 `
    -Repo1Path "temp-medhomie\backend" `
    -Repo2Path "temp-medhome\backend"

# 3. Detailed analysis
npx ts-node scripts/compare-backends-detailed.ts temp-medhomie/backend temp-medhome/backend

# 4. Generate merge plan
npx ts-node scripts/generate-merge-plan.ts temp-medhomie/backend temp-medhome/backend

# 5. Review generated reports
# - backend-comparison-quick.md
# - backend-comparison-detailed.md
# - backend-merge-plan.md
```

## Output Files

All tools generate Markdown files that can be viewed in any Markdown viewer or GitHub:

1. **backend-comparison-quick.md** - Quick structural comparison
2. **backend-comparison-detailed.md** - Detailed code analysis
3. **backend-merge-plan.md** - Actionable merge recommendations

## Understanding the Reports

### Quick Comparison Report
- **File Counts**: See how many routes, models, controllers each backend has
- **File Lists**: See which files exist in each backend
- **Dependency Differences**: See package version conflicts

### Detailed Comparison Report
- **Route Comparison**: See exact endpoint differences
- **Model Schema Differences**: See field-level schema differences
- **Controller Differences**: See function signature differences

### Merge Plan
- **Base Repository**: Which backend to use as the foundation
- **Prioritized Actions**: What to do first, second, etc.
- **Risk Assessment**: How risky the merge will be
- **Effort Estimate**: How long it might take

## Tips for Merging

1. **Start with the merge plan** - It provides the recommended approach
2. **Work incrementally** - Don't try to merge everything at once
3. **Test frequently** - Test with both app and web frontends after each major change
4. **Coordinate with backend developer** - Share the reports and get their input
5. **Use version control** - Create a feature branch for the merge
6. **Document changes** - Keep track of what you've merged

## Troubleshooting

### PowerShell Script Issues

**Error: "Execution policy restricted"**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Error: "Path does not exist"**
- Ensure you're using the correct path to the `backend` directory (not the root repository)
- Use absolute paths if relative paths don't work

### TypeScript Tool Issues

**Error: "Cannot find module 'ts-node'"**
```bash
npm install -g ts-node typescript
# Or use npx
npx ts-node scripts/compare-backends-detailed.ts
```

**Error: "Cannot find module"**
- Ensure you're running from the project root directory
- Check that Node.js is installed: `node --version`

**Error: "File not found"**
- Ensure the backend directories exist and contain `src` folders
- Check that you're pointing to the `backend` directory, not the repository root

## Customization

### Changing Output File Names

All tools accept an optional output file parameter:

```powershell
# PowerShell
.\scripts\compare-backends.ps1 -Repo1Path "path1" -Repo2Path "path2" -OutputFile "my-report.md"
```

```bash
# TypeScript tools
npx ts-node scripts/compare-backends-detailed.ts path1 path2 my-detailed-report.md
npx ts-node scripts/generate-merge-plan.ts path1 path2 my-merge-plan.md
```

## Support

If you encounter issues:
1. Check that all prerequisites are installed
2. Verify the repository paths are correct
3. Ensure the backend directories have the expected structure (`src/routes`, `src/models`, etc.)
4. Review the error messages for specific guidance

## Next Steps After Comparison

1. Review all three reports
2. Share findings with your backend developer
3. Decide on merge strategy together
4. Create a feature branch
5. Start merging following the prioritized plan
6. Test incrementally
7. Document any breaking changes

---

*For questions or issues, coordinate with your backend developer or team lead.*
