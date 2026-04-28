@echo off
REM
REM 站群模板 - 一键部署脚本 (Windows)
REM
REM 使用方式: scripts\deploy.bat
REM

echo ========================================
echo   🚀 站群博客 - 开始构建部署
echo ========================================
echo.

REM 检查 node_modules
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call pnpm install
) else (
    echo ✅ 依赖已安装
)

echo.
echo 🔨 正在构建...
call pnpm build

echo.
echo ✅ 构建完成！
echo.
echo ========================================
echo   📤 部署到 Cloudflare Pages
echo ========================================
echo.
echo 方式一：Wrangler CLI
echo   npx wrangler pages deploy dist
echo.
echo 方式二：连接 GitHub
echo   1. 推送代码到 GitHub
echo   2. Cloudflare Pages - 新建项目 - 连接 GitHub
echo   3. 设置构建命令: pnpm build
echo   4. 设置输出目录: dist
echo.
echo ========================================
pause
