const fs = require("fs");
const path = require("path");

console.log("🚂 Setting up Railway deployment configuration...");
console.log("Running from:", process.cwd());

// Verify we're in the correct directory
const expectedDirs = ["api-gateway", "order", "payment", "notification"];
const missingDirs = expectedDirs.filter((dir) => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.error("❌ Error: Missing service directories:", missingDirs);
  console.error(
    "Make sure you're running this from the ROOT directory of your project"
  );
  console.error("Expected structure:");
  console.error("your-project/");
  expectedDirs.forEach((dir) => console.error(`├── ${dir}/`));
  process.exit(1);
}

console.log("✅ Verified project structure");

// Create nixpacks.toml for each service
const services = [
  "api-gateway",
  "order-service",
  "payment-service",
  "notification-service",
];

services.forEach((service) => {
  console.log(`📝 Configuring ${service}...`);

  // Create nixpacks.toml
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

  const railwayPath = path.join(service, "railway.json");
  fs.writeFileSync(railwayPath, JSON.stringify(railwayConfig, null, 2));
  console.log(`  ✅ Created ${service}/railway.json`);

  // Ensure package.json exists in each service
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

    // Add specific dependencies for each service
    if (service === "api-gateway") {
      packageJson.dependencies["@nestjs/jwt"] = "^10.0.0";
      packageJson.dependencies["@nestjs/throttler"] = "^5.0.0";
      packageJson.dependencies["@nestjs/typeorm"] = "^10.0.0";
      packageJson.dependencies["bcrypt"] = "^5.1.0";
      packageJson.dependencies["class-validator"] = "^0.14.0";
      packageJson.dependencies["class-transformer"] = "^0.5.1";
      packageJson.dependencies["pg"] = "^8.11.0";
      packageJson.dependencies["typeorm"] = "^0.3.17";
      packageJson.dependencies["amqplib"] = "^0.10.3";
    }

    if (service === "order" || service === "payment") {
      packageJson.dependencies["@nestjs/typeorm"] = "^10.0.0";
      packageJson.dependencies["pg"] = "^8.11.0";
      packageJson.dependencies["typeorm"] = "^0.3.17";
      packageJson.dependencies["amqplib"] = "^0.10.3";
    }

    if (service === "notification") {
      packageJson.dependencies["@nestjs/config"] = "^3.0.0";
      packageJson.dependencies["nodemailer"] = "^6.9.0";
      packageJson.dependencies["amqplib"] = "^0.10.3";
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`  ✅ Created ${service}/package.json`);
  } else {
    console.log(`  ✅ ${service}/package.json already exists`);
  }
});

// Create deployment guide
const deploymentGuide = `# Railway Deployment Guide

## Files Created:
${services
  .map(
    (service) =>
      `- ${service}/nixpacks.toml\n- ${service}/railway.json\n- ${service}/package.json (if missing)`
  )
  .join("\n")}

## Next Steps:

### 1. Install Dependencies for All Services
\`\`\`bash
# Run from root directory
npm run install:all
\`\`\`

### 2. Push to GitHub
\`\`\`bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
\`\`\`

### 3. Set up Railway Services

#### A. Create Database Services First:
1. Go to railway.app
2. Create new project
3. Add PostgreSQL database
4. Add Redis database

#### B. Create Application Services:
Create 4 separate services from your GitHub repository:

**API Gateway (Web Service)**
- Root Directory: \`api-gateway\`
- Port: 3000 (Railway will auto-detect)
- Environment Variables:
  \`\`\`
  NODE_ENV=production
  DATABASE_URL=\${{Postgres.DATABASE_URL}}
  REDIS_HOST=\${{Redis.REDIS_HOST}}
  REDIS_PORT=\${{Redis.REDIS_PORT}}
  REDIS_PASSWORD=\${{Redis.REDIS_PASSWORD}}
  JWT_SECRET=your-super-secret-jwt-key-here
  \`\`\`

**Order Service (Worker)**
- Root Directory: \`order\`
- Environment Variables:
  \`\`\`
  NODE_ENV=production
  DATABASE_URL=\${{Postgres.DATABASE_URL}}
  REDIS_HOST=\${{Redis.REDIS_HOST}}
  REDIS_PORT=\${{Redis.REDIS_PORT}}
  REDIS_PASSWORD=\${{Redis.REDIS_PASSWORD}}
  \`\`\`

**Payment Service (Worker)**
- Root Directory: \`payment\`
- Environment Variables:
  \`\`\`
  NODE_ENV=production
  DATABASE_URL=\${{Postgres.DATABASE_URL}}
  REDIS_HOST=\${{Redis.REDIS_HOST}}
  REDIS_PORT=\${{Redis.REDIS_PORT}}
  REDIS_PASSWORD=\${{Redis.REDIS_PASSWORD}}
  \`\`\`

**Notification Service (Worker)**
- Root Directory: \`notification\`
- Environment Variables:
  \`\`\`
  NODE_ENV=production
  REDIS_HOST=\${{Redis.REDIS_HOST}}
  REDIS_PORT=\${{Redis.REDIS_PORT}}
  REDIS_PASSWORD=\${{Redis.REDIS_PASSWORD}}
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  \`\`\`

### 4. Test Your Deployment
Once deployed, test your API Gateway:
\`\`\`bash
curl https://your-api-gateway-url.railway.app/v1/app
\`\`\`

## Troubleshooting

### Build Issues:
- Check that each service has a proper package.json
- Verify nixpacks.toml configuration
- Check Railway build logs

### Database Connection Issues:
- Verify DATABASE_URL format
- Check if PostgreSQL service is running
- Ensure environment variables are set correctly

### Service Communication Issues:
- Verify Redis configuration
- Check that all services are deployed
- Monitor service logs in Railway dashboard

## Important Notes:
- Railway free tier has usage limits
- Services may sleep after inactivity
- Monitor your usage in Railway dashboard
`;

fs.writeFileSync("RAILWAY_DEPLOYMENT.md", deploymentGuide);
console.log("📋 Created RAILWAY_DEPLOYMENT.md with detailed instructions");

console.log("\n🎉 Railway setup complete!");
console.log("\n📋 Next steps:");
console.log("1. Install dependencies: npm run install:all");
console.log("2. Review the created configuration files");
console.log("3. Push your code to GitHub");
console.log("4. Follow the instructions in RAILWAY_DEPLOYMENT.md");
console.log("5. Set up services in Railway dashboard");
