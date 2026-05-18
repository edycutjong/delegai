import * as fs from 'fs';
import * as path from 'path';

/**
 * DelegAI — Submission Readiness Check
 * Verifies all mandatory deliverables exist before submission.
 * Usage: npx tsx scripts/check-submission.ts
 */

const requiredFiles = [
  'scripts/bench.ts',
  'scripts/verify-demo.ts',
  'docs/DEMO_SCRIPT.md',
  'docs/ARCHITECTURE.md',
  'README.md',
  '.github/workflows/ci.yml',
  'docs/SDK_FEEDBACK.md'
];

function checkSubmission() {
  console.log('📦 DelegAI — Submission Readiness Check');
  console.log('='.repeat(50));

  let allExist = true;
  const root = path.join(__dirname, '..');

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file} is present`);
    } else {
      console.log(`  ❌ ${file} is MISSING`);
      allExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allExist) {
    console.log('🎉 ALL MANDATORY FILES PRESENT — Ready to submit!');
  } else {
    console.log('⚠️  Please create missing files before submission.');
    process.exit(1);
  }
}

checkSubmission();
