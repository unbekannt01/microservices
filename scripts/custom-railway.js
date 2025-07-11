const fs = require("fs");
const path = require("path");

console.log("🚂 Custom Railway Setup for Your Project Structure");
console.log("================================================");

// Get current directory structure
const currentDir = process.cwd();
console.log("Running from:", currentDir);

// List all directories
const items = fs.readdirSync(".", { withFileTypes: true });
const directories = items
  .filter((item) => item.isDirectory())
  .map((item) => item.name);

console.log("\n📂 Found directories:", directories);

// Filter out common non-service directories
const excludeDirs = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "logs",
  ".vscode",
  ".idea",
];
const serviceDirs = directories.filter((dir) => !excludeDirs.includes(dir));

console.log("🎯 Potential service directories:", serviceDirs);

if (serviceDirs.length === 0) {
  console.log("\n❌ No service directories found!");
  console.log("This might be a single service project.");
  console.log("\n🔧 Creating single-service Railway configuration...");

  // Create single service configuration
  createSingleServiceConfig();
} else {
  console.log(`\n✅ Found ${serviceDirs.length} potential service directories`);
  console.log("🔧 Creating multi-service Railway configuration...");

  // Create multi-service configuration
  createMultiServiceConfig(serviceDirs);
}

function createSingleServiceConfig() {
  // Create nixpacks.toml for single service
  const nixpacksConfig = `[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:prod'`;

  fs.writeFileSync("nixpacks.toml", nixpacksConfig);
  console.log("✅ Created nixpacks.toml");

  // Create railway.json
  const railwayConfig = {
    $schema: "https://railway.app/railway.schema.json",
    build: {
      builder: "NIXPACKS",
    },
    deploy: {
      numReplicas: 1,
      sleepApplication: false,
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
    },
  };

  fs.writeFileSync("railway.json", JSON.stringify(railwayConfig, null, 2));
  console.log("✅ Created railway.json");

  // Create deployment guide for single service
  const deploymentGuide = `# Railway Deployment Guide - Single Service

## Configuration Created:
- nixpacks.toml
- railway.json

## Deployment Steps:

### 1. Push to GitHub
\`\`\`bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
\`\`\`

### 2. Deploy to Railway
1. Go to railway.app
2. Create new project
3. Connect your GitHub repository
4. Railway will automatically detect and deploy your service

### 3. Add Database (if needed)
1. In Railway dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Add environment variable: DATABASE_URL=\${{Postgres.DATABASE_URL}}

### 4. Configure Environment Variables
Add these in Railway dashboard:
\`\`\`
NODE_ENV=production
DATABASE_URL=\${{Postgres.DATABASE_URL}} (if using database)
JWT_SECRET=your-secret-key
\`\`\`

## Your service will be available at:
https://your-service-name.railway.app
`;

  fs.writeFileSync("RAILWAY_DEPLOYMENT.md", deploymentGuide);
  console.log("✅ Created RAILWAY_DEPLOYMENT.md");
}

function createMultiServiceConfig(serviceDirs) {
  serviceDirs.forEach((service) => {
    console.log(`📝 Configuring ${service}...`);

    // Create nixpacks.toml for each service
    const nixpacksConfig = `[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:prod'`;

    const nixpacksPath = path.join(service, "nixpacks.toml");
    fs.writeFileSync(nixpacksPath, nixpacksConfig);
    console.log(`  ✅ Created ${service}/nixpacks.toml`);

    // Create railway.json for each service
    const railwayConfig = {
      $schema: "https://railway.app/railway.schema.json",
      build: {
        builder: "NIXPACKS",
      },
      deploy: {
        numReplicas: 1,
        sleepApplication: false,
        restartPolicyType: "ON_FAILURE",
        restartPolicyMaxRetries: 10,
      },
    };

    const railwayPath = path.join(service, "railway.json");
    fs.writeFileSync(railwayPath, JSON.stringify(railwayConfig, null, 2));
    console.log(`  ✅ Created ${service}/railway.json`);

    // Check if package.json exists, create if missing
    const packageJsonPath = path.join(service, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`  📦 Creating package.json for ${service}...`);

      const packageJson = {
        name: service,
        version: "1.0.0",
        description: `${service} microservice`,
        main: "dist/main.js",
        scripts: {
          build: "nest build",
          start: "nest start",
          "start:dev": "nest start --watch",
          "start:prod": "node dist/main.js",
        },
        dependencies: {
          "@nestjs/common": "^10.0.0",
          "@nestjs/core": "^10.0.0",
          "@nestjs/microservices": "^10.0.0",
          "@nestjs/platform-express": "^10.0.0",
          "reflect-metadata": "^0.1.13",
          rxjs: "^7.8.1",
        },
        devDependencies: {
          "@nestjs/cli": "^10.0.0",
          typescript: "^5.1.3",
        },
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`  ✅ Created ${service}/package.json`);
    }
  });

  // Create deployment guide for multi-service
  const deploymentGuide = `# Railway Deployment Guide - Multi-Service

## Services Configured:
${serviceDirs.map((service) => `- ${service}/`).join("\n")}

## Files Created:
${serviceDirs
  .map(
    (service) =>
      `- ${service}/nixpacks.toml\n- ${service}/railway.json\n- ${service}/package.json (if missing)`
  )
  .join("\n")}

## Deployment Steps:

### 1. Push to GitHub
\`\`\`bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
\`\`\`

### 2. Create Railway Services
For each service directory, create a separate Railway service:

${serviceDirs
  .map(
    (service) => `
**${service.toUpperCase()} Service**
- Root Directory: \`${service}\`
- Environment Variables:
  \`\`\`
  NODE_ENV=production
  DATABASE_URL=\${{Postgres.DATABASE_URL}} (if needed)
  \`\`\`
`
  )
  .join("")}

### 3. Add Shared Resources
1. PostgreSQL Database (if needed)
2. Redis (for message queue, if needed)

### 4. Configure Inter-Service Communication
Make sure services can communicate with each other using Railway's internal networking.

## Testing
Each service will be available at:
${serviceDirs.map((service) => `- https://${service}.railway.app`).join("\n")}
`;

  fs.writeFileSync("RAILWAY_DEPLOYMENT.md", deploymentGuide);
  console.log("✅ Created RAILWAY_DEPLOYMENT.md");
}

console.log("\n🎉 Custom Railway setup complete!");
console.log("📋 Check RAILWAY_DEPLOYMENT.md for next steps");
