const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateVersion(version) {
  const versionRegex = /^v\d+\.\d+\.\d+(-.*)?$/;
  if (!versionRegex.test(version)) {
    log('❌ Invalid version format. Use format: v1.0.0 or v1.0.0-beta', colors.red);
    process.exit(1);
  }
}

function createZip(sourceDir, outputPath, files = null) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      log(`✅ Created ${path.basename(outputPath)} (${archive.pointer()} bytes)`, colors.green);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    if (files) {
      // Add specific files/directories
      files.forEach(item => {
        const fullPath = path.join(sourceDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          archive.directory(fullPath, item);
        } else {
          archive.file(fullPath, { name: item });
        }
      });
    } else {
      // Add entire directory
      archive.directory(sourceDir, false);
    }

    archive.finalize();
  });
}

async function main() {
  const version = process.argv[2];
  
  if (!version) {
    log('❌ Please provide a version number', colors.red);
    log('Usage: node scripts/release.js v1.0.0');
    process.exit(1);
  }

  validateVersion(version);

  log('🚀 CSV Mapper Release Script', colors.green);
  log(`📋 Preparing release ${version}`, colors.yellow);

  try {
    // Clean and install dependencies
    log('📦 Installing dependencies...', colors.yellow);
    execSync('npm ci', { stdio: 'inherit' });

    // Run tests
    log('🧪 Running tests...', colors.yellow);
    execSync('npm run test:all', { stdio: 'inherit' });

    // Build project
    log('🔨 Building project...', colors.yellow);
    execSync('npm run build', { stdio: 'inherit' });

    // Generate documentation
    log('📚 Generating documentation...', colors.yellow);
    execSync('npx typedoc', { stdio: 'inherit' });

    // Create release directory
    const releaseDir = 'release-assets';
    if (fs.existsSync(releaseDir)) {
      fs.rmSync(releaseDir, { recursive: true, force: true });
    }
    fs.mkdirSync(releaseDir, { recursive: true });

    // Create distribution bundle
    log('📦 Creating distribution bundle...', colors.yellow);
    await createZip('.', path.join(releaseDir, `csv-mapper-dist-${version}.zip`), [
      'dist',
      'README.md',
      'LICENSE'
    ]);

    // Create browser-ready bundle
    log('🌐 Creating browser bundle...', colors.yellow);
    const tempBrowserDir = 'temp-browser';
    if (fs.existsSync(tempBrowserDir)) {
      fs.rmSync(tempBrowserDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempBrowserDir, { recursive: true });

    // Copy browser files
    const browserFiles = [
      'csv-mapper.umd.min.js',
      'csv-mapper.umd.min.js.map',
      'csv-mapper.esm.min.js',
      'csv-mapper.esm.min.js.map'
    ];

    browserFiles.forEach(file => {
      fs.copyFileSync(
        path.join('dist', file),
        path.join(tempBrowserDir, file)
      );
    });

    fs.copyFileSync('README.md', path.join(tempBrowserDir, 'README.md'));
    fs.copyFileSync('LICENSE', path.join(tempBrowserDir, 'LICENSE'));

    await createZip(tempBrowserDir, path.join(releaseDir, `csv-mapper-browser-${version}.zip`));

    // Clean up temp directory
    fs.rmSync(tempBrowserDir, { recursive: true, force: true });

    // Update package.json version (remove 'v' prefix)
    const packageVersion = version.replace(/^v/, '');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.version !== packageVersion) {
      log(`📝 Updating version from ${packageJson.version} to ${packageVersion}`, colors.yellow);
      execSync(`npm version ${packageVersion} --no-git-tag-version`, { stdio: 'inherit' });
    } else {
      log(`📝 Version already set to ${packageVersion}`, colors.yellow);
    }

    log('✅ Release assets created in release-assets/', colors.green);
    log('📋 Next steps:', colors.yellow);
    console.log('1. Commit the version change: git add package.json && git commit -m "Release ' + version + '"');
    console.log('2. Create git tag: git tag ' + version);
    console.log('3. Push changes: git push && git push --tags');
    console.log('4. Create GitHub release using the assets in release-assets/');
    console.log('5. Publish to NPM: npm publish');
    log('🎉 Release preparation complete!', colors.green);

  } catch (error) {
    log(`❌ Error during release: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
