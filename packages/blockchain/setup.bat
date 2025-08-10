@echo off
echo 🚀 Setting up Medflect AI Blockchain Package...
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Setting up environment...
if not exist .env (
    echo Copying env.example to .env...
    copy env.example .env
    echo ✅ Environment file created
    echo ⚠️  Please edit .env with your configuration
) else (
    echo ✅ Environment file already exists
)

echo.
echo 🏗️ Compiling contracts...
call npm run compile

echo.
echo 🧪 Running tests...
call npm run test

echo.
echo ✅ Setup complete!
echo.
echo 💡 Next steps:
echo    1. Edit .env with your configuration
echo    2. Run 'npm run node' to start local blockchain
echo    3. Run 'npm run deploy:local' to deploy contracts
echo.
pause 