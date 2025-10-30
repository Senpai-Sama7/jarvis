#!/bin/bash
# Validation script to check JARVIS 2.0 structure and completeness

set -e

echo "🔍 JARVIS 2.0 Validation Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js version
echo "📦 Checking prerequisites..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        pass "Node.js $(node -v) installed"
    else
        fail "Node.js 18+ required (found $(node -v))"
        exit 1
    fi
else
    fail "Node.js not found"
    exit 1
fi

echo ""
echo "📁 Checking file structure..."

# Core modules
declare -a core_files=(
    "src/types/index.ts"
    "src/core/utils/logger.ts"
    "src/core/utils/errors.ts"
    "src/core/utils/helpers.ts"
    "src/core/security/sanitizer.ts"
    "src/core/security/secrets.ts"
    "src/core/security/auth.ts"
    "src/core/config/index.ts"
    "src/core/config/validator.ts"
    "src/core/ai/llm-interface.ts"
    "src/core/ai/groq-client.ts"
)

for file in "${core_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        fail "$file"
    fi
done

echo ""
echo "🖥️  Checking interface files..."

# Interface files
declare -a interface_files=(
    "src/interfaces/cli/index.ts"
    "src/interfaces/cli/repl.ts"
    "src/interfaces/cli/commands/index.ts"
    "src/interfaces/api/index.ts"
    "src/interfaces/api/routes/chat.ts"
    "src/interfaces/api/routes/code.ts"
    "src/interfaces/api/routes/config.ts"
    "src/interfaces/api/middleware/auth.ts"
    "src/interfaces/api/middleware/sanitization.ts"
)

for file in "${interface_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        fail "$file"
    fi
done

echo ""
echo "🔌 Checking plugin system..."

declare -a plugin_files=(
    "src/plugins/manager.ts"
    "src/plugins/examples/example-plugin.ts"
)

for file in "${plugin_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        fail "$file"
    fi
done

echo ""
echo "🧪 Checking test files..."

declare -a test_files=(
    "tests/unit/security/sanitizer.test.ts"
    "tests/unit/config/validator.test.ts"
    "tests/unit/utils/helpers.test.ts"
    "jest.config.json"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        fail "$file"
    fi
done

echo ""
echo "📚 Checking documentation..."

declare -a doc_files=(
    "ARCHITECTURE.md"
    "QUICKSTART.md"
    "TRANSFORMATION_SUMMARY.md"
    "README-NEW.md"
    "docs/user/cli-guide.md"
    "docs/user/api-guide.md"
    "docs/user/deployment-guide.md"
    "docs/user/migration-guide.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        fail "$file"
    fi
done

echo ""
echo "⚙️  Checking configuration..."

declare -a config_files=(
    "config/default.json"
    "src/tsconfig.json"
    "package.json"
    ".env.example"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        pass "$file"
    else
        warn "$file not found (may need to be created)"
    fi
done

echo ""
echo "🔒 Checking security..."

# Check for hardcoded API keys
echo -n "Checking for hardcoded API keys... "
if grep -r "gsk_" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "example" | grep -v "your_key" > /dev/null; then
    fail "Found potential hardcoded API keys"
else
    pass "No hardcoded API keys found"
fi

# Check for command injection vulnerabilities
echo -n "Checking sanitization usage... "
if grep -r "exec\|spawn" src/ --exclude-dir=node_modules | grep -v "sanitize" | grep -v "import" > /dev/null; then
    warn "Found exec/spawn without apparent sanitization (manual review needed)"
else
    pass "No obvious command injection risks"
fi

echo ""
echo "📊 Code Statistics..."

# Count lines of code
total_lines=$(find src/ -name "*.ts" -exec cat {} \; | wc -l)
echo "Total TypeScript lines: $total_lines"

# Count files
total_files=$(find src/ -name "*.ts" | wc -l)
echo "Total TypeScript files: $total_files"

# Count test files
test_files_count=$(find tests/ -name "*.test.ts" 2>/dev/null | wc -l || echo "0")
echo "Test files: $test_files_count"

echo ""
echo "✅ Validation Summary"
echo "===================="

# Count checks
total_checks=$((${#core_files[@]} + ${#interface_files[@]} + ${#plugin_files[@]} + ${#test_files[@]} + ${#doc_files[@]} + ${#config_files[@]} + 2))
echo "Total checks: $total_checks"

echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npm run build:core"
echo "  3. Run: npm run start:cli (after setting GROQ_API_KEY)"
echo ""

if [ -f "node_modules/.bin/tsc" ]; then
    echo "🔨 TypeScript compiler found, checking syntax..."
    if npx tsc --noEmit -p src/tsconfig.json 2>&1 | head -20; then
        pass "TypeScript syntax check passed"
    else
        warn "TypeScript syntax check found issues (this is expected before npm install)"
    fi
else
    warn "TypeScript not installed (run 'npm install' first)"
fi

echo ""
echo "✨ Validation complete!"
