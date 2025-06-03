#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const appName = process.argv[2] || "my-express-app";
const appPath = path.join(process.cwd(), appName);

if (fs.existsSync(appPath)) {
  console.error("Directory already exists.");
  process.exit(1);
}

fs.mkdirSync(appPath);
process.chdir(appPath);

// Init npm and install packages
execSync("npm init -y", { stdio: "inherit" });
execSync("npm install express dotenv pg", { stdio: "inherit" });
execSync("npm install -D typescript ts-node-dev @types/node @types/express", {
  stdio: "inherit",
});

// Create tsconfig.json
fs.writeFileSync(
  "tsconfig.json",
  JSON.stringify(
    {
      compilerOptions: {
        target: "es6",
        module: "commonjs",
        rootDir: "./src",
        outDir: "./dist",
        strict: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
      },
    },
    null,
    2
  )
);

// Create basic folders and files
fs.mkdirSync("src");
fs.mkdirSync("src/routes");
fs.mkdirSync("src/config");

fs.writeFileSync(".gitignore", "node_modules/\ndist/\n.env\n");

fs.writeFileSync(
  ".env",
  "PORT=3000\nDATABASE_URL=postgres://user:password@localhost:5432/dbname\n"
);

fs.writeFileSync(
  "src/config/index.ts",
  `
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL || '',
};
`
);

fs.writeFileSync(
  "src/db.ts",
  `
import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.dbUrl,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});
`
);

fs.writeFileSync(
  "src/routes/index.ts",
  `
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.send('Hello from Express + TypeScript + PostgreSQL!');
});

export default router;
`
);

fs.writeFileSync(
  "src/app.ts",
  `
import express from 'express';
import { config } from './config';
import { pool } from './db';
import routes from './routes';

const app = express();
app.use(express.json());
app.use('/', routes);

app.listen(config.port, () => {
  console.log(\`Server is running on port \${config.port}\`);
});
`
);

const pkg = {
  name: appName,
  version: "1.0.0",
  main: "dist/app.js",
  scripts: {
    dev: "ts-node-dev --respawn src/app.ts",
    build: "tsc",
    start: "node dist/app.js",
  },
  dependencies: {
    express: "^4.18.2",
    dotenv: "^16.3.1",
    pg: "^8.11.1",
  },
  devDependencies: {
    typescript: "^5.4.3",
    "ts-node-dev": "^2.0.0",
    "@types/node": "^20.11.30",
    "@types/express": "^4.17.21",
  },
};

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

console.log(
  `\n✅ TypeScript Express + PostgreSQL app "${appName}" initialized.`
);
console.log(`👉 cd ${appName} && npm run dev`);
