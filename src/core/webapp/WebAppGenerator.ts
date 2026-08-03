import { AppScaffolder } from "../scaffolder/AppScaffolder";
import * as crypto from "crypto";
import { cryptoSiteTemplate } from "./templates/cryptoSite";

export type AppType = 'website' | 'dashboard' | 'ecommerce' | 'social' | 'saas' | 'crypto' | 'defi' | 'nft' | 'mobile';
export type Framework = 'react' | 'next' | 'vue' | 'angular' | 'express';
export type Styling = 'tailwind' | 'bootstrap' | 'material' | 'chakra';

export interface AppBlueprint {
  name: string;
  type: AppType;
  framework: Framework;
  styling: Styling;
  pages: string[];
  features: string[];
  apiEndpoints?: string[];
  database?: string;
  authentication?: boolean;
  tokenIntegration?: boolean;
}

export interface GeneratedApp {
  blueprint: AppBlueprint;
  files: { path: string; content: string }[];
  port: number;
  url: string;
  status: 'generated' | 'deployed';
}

const TYPE_PAGES: Record<AppType, string[]> = {
  website: ['Home', 'About', 'Services', 'Contact'],
  dashboard: ['Dashboard', 'Analytics', 'Settings', 'Users', 'Reports'],
  ecommerce: ['Home', 'Products', 'Cart', 'Checkout', 'Orders', 'Profile'],
  social: ['Feed', 'Profile', 'Messages', 'Notifications', 'Explore', 'Settings'],
  saas: ['Dashboard', 'Billing', 'Team', 'Integrations', 'Settings', 'Docs'],
  crypto: ['Home', 'Token', 'Staking', 'Governance', 'Dashboard', 'FAQ'],
  defi: ['Home', 'Swap', 'Liquidity', 'Farm', 'Dashboard', 'Governance'],
  nft: ['Home', 'Marketplace', 'Collection', 'Create', 'Profile', 'Activity'],
  mobile: ['Home', 'Profile', 'Settings', 'Notifications', 'Explore']
};

const TYPE_FEATURES: Record<AppType, string[]> = {
  website: ['responsive', 'seo', 'contact-form', 'analytics'],
  dashboard: ['auth', 'charts', 'data-table', 'notifications', 'api-integration'],
  ecommerce: ['auth', 'payment', 'cart', 'search', 'reviews', 'wishlist'],
  social: ['auth', 'realtime', 'messaging', 'notifications', 'media-upload'],
  saas: ['auth', 'billing', 'multi-tenant', 'api', 'webhooks', 'docs'],
  crypto: ['wallet-connect', 'token-display', 'chart', 'staking-ui', 'governance'],
  defi: ['wallet-connect', 'swap', 'liquidity-pools', 'chart', 'farming'],
  nft: ['wallet-connect', 'marketplace', 'minting', 'ipfs', 'gallery'],
  mobile: ['auth', 'push-notifications', 'offline', 'camera', 'geolocation']
};

export class WebAppGenerator {
  private appScaffolder: AppScaffolder;
  private generatedApps: GeneratedApp[] = [];
  private portCounter: number = 4100;

  constructor(appScaffolder: AppScaffolder) {
    this.appScaffolder = appScaffolder;
  }

  designBlueprint(name: string, type: AppType, requirements: string): AppBlueprint {
    const lower = requirements.toLowerCase();
    const framework: Framework = lower.includes('vue') ? 'vue' :
      lower.includes('angular') ? 'angular' :
      lower.includes('next') ? 'next' : 'react';
    const styling: Styling = lower.includes('bootstrap') ? 'bootstrap' :
      lower.includes('material') ? 'material' :
      lower.includes('chakra') ? 'chakra' : 'tailwind';

    const pages = [...TYPE_PAGES[type]];
    if (lower.includes('admin') && !pages.includes('Admin')) pages.push('Admin');
    if (lower.includes('blog') && !pages.includes('Blog')) pages.push('Blog');
    if (lower.includes('pricing') && !pages.includes('Pricing')) pages.push('Pricing');

    const features = [...TYPE_FEATURES[type]];
    if (lower.includes('auth') || lower.includes('login')) features.push('auth');
    if (lower.includes('payment') || lower.includes('stripe') || lower.includes('paypal')) features.push('payment');
    if (lower.includes('chat') || lower.includes('messaging')) features.push('realtime');
    if (lower.includes('search')) features.push('search');

    const usesToken = lower.includes('token') || lower.includes('crypto') || lower.includes('wallet') ||
      lower.includes('blockchain') || lower.includes('nft') || lower.includes('defi');

    return {
      name,
      type,
      framework,
      styling,
      pages,
      features: [...new Set(features)],
      apiEndpoints: ['/api/health', `/api/${name.toLowerCase().replace(/\s+/g, '-')}`],
      database: lower.includes('mongodb') ? 'mongodb' :
        lower.includes('postgres') ? 'postgresql' :
        lower.includes('sqlite') ? 'sqlite' : 'postgresql',
      authentication: lower.includes('auth') || lower.includes('login') || lower.includes('secure'),
      tokenIntegration: usesToken
    };
  }

  async generateApp(blueprint: AppBlueprint): Promise<GeneratedApp> {
    const port = this.portCounter++;
    const frontendFiles = this.generateFrontend(blueprint, port);
    const backendFiles = this.generateBackend(blueprint, port);
    const schemaFile = {
      path: 'database/schema.sql',
      content: this.generateDatabaseSchema(blueprint)
    };

    const configFiles = [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: blueprint.name.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          private: true,
          scripts: {
            dev: 'concurrently "npm run dev:server" "npm run dev:client"',
            'dev:client': 'cd client && vite',
            'dev:server': 'ts-node server/index.ts',
            build: 'cd client && vite build',
            start: 'node dist/server/index.js'
          },
          dependencies: {
            express: '^4.18.2',
            cors: '^2.8.5',
            concurrently: '^8.2.0',
            ...(blueprint.authentication ? { jsonwebtoken: '^9.0.0', bcryptjs: '^2.4.3' } : {}),
            ...(blueprint.database === 'mongodb' ? { mongoose: '^7.6.0' } : {}),
            ...(blueprint.database === 'postgresql' ? { pg: '^8.11.0' } : {})
          },
          devDependencies: {
            typescript: '^5.3.0',
            '@types/express': '^4.17.21',
            '@types/node': '^20.10.0',
            'ts-node': '^10.9.0'
          }
        }, null, 2)
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            lib: ['ES2020'],
            outDir: './dist',
            rootDir: '.',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true
          },
          include: ['server/**/*'],
          exclude: ['node_modules', 'client']
        }, null, 2)
      },
      {
        path: '.env',
        content: `PORT=${port}\nNODE_ENV=development\n${blueprint.authentication ? 'JWT_SECRET=' + crypto.randomBytes(24).toString('hex') + '\n' : ''}${blueprint.database === 'mongodb' ? 'MONGODB_URI=mongodb://localhost:27017/' + blueprint.name.toLowerCase().replace(/\s+/g, '-') + '\n' : ''}${blueprint.database === 'postgresql' ? 'DATABASE_URL=postgresql://localhost:5432/' + blueprint.name.toLowerCase().replace(/\s+/g, '-') + '\n' : ''}`
      }
    ];

    const allFiles = [...configFiles, ...frontendFiles, ...backendFiles, schemaFile];

    const app: GeneratedApp = {
      blueprint,
      files: allFiles,
      port,
      url: `http://localhost:${port}`,
      status: 'generated'
    };

    this.generatedApps.push(app);

    this.appScaffolder['memoryEngine'].addKnowledge(
      `App generated: ${blueprint.name} (${blueprint.type})`,
      'GENERATED_APPS',
      `Web application "${blueprint.name}" of type ${blueprint.type} generated with framework ${blueprint.framework} and styling ${blueprint.styling}. Pages: ${blueprint.pages.join(', ')}. Features: ${blueprint.features.join(', ')}.`,
      ['generated_app', blueprint.type, blueprint.framework, blueprint.name.toLowerCase().replace(/\s+/g, '_')]
    );

    return app;
  }

  generateFrontend(blueprint: AppBlueprint, port: number): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];
    const appName = blueprint.name;
    const framework = blueprint.framework;
    const styling = blueprint.styling;
    const isTailwind = styling === 'tailwind';

    files.push({
      path: 'client/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName}</title>
  ${isTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
    });

    files.push({
      path: 'client/vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: ${port + 1}, proxy: { '/api': 'http://localhost:${port}' } }
});`
    });

    files.push({
      path: 'client/src/main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
${isTailwind ? 'import "./index.css";' : ''}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    });

    if (isTailwind) {
      files.push({
        path: 'client/src/index.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}`
      });

      files.push({
        path: 'client/tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`
      });
    }

    files.push({
      path: 'client/src/App.tsx',
      content: `import React, { useState, useEffect } from 'react';

const pages = ${JSON.stringify(blueprint.pages)};

function App() {
  const [currentPage, setCurrentPage] = useState('${blueprint.pages[0] || 'Home'}');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="${isTailwind ? 'min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100' : ''}">
      <nav className="${isTailwind ? 'bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700' : ''}">
        <div className="${isTailwind ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : ''}">
          <div className="${isTailwind ? 'flex justify-between items-center h-16' : ''}">
            <h1 className="${isTailwind ? 'text-xl font-bold text-indigo-600 dark:text-indigo-400' : ''}">${appName}</h1>
            <div className="${isTailwind ? 'flex items-center space-x-4' : ''}">
              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={\`${isTailwind ? 'px-3 py-2 rounded-md text-sm font-medium transition-colors' : ''} \${
                    currentPage === page
                      ? '${isTailwind ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''}'
                      : '${isTailwind ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}'
                  }\`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="${isTailwind ? 'p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="${isTailwind ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}">
        <div className="${isTailwind ? 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700' : ''}">
          <h2 className="${isTailwind ? 'text-2xl font-bold mb-4' : ''}">\${currentPage}</h2>
          <PageContent page={currentPage} />
        </div>
      </main>

      <footer className="${isTailwind ? 'bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12' : ''}">
        <div className="${isTailwind ? 'max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm' : ''}">
          &copy; ${new Date().getFullYear()} ${appName}. Generated by Trinnity Viseron System.
        </div>
      </footer>
    </div>
  );
}

function PageContent({ page }: { page: string }) {
  ${blueprint.tokenIntegration ? `
  const [tokenPrice, setTokenPrice] = useState(0.042);
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenPrice(prev => prev + (Math.random() - 0.5) * 0.002);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (page === 'Dashboard' || page === 'Token') {
    return (
      <div>
        <div className="${isTailwind ? 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' : ''}">
          <div className="${isTailwind ? 'bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white' : ''}">
            <p className="${isTailwind ? 'text-sm opacity-80' : ''}">Token Price</p>
            <p className="${isTailwind ? 'text-2xl font-bold' : ''}">$\${tokenPrice.toFixed(4)}</p>
          </div>
          <div className="${isTailwind ? 'bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-4 text-white' : ''}">
            <p className="${isTailwind ? 'text-sm opacity-80' : ''}">Market Cap</p>
            <p className="${isTailwind ? 'text-2xl font-bold' : ''}">$42,069,420</p>
          </div>
          <div className="${isTailwind ? 'bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white' : ''}">
            <p className="${isTailwind ? 'text-sm opacity-80' : ''}">Total Supply</p>
            <p className="${isTailwind ? 'text-2xl font-bold' : ''}">1,000,000,000</p>
          </div>
        </div>
      </div>
    );
  }
  ` : ''}

  return (
    <div className="${isTailwind ? 'prose dark:prose-invert max-w-none' : ''}">
      <p>Welcome to the <strong>{page}</strong> page.</p>
      <p>This page was automatically generated by Trinnity Viseron System based on your requirements.</p>
      ${blueprint.features.includes('auth') ? `
      <div className="${isTailwind ? 'mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg' : ''}">
        <h3>Authentication Required</h3>
        <p>This section requires authentication. Sign in to access protected features.</p>
        <button className="${isTailwind ? 'mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700' : ''}">
          Sign In
        </button>
      </div>
      ` : ''}
    </div>
  );
}

export default App;`
    });

    for (const page of blueprint.pages) {
      files.push({
        path: `client/src/pages/${page.replace(/\s+/g, '')}.tsx`,
        content: `import React from 'react';

interface ${page.replace(/\s+/g, '')}Props {
  title?: string;
}

const ${page.replace(/\s+/g, '')}: React.FC<${page.replace(/\s+/g, '')}Props> = ({ title = '{page}' }) => {
  return (
    <div className="${isTailwind ? 'p-6' : ''}">
      <h1>{page}</h1>
      <p className="${isTailwind ? 'text-gray-600 dark:text-gray-400' : ''}">
        ${page} page content generated for ${appName}.
      </p>
    </div>
  );
};

export default ${page.replace(/\s+/g, '')};`
      });
    }

    return files;
  }

  generateBackend(blueprint: AppBlueprint, port: number): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];
    const appName = blueprint.name;

    files.push({
      path: 'server/index.ts',
      content: `import express from 'express';
import cors from 'cors';
${blueprint.authentication ? "import { authRouter } from './routes/auth';" : ''}
${blueprint.database === 'mongodb' ? "import mongoose from 'mongoose';" : ''}
${blueprint.database === 'postgresql' ? "import { Pool } from 'pg';" : ''}

const app = express();
const PORT = process.env.PORT || ${port};

app.use(cors());
app.use(express.json());

${blueprint.database === 'mongodb' ? `mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${appName.toLowerCase().replace(/\s+/g, '-')}')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
` : ''}
${blueprint.database === 'postgresql' ? `const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/${appName.toLowerCase().replace(/\s+/g, '-')}'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Database connected at:', res.rows[0].now);
});
` : ''}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', app: '${appName}', timestamp: Date.now() });
});

${blueprint.apiEndpoints ? blueprint.apiEndpoints.map((endpoint, i) => `
app.get('${endpoint}', (_req, res) => {
  res.json({ endpoint: '${endpoint}', message: '${appName} API endpoint', data: [] });
});
`).join('') : ''}

${blueprint.authentication ? `
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  res.json({ token: 'demo-token-' + Date.now(), user: { email, name: 'Demo User' } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  res.status(201).json({ message: 'User created', user: { email, name } });
});
` : ''}

${blueprint.tokenIntegration ? `
app.get('/api/token/price', (_req, res) => {
  res.json({ symbol: 'TVS', price: 0.042, change24h: 2.5, marketCap: 42069420 });
});

app.get('/api/token/stats', (_req, res) => {
  res.json({
    totalSupply: 1000000000,
    circulatingSupply: 650000000,
    holders: 12453,
    transactions: 89234
  });
});
` : ''}

app.listen(PORT, () => {
  console.log('🚀 ${appName} server running on port ' + PORT);
  console.log('📡 API: http://localhost:' + PORT + '/api');
});
`
    });

    if (blueprint.authentication) {
      files.push({
        path: 'server/routes/auth.ts',
        content: `import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

const users: User[] = [];

authRouter.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = { id: String(users.length + 1), email, name, password: hashedPassword };
    users.push(user);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});
`
      });
    }

    return files;
  }

  generateDatabaseSchema(blueprint: AppBlueprint): string {
    const tables: string[] = [];

    tables.push(`-- Database schema for ${blueprint.name}
-- Generated by Trinnity Viseron System
-- Database: ${blueprint.database || 'postgresql'}

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255)${blueprint.authentication ? ' NOT NULL' : ''},
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

    if (blueprint.tokenIntegration) {
      tables.push(`
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    total_supply NUMERIC(40,0) NOT NULL,
    contract_address VARCHAR(255),
    network VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token_id INTEGER REFERENCES tokens(id),
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(40,0) NOT NULL,
    tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    }

    if (blueprint.features.includes('payment') || blueprint.type === 'ecommerce') {
      tables.push(`
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);`);
    }

    if (blueprint.features.includes('realtime') || blueprint.features.includes('messaging')) {
      tables.push(`
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    }

    tables.push(`
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);`);

    return tables.join('\n');
  }

  async deploy(app: GeneratedApp): Promise<string> {
    app.status = 'deployed';

    this.appScaffolder['memoryEngine'].addKnowledge(
      `App deployed: ${app.blueprint.name}`,
      'DEPLOYED_APPS',
      `Application "${app.blueprint.name}" deployed at ${app.url}. Type: ${app.blueprint.type}, Framework: ${app.blueprint.framework}.`,
      ['deployed_app', app.blueprint.type, app.blueprint.name.toLowerCase().replace(/\s+/g, '_')]
    );

    return app.url;
  }

  async generateCryptoSite(tokenName: string, tokenSymbol: string, description: string): Promise<GeneratedApp> {
    const blueprint: AppBlueprint = {
      name: `${tokenName} Landing`,
      type: 'crypto',
      framework: 'react',
      styling: 'tailwind',
      pages: ['Home', 'Token', 'Roadmap', 'Team', 'FAQ'],
      features: ['wallet-connect', 'token-display', 'chart', 'responsive'],
      tokenIntegration: true
    };

    const template = cryptoSiteTemplate(tokenName, tokenSymbol, description);
    const port = this.portCounter++;

    const files: { path: string; content: string }[] = [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tokenName} (${tokenSymbol})</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div id="root">${template.html}</div>
  <style>${template.css}</style>
  <script>${template.js}</script>
</body>
</html>`
      },
      {
        path: 'client/src/App.tsx',
        content: `import React from 'react';

const TOKEN_NAME = "${tokenName}";
const TOKEN_SYMBOL = "${tokenSymbol}";
const TOKEN_DESC = "${description.replace(/"/g, '\\"')}";

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <HeroSection />
      <TokenomicsSection />
      <RoadmapSection />
      <TeamSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-transparent bg-clip-text">
          {TOKEN_NAME}
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-yellow-400 mb-6">{TOKEN_SYMBOL}</p>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">{TOKEN_DESC}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-purple-600/50">
            Buy {TOKEN_SYMBOL}
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all">
            Connect Wallet
          </button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto">
          <div><p className="text-3xl font-bold text-purple-400">$0.042</p><p className="text-sm text-gray-400">Price</p></div>
          <div><p className="text-3xl font-bold text-purple-400">$42M</p><p className="text-sm text-gray-400">Market Cap</p></div>
          <div><p className="text-3xl font-bold text-purple-400">1B</p><p className="text-sm text-gray-400">Supply</p></div>
        </div>
      </div>
    </section>
  );
}

function TokenomicsSection() {
  const items = [
    { label: 'Team', percent: 10, color: 'bg-red-500' },
    { label: 'Marketing', percent: 15, color: 'bg-blue-500' },
    { label: 'Liquidity', percent: 20, color: 'bg-green-500' },
    { label: 'Development', percent: 10, color: 'bg-yellow-500' },
    { label: 'Staking Rewards', percent: 25, color: 'bg-purple-500' },
    { label: 'Community', percent: 20, color: 'bg-pink-500' }
  ];

  return (
    <section className="py-20 px-4 bg-gray-800/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Tokenomics</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative w-64 h-64 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              {items.reduce((acc, item, i) => {
                const offset = items.slice(0, i).reduce((s, x) => s + x.percent, 0);
                const angle = (offset / 100) * 360;
                const percent = (item.percent / 100) * 360;
                const x1 = 18 + 16 * Math.cos((angle * Math.PI) / 180);
                const y1 = 18 + 16 * Math.sin((angle * Math.PI) / 180);
                const x2 = 18 + 16 * Math.cos(((angle + percent) * Math.PI) / 180);
                const y2 = 18 + 16 * Math.sin(((angle + percent) * Math.PI) / 180);
                const large = percent > 180 ? 1 : 0;
                acc.push(\`<path d="M18 18 L\${x1} \${y1} A16 16 0 \${large} 1 \${x2} \${y2} Z" fill="\${item.color.replace('bg-', '').replace('red', '#ef4444').replace('blue', '#3b82f6').replace('green', '#22c55e').replace('yellow', '#eab308').replace('purple', '#a855f7').replace('pink', '#ec4899')}" />\`);
                return acc;
              }, []).join('')}
            </svg>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={\`w-4 h-4 rounded \${item.color}\`}></div>
                <span className="flex-1">{item.label}</span>
                <span className="font-bold">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const phases = [
    { phase: 'Q1 2026', title: 'Launch', items: ['Token creation', 'Community building', 'Smart contract audit', 'DEX listing'] },
    { phase: 'Q2 2026', title: 'Growth', items: ['CEX listings', 'Marketing campaign', 'Partnership announcements', 'DAO formation'] },
    { phase: 'Q3 2026', title: 'Ecosystem', items: ['Staking platform', 'Governance portal', 'Mobile app', 'Cross-chain bridge'] },
    { phase: 'Q4 2026', title: 'Expansion', items: ['NFT marketplace', 'DeFi integration', 'Global expansion', 'Mainnet upgrade'] }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Roadmap</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {phases.map((phase, i) => (
            <div key={i} className="relative">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors h-full">
                <div className="text-purple-400 text-sm font-bold mb-1">{phase.phase}</div>
                <h3 className="text-xl font-bold mb-4">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-green-400 mt-1">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              {i < phases.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-purple-500"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  const team = [
    { name: 'Pedro Costa', role: 'Commander & CEO', avatar: 'PC', color: 'from-purple-600 to-indigo-600' },
    { name: 'Trinnity Hurtado', role: 'Queen & Architect', avatar: 'TH', color: 'from-pink-600 to-rose-600' },
    { name: 'Alex Venture', role: 'Lead Developer', avatar: 'AV', color: 'from-blue-600 to-cyan-600' },
    { name: 'Sarah Moon', role: 'Marketing Director', avatar: 'SM', color: 'from-green-600 to-teal-600' }
  ];

  return (
    <section className="py-20 px-4 bg-gray-800/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Team</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center hover:scale-105 transition-transform">
              <div className={\`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br \${member.color} flex items-center justify-center text-2xl font-bold\`}>
                {member.avatar}
              </div>
              <h3 className="font-bold">{member.name}</h3>
              <p className="text-sm text-gray-400">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: 'What is {TOKEN_NAME}?', a: '{TOKEN_NAME} ({TOKEN_SYMBOL}) is a next-generation cryptocurrency token built on cutting-edge blockchain technology.' },
    { q: 'How can I buy {TOKEN_SYMBOL}?', a: 'You can purchase {TOKEN_SYMBOL} on supported DEXs and CEXs. Connect your wallet and swap ETH/USDT for {TOKEN_SYMBOL}.' },
    { q: 'What is the total supply?', a: 'The total supply of {TOKEN_SYMBOL} is 1,000,000,000 tokens with a deflationary mechanism.' },
    { q: 'Is the contract audited?', a: 'Yes, our smart contract has been audited by leading security firms to ensure safety and transparency.' },
    { q: 'How do I stake my tokens?', a: 'Stake your {TOKEN_SYMBOL} tokens in our staking platform to earn passive rewards with flexible lockup periods.' }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">FAQ</h2>
        <div className="space-y-4" id="faq">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left font-medium flex justify-between items-center hover:bg-gray-750 transition-colors"
                onClick={(e) => {
                  const parent = e.currentTarget.parentElement;
                  const answer = parent.querySelector('.faq-answer');
                  const icon = parent.querySelector('.faq-icon');
                  if (answer) {
                    answer.classList.toggle('hidden');
                    if (icon) icon.classList.toggle('rotate-180');
                  }
                }}
              >
                {faq.q}
                <svg className="faq-icon w-5 h-5 text-purple-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="faq-answer hidden px-6 pb-4 text-gray-400">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center gap-6 mb-6">
          <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Twitter</a>
          <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Telegram</a>
          <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Discord</a>
          <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">GitHub</a>
          <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Medium</a>
        </div>
        <p className="text-gray-500 text-sm">
          &copy; ${new Date().getFullYear()} {TOKEN_NAME}. All rights reserved. | Generated by Trinnity Viseron System
        </p>
      </div>
    </footer>
  );
}

export default App;`
      },
      {
        path: 'client/package.json',
        content: JSON.stringify({
          name: `${tokenName.toLowerCase().replace(/\s+/g, '-')}-landing`,
          private: true,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
          devDependencies: { '@vitejs/plugin-react': '^4.2.0', vite: '^5.0.0' }
        }, null, 2)
      },
      {
        path: 'client/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tokenName} (${tokenSymbol})</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
      },
      {
        path: 'client/src/main.tsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        path: 'client/vite.config.ts',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: ${port} }
});`
      }
    ];

    const app: GeneratedApp = {
      blueprint,
      files,
      port,
      url: `http://localhost:${port}`,
      status: 'generated'
    };

    this.generatedApps.push(app);

    this.appScaffolder['memoryEngine'].addKnowledge(
      `Crypto site generated: ${tokenName} (${tokenSymbol})`,
      'GENERATED_APPS',
      `Complete crypto landing page for ${tokenName} (${tokenSymbol}) generated. Description: ${description}.`,
      ['crypto_site', tokenSymbol.toLowerCase(), 'landing_page']
    );

    return app;
  }

  async generateMobileApp(blueprint: AppBlueprint): Promise<GeneratedApp> {
    const port = this.portCounter++;

    const files: { path: string; content: string }[] = [
      {
        path: 'mobile/package.json',
        content: JSON.stringify({
          name: blueprint.name.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          private: true,
          scripts: {
            start: 'expo start',
            android: 'expo start --android',
            ios: 'expo start --ios',
            web: 'expo start --web'
          },
          dependencies: {
            expo: '~50.0.0',
            'expo-status-bar': '~1.11.1',
            react: '18.2.0',
            'react-native': '0.73.0',
            '@react-navigation/native': '^6.1.0',
            '@react-navigation/native-stack': '^6.9.0',
            'react-native-screens': '~3.29.0',
            'react-native-safe-area-context': '4.8.2'
          },
          devDependencies: {
            '@babel/core': '^7.20.0',
            '@types/react': '~18.2.0',
            typescript: '^5.3.0'
          }
        }, null, 2)
      },
      {
        path: 'mobile/App.tsx',
        content: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

type RootStackParamList = {
  ${blueprint.pages.map(p => `${p.replace(/\s+/g, '')}: undefined`).join(';\n  ')};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const pages = ${JSON.stringify(blueprint.pages)};

function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>${blueprint.name}</Text>
      <StatusBar style="auto" />
      <View style={styles.menu}>
        {pages.map(page => (
          <TouchableOpacity
            key={page}
            style={styles.button}
            onPress={() => navigation.navigate(page.replace(/\s+/g, ''))}
          >
            <Text style={styles.buttonText}>{page}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

${blueprint.pages.map(page => `
function ${page.replace(/\s+/g, '')}Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>${page}</Text>
      <Text style={styles.subtitle}>${page} content for ${blueprint.name}</Text>
    </SafeAreaView>
  );
}
`).join('\n')}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '${blueprint.name}' }} />
        ${blueprint.pages.map(page => `
        <Stack.Screen name="${page.replace(/\s+/g, '')}" component={${page.replace(/\s+/g, '')}Screen} options={{ title: '${page}' }} />
        `).join('\n')}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  menu: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});`
      },
      {
        path: 'mobile/tsconfig.json',
        content: JSON.stringify({
          extends: 'expo/tsconfig.base',
          compilerOptions: { strict: true }
        }, null, 2)
      },
      {
        path: 'mobile/app.json',
        content: JSON.stringify({
          expo: {
            name: blueprint.name,
            slug: blueprint.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            orientation: 'portrait',
            icon: './assets/icon.png',
            userInterfaceStyle: 'dark',
            splash: { backgroundColor: '#0f172a' },
            ios: { supportsTablet: true },
            android: { adaptiveIcon: { backgroundColor: '#0f172a' } }
          }
        }, null, 2)
      }
    ];

    const app: GeneratedApp = {
      blueprint,
      files,
      port,
      url: `exp://localhost:${port}`,
      status: 'generated'
    };

    this.generatedApps.push(app);

    this.appScaffolder['memoryEngine'].addKnowledge(
      `Mobile app generated: ${blueprint.name}`,
      'GENERATED_APPS',
      `Mobile application "${blueprint.name}" of type ${blueprint.type} generated with React Native. Pages: ${blueprint.pages.join(', ')}.`,
      ['generated_app', 'mobile', blueprint.name.toLowerCase().replace(/\s+/g, '_')]
    );

    return app;
  }

  listApps(): GeneratedApp[] {
    return this.generatedApps;
  }
}
