#!/bin/bash

# Exit on error
set -e

# Detect Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

echo "🔍 Detected Node.js version: $NODE_VERSION"

if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher is required"
  echo "   Current version: $(node -v)"
  exit 1
fi

# Set Vite version based on Node version
if [ "$NODE_VERSION" -ge 20 ]; then
  VITE_VERSION="latest"
  echo "✅ Using Vite latest (Node 20+)"
else
  VITE_VERSION="5.4.11"
  echo "✅ Using Vite $VITE_VERSION (Node 18 compatible)"
fi

# Detect OS and set sed syntax
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "📦 pnpm not found. Installing pnpm..."
  npm install -g pnpm
fi

# Check if project name is provided
if [ -z "$1" ]; then
  echo "❌ Usage: ./create-react-astryx.sh <project-name>"
  exit 1
fi

PROJECT_NAME="$1"

echo "🚀 Creating new React + Vite + Astryx project: $PROJECT_NAME"

# Create new Vite project (always use latest create-vite, pin vite version later)
pnpm create vite "$PROJECT_NAME" --template react-ts

# Navigate into project directory
cd "$PROJECT_NAME"

echo "🧹 Cleaning up Vite template..."
$SED_INPLACE '/<link rel="icon".*vite\.svg/d' index.html
$SED_INPLACE 's/<title>.*<\/title>/<title>'"$PROJECT_NAME"'<\/title>/' index.html

echo "📦 Installing base dependencies..."
pnpm install

# Pin Vite version for Node 18
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "📌 Pinning Vite to $VITE_VERSION for Node 18 compatibility..."
  pnpm add -D vite@$VITE_VERSION
fi

echo "📦 Installing Tailwind CSS and Astryx dependencies..."
pnpm install -D tailwindcss@3.4.1 postcss autoprefixer @types/node
pnpm install @astryxdesign/core @astryxdesign/theme-neutral @astryxdesign/theme-gothic lucide-react next-themes clsx tailwind-merge date-fns zod

echo "⚙️  Creating Tailwind and PostCSS configuration..."
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "📝 Configuring Tailwind content scanning..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF

# Add Astryx and Tailwind base styles to index.css
echo "🎨 Adding Astryx and Tailwind base styles..."
cat > src/index.css << 'EOF'
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";
@import "@astryxdesign/theme-gothic/theme.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: var(--color-background);
  color: var(--color-text-primary);
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}
EOF

# Add path aliases to tsconfig.json
echo "🔧 Adding path aliases to tsconfig.json..."
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
config.compilerOptions = config.compilerOptions || {};
config.compilerOptions.baseUrl = '.';
config.compilerOptions.paths = { '@/*': ['./src/*'] };
fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2));
"

# Add path aliases to tsconfig.app.json
echo "🔧 Adding path aliases to tsconfig.app.json..."
node -e "
const fs = require('fs');
const path = 'tsconfig.app.json';
const content = fs.readFileSync(path, 'utf8');
// Remove comments manually
const lines = content.split('\n').filter(line => !line.trim().startsWith('//'));
const jsonContent = lines.join('\n');
const config = JSON.parse(jsonContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '\$1'));
config.compilerOptions = config.compilerOptions || {};
config.compilerOptions.baseUrl = '.';
config.compilerOptions.paths = { '@/*': ['./src/*'] };
fs.writeFileSync(path, JSON.stringify(config, null, 2));
"

# Update vite.config.ts
echo "⚙️  Updating Vite configuration..."
cat > vite.config.ts << 'EOF'
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
EOF

# Create Astryx provider and starter screen
echo "🧩 Adding Astryx provider and starter screen..."
cat > src/AstryxProvider.tsx << 'EOF'
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LayerProvider, LinkProvider, Theme } from "@astryxdesign/core";
import { gothicTheme } from "@astryxdesign/theme-gothic/built";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

type ColorMode = "light" | "dark";

interface AstryxThemeContextValue {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

const AstryxThemeContext = createContext<AstryxThemeContextValue | null>(null);

export function useAstryxTheme(): AstryxThemeContextValue {
  const context = useContext(AstryxThemeContext);
  if (!context) {
    throw new Error("useAstryxTheme must be used inside AstryxProvider");
  }
  return context;
}

export function AstryxProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const saved = localStorage.getItem("astryx-color-mode");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("astryx-color-mode", colorMode);
  }, [colorMode]);

  const value = useMemo(
    () => ({
      colorMode,
      toggleColorMode: () =>
        setColorMode((current) => (current === "dark" ? "light" : "dark")),
    }),
    [colorMode],
  );

  return (
    <Theme theme={colorMode === "dark" ? gothicTheme : neutralTheme} mode={colorMode}>
      <LinkProvider component="a">
        <LayerProvider>
          <AstryxThemeContext.Provider value={value}>
            {children}
          </AstryxThemeContext.Provider>
        </LayerProvider>
      </LinkProvider>
    </Theme>
  );
}
EOF

cat > src/App.tsx << 'EOF'
import { useState } from "react";
import { CheckCircle2, Moon, Search, Sun } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Selector,
  Stack,
  Text,
  TextInput,
} from "@astryxdesign/core";
import { useAstryxTheme } from "./AstryxProvider";

const taskStates = ["Planning", "Building", "Reviewing"];

export default function App(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [state, setState] = useState(taskStates[0]);
  const { colorMode, toggleColorMode } = useAstryxTheme();

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-8 text-[var(--color-text-primary)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <HStack justify="between" align="center" wrap="wrap" gap={3}>
          <Stack gap={1}>
            <Badge variant="success" label="Astryx ready" icon={<CheckCircle2 size={14} />} />
            <Heading level={1} type="display-3">
              Build with the Astryx component system
            </Heading>
          </Stack>
          <Button
            label={colorMode === "dark" ? "Light mode" : "Dark mode"}
            variant="secondary"
            icon={colorMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            onClick={toggleColorMode}
          />
        </HStack>

        <Card padding={6}>
          <Stack gap={4}>
            <Text type="large" color="secondary" as="p">
              This starter uses Astryx components, Astryx themes, and Tailwind for layout
              utilities. No legacy component wrapper layer is generated.
            </Text>

            <HStack gap={3} wrap="wrap" align="end">
              <TextInput
                label="Search"
                isLabelHidden
                startIcon={<Search size={16} />}
                placeholder="Search tasks"
                value={query}
                onChange={setQuery}
                width={280}
              />
              <Selector
                label="Task state"
                options={taskStates}
                value={state}
                onChange={setState}
                width={220}
              />
              <Button label="Create task" variant="primary" />
            </HStack>
          </Stack>
        </Card>
      </section>
    </main>
  );
}
EOF

cat > src/main.tsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AstryxProvider } from "./AstryxProvider";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AstryxProvider>
      <App />
    </AstryxProvider>
  </React.StrictMode>,
);
EOF

echo "✅ Setup complete! You can now use Tailwind CSS and Astryx in your project."
echo ""
echo "📦 Included foundation:"
echo "  - @astryxdesign/core"
echo "  - @astryxdesign/theme-neutral"
echo "  - @astryxdesign/theme-gothic"
echo "  - Tailwind CSS utilities for layout"
echo ""
echo "To start developing:"
echo "  cd $PROJECT_NAME"
echo "  pnpm dev"
echo ""
echo "📚 Import components like:"
echo "  import { Button, Card, Dialog, Selector, TextInput } from '@astryxdesign/core'"
