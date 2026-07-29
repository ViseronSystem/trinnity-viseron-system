import fs from "fs-extra";
import path from "path";
import { MemoryEngine } from "../memory/MemoryEngine";
import { IAgent, AgentExecutionResult } from "../types";

export type AppTemplate = 'express-api' | 'react-spa' | 'express-react' | 'cli-tool' | 'microservice' | 'dashboard';

export interface AppSpec {
  name: string;
  description: string;
  template: AppTemplate;
  port?: number;
  features?: string[];
  outputDir?: string;
}

export interface ScaffoldResult {
  success: boolean;
  appPath: string;
  filesCreated: number;
  template: AppTemplate;
  message: string;
}

const TEMPLATE_DESCRIPTIONS: Record<AppTemplate, string> = {
  'express-api': 'API REST con Express.js y TypeScript',
  'react-spa': 'Single Page Application con React + TypeScript',
  'express-react': 'Full-stack app con Express backend + React frontend',
  'cli-tool': 'Herramienta de línea de comandos con TypeScript',
  'microservice': 'Microservicio con Express + Docker',
  'dashboard': 'Dashboard de monitoreo con Express + EJS'
};

const TEMPLATE_FILES: Record<AppTemplate, Array<{ path: string; content: string }>> = {
  'express-api': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "description": "__DESCRIPTION__",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`
    },
    {
      path: 'src/index.js',
      content: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = __PORT__;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'ONLINE', app: '__NAME__', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ healthy: true, timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log('🚀 __NAME__ corriendo en puerto ' + PORT);
  console.log('📡 API: http://localhost:' + PORT + '/api');
});
`
    },
    {
      path: 'README.md',
      content: `# __NAME__

__DESCRIPTION__

## Instalación

\`\`\`bash
npm install
\`\`\`

## Uso

\`\`\`bash
npm start
\`\`\`

## API

- \`GET /api/status\` - Estado de la aplicación
- \`GET /api/health\` - Health check

---
Generado por Trinnity Viseron System - AppScaffolder v1.0
`
    }
  ],
  'react-spa': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "private": true,
  "description": "__DESCRIPTION__",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}`
    },
    {
      path: 'vite.config.js',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: __PORT__ }
});
`
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>__NAME__</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`
    },
    {
      path: 'src/main.jsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: 'src/App.jsx',
      content: `import React, { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('ready');
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>__NAME__</h1>
      <p>__DESCRIPTION__</p>
      <p>Status: {status}</p>
      <hr />
      <p>Generado por Trinnity Viseron System</p>
    </div>
  );
}

export default App;
`
    }
  ],
  'express-react': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "description": "__DESCRIPTION__",
  "scripts": {
    "dev:server": "node server/index.js",
    "dev:client": "cd client && npm run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build": "cd client && npm run build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "concurrently": "^8.2.0"
  }
}`
    },
    {
      path: 'server/index.js',
      content: `const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = __PORT__;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'ONLINE', app: '__NAME__', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log('🚀 Servidor __NAME__ corriendo en puerto ' + PORT);
});
`
    },
    {
      path: 'client/package.json',
      content: `{
  "name": "__NAME__-client",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}`
    },
    {
      path: 'client/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>__NAME__</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`
    },
    {
      path: 'client/src/main.jsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: 'client/src/App.jsx',
      content: `import React, { useState, useEffect } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(() => setApiStatus({ status: 'OFFLINE' }));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>__NAME__</h1>
      <p>__DESCRIPTION__</p>
      <p>API Status: {apiStatus?.status || 'loading...'}</p>
    </div>
  );
}

export default App;
`
    }
  ],
  'cli-tool': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "description": "__DESCRIPTION__",
  "main": "index.js",
  "bin": {
    "__NAME__": "./index.js"
  },
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "chalk": "^5.3.0"
  }
}`
    },
    {
      path: 'index.js',
      content: `#!/usr/bin/env node

const chalk = (await import('chalk')).default;

function main() {
  console.log(chalk.bold.cyan('🔧 __NAME__'));
  console.log(chalk.gray('__DESCRIPTION__'));
  console.log('');
  console.log(chalk.green('✓ Herramienta lista para usar'));
  console.log('');
  console.log(chalk.yellow('Comandos disponibles:'));
  console.log(chalk.white('  --help    Muestra esta ayuda'));
  console.log(chalk.white('  --version Muestra la versión'));
}

main();
`
    }
  ],
  'microservice': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "description": "__DESCRIPTION__",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "docker:build": "docker build -t __NAME__ .",
    "docker:run": "docker run -p __PORT__:__PORT__ __NAME__"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`
    },
    {
      path: 'src/index.js',
      content: `const express = require('express');

const app = express();
const PORT = process.env.PORT || __PORT__;
const SERVICE_NAME = '__NAME__';

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'healthy', uptime: process.uptime() });
});

app.get('/info', (req, res) => {
  res.json({ service: SERVICE_NAME, version: '1.0.0', description: '__DESCRIPTION__' });
});

app.listen(PORT, () => {
  console.log(\`🔷 Microservicio \${SERVICE_NAME} corriendo en puerto \${PORT}\`);
});
`
    },
    {
      path: 'Dockerfile',
      content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE __PORT__
CMD ["node", "src/index.js"]
`
    }
  ],
  'dashboard': [
    {
      path: 'package.json',
      content: `{
  "name": "__NAME__",
  "version": "1.0.0",
  "description": "__DESCRIPTION__",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "socket.io": "^4.7.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`
    },
    {
      path: 'server.js',
      content: `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = __PORT__;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { title: '__NAME__', description: '__DESCRIPTION__' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ONLINE', name: '__NAME__', uptime: process.uptime() });
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.emit('welcome', { message: 'Bienvenido a __NAME__' });
});

server.listen(PORT, () => {
  console.log('📊 Dashboard __NAME__ corriendo en http://localhost:' + PORT);
});
`
    },
    {
      path: 'views/index.ejs',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 2.5rem; color: #38bdf8; margin-bottom: 8px; }
    p { color: #94a3b8; margin-bottom: 24px; }
    .card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #334155; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #22c55e; color: white; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1><%= title %></h1>
    <p><%= description %></p>
    <div class="card">
      <span class="status">ONLINE</span>
      <p style="margin-top: 16px;">Dashboard generado autónomamente por Trinnity Viseron System</p>
    </div>
  </div>
</body>
</html>
`
    }
  ]
};

/**
 * AppScaffolder - Generador Autónomo de Aplicaciones y Soluciones
 * 
 * Capacidades:
 *  - Scaffolding de múltiples tipos de proyectos (API, React, Full-stack, CLI, Microservicios, Dashboards)
 *  - Creación autónoma de aplicaciones web completas
 *  - Registro de aplicaciones creadas en la base de conocimiento
 *  - Capacidad de deploy local de las soluciones generadas
 */
export class AppScaffolder {
  private memoryEngine: MemoryEngine;
  private appsDir: string;
  private appsCreated: number = 0;

  constructor(memoryEngine: MemoryEngine, appsDir?: string) {
    this.memoryEngine = memoryEngine;
    this.appsDir = appsDir || path.join(process.cwd(), 'generated-apps');
    fs.ensureDirSync(this.appsDir);
  }

  /**
   * Scaffolding autónomo de una aplicación completa.
   */
  public async scaffold(spec: AppSpec): Promise<ScaffoldResult> {
    const template = TEMPLATE_FILES[spec.template];
    if (!template) {
      return {
        success: false,
        appPath: '',
        filesCreated: 0,
        template: spec.template,
        message: `Template '${spec.template}' no soportado`
      };
    }

    const appDir = path.join(
      this.appsDir,
      `${spec.name}-${Date.now()}`
    );
    fs.ensureDirSync(appDir);

    let filesCreated = 0;

    for (const file of template) {
      const filePath = path.join(appDir, file.path);
      fs.ensureDirSync(path.dirname(filePath));

      let content = file.content
        .replace(/__NAME__/g, spec.name)
        .replace(/__DESCRIPTION__/g, spec.description)
        .replace(/__PORT__/g, String(spec.port || 3000));

      fs.writeFileSync(filePath, content, 'utf-8');
      filesCreated++;
    }

    // Registrar en memoria
    this.memoryEngine.addKnowledge(
      `App generada: ${spec.name} (${TEMPLATE_DESCRIPTIONS[spec.template]})`,
      'GENERATED_APPS',
      `Aplicación "${spec.name}" generada autónomamente usando template ${spec.template}. Descripción: ${spec.description}. Archivos creados: ${filesCreated}. Ubicación: ${appDir}`,
      ['generated_app', spec.template, 'autonomous', spec.name.toLowerCase().replace(/\s+/g, '_')]
    );

    this.appsCreated++;

    return {
      success: true,
      appPath: appDir,
      filesCreated,
      template: spec.template,
      message: `App "${spec.name}" creada exitosamente (${filesCreated} archivos en ${appDir})`
    };
  }

  /**
   * Crea una API REST Express rápida.
   */
  public async createAPI(name: string, description: string, port?: number): Promise<ScaffoldResult> {
    return this.scaffold({
      name,
      description,
      template: 'express-api',
      port: port || 3001,
      features: ['cors', 'json']
    });
  }

  /**
   * Crea una SPA React.
   */
  public async createReactApp(name: string, description: string, port?: number): Promise<ScaffoldResult> {
    return this.scaffold({
      name,
      description,
      template: 'react-spa',
      port: port || 5173
    });
  }

  /**
   * Crea un dashboard de monitoreo.
   */
  public async createDashboard(name: string, description: string, port?: number): Promise<ScaffoldResult> {
    return this.scaffold({
      name,
      description,
      template: 'dashboard',
      port: port || 4000
    });
  }

  /**
   * Crea un microservicio.
   */
  public async createMicroservice(name: string, description: string, port?: number): Promise<ScaffoldResult> {
    return this.scaffold({
      name,
      description,
      template: 'microservice',
      port: port || 5000
    });
  }

  /**
   * Crea automáticamente una app basada en el estado del sistema.
   * Usado por AutonomousPlanner para generación autónoma.
   */
  public async createAutonomousApp(): Promise<ScaffoldResult> {
    const templates: AppTemplate[] = ['express-api', 'react-spa', 'express-react', 'dashboard'];
    const template = templates[this.appsCreated % templates.length];
    const appNumber = this.appsCreated + 1;

    return this.scaffold({
      name: `TVS-AutoApp-${appNumber}`,
      description: `Aplicación autónoma #${appNumber} generada por Trinnity Viseron System usando template ${template}`,
      template,
      port: 3000 + appNumber
    });
  }

  /**
   * Lista aplicaciones generadas desde la base de conocimiento.
   */
  public getGeneratedApps(): string[] {
    const docs = this.memoryEngine.searchKnowledge('generated_app');
    return docs.map(d => d.title);
  }

  public getAppsDirectory(): string {
    return this.appsDir;
  }

  public getTotalAppsCreated(): number {
    return this.appsCreated;
  }

  /**
   * Registra un agente de scaffolding para el ecosistema TVS.
   */
  public createScaffolderAgent(): IAgent {
    return {
      id: "agent_scaffolder",
      name: "AppForger",
      role: "App Scaffolder & Solution Generator",
      status: "ACTIVE",
      description: "Agente especializado en generar aplicaciones web, APIs y soluciones completas de forma autónoma.",
      capabilities: ["app_generation", "web_development", "api_creation", "scaffolding", "fullstack"],
      execute: async (task: string, context?: Record<string, any>): Promise<AgentExecutionResult> => {
        const start = Date.now();
        try {
          const lower = task.toLowerCase();

          if (lower.includes('crear api') || lower.includes('create api')) {
            const name = context?.name || 'AutoAPI';
            const result = await this.createAPI(name, task);
            return {
              agentId: "agent_scaffolder",
              agentName: "AppForger",
              success: result.success,
              output: result.message,
              data: { appPath: result.appPath, filesCreated: result.filesCreated },
              executionTimeMs: Date.now() - start
            };
          }

          if (lower.includes('crear react') || lower.includes('create react')) {
            const name = context?.name || 'AutoReactApp';
            const result = await this.createReactApp(name, task);
            return {
              agentId: "agent_scaffolder",
              agentName: "AppForger",
              success: result.success,
              output: result.message,
              data: { appPath: result.appPath, filesCreated: result.filesCreated },
              executionTimeMs: Date.now() - start
            };
          }

          if (lower.includes('crear dashboard') || lower.includes('create dashboard')) {
            const name = context?.name || 'AutoDashboard';
            const result = await this.createDashboard(name, task);
            return {
              agentId: "agent_scaffolder",
              agentName: "AppForger",
              success: result.success,
              output: result.message,
              data: { appPath: result.appPath, filesCreated: result.filesCreated },
              executionTimeMs: Date.now() - start
            };
          }

          // Por defecto, crear API
          const result = await this.createAPI('AutoSolution', task);
          return {
            agentId: "agent_scaffolder",
            agentName: "AppForger",
            success: result.success,
            output: result.message,
            data: { appPath: result.appPath, filesCreated: result.filesCreated },
            executionTimeMs: Date.now() - start
          };
        } catch (err: any) {
          return {
            agentId: "agent_scaffolder",
            agentName: "AppForger",
            success: false,
            output: '',
            error: err.message || String(err),
            executionTimeMs: Date.now() - start
          };
        }
      }
    };
  }
}
