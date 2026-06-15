const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets');
const ICON_SRC = path.join(__dirname, '../fontend/public/images/logo_tab.png');
const ICON_DEST = path.join(ASSETS_DIR, 'icon.png');

console.log('=== BẮT ĐẦU TẠO ICON VÀ SPLASH NATIVE ===');

try {
  // 1. Tạo thư mục assets nếu chưa có
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // 2. Copy logo_tab.png làm icon gốc
  if (fs.existsSync(ICON_SRC)) {
    fs.copyFileSync(ICON_SRC, ICON_DEST);
    console.log('=> Đã sao chép logo_tab.png thành assets/icon.png');
  } else {
    throw new Error(`Không tìm thấy logo gốc tại: ${ICON_SRC}`);
  }

  // 3. Cài đặt và chạy @capacitor/assets để sinh ra các kích thước icon cho iOS
  console.log('=> Đang cài đặt thư viện @capacitor/assets...');
  execSync('npm install -D @capacitor/assets', { cwd: __dirname, stdio: 'inherit' });

  console.log('=> Đang tạo các file icon cho dự án iOS native...');
  execSync('npx capacitor-assets generate --ios', { cwd: __dirname, stdio: 'inherit' });
  
  console.log('=== HOÀN TẤT TẠO ICON APP IOS ===');
} catch (error) {
  console.error('[LỖI] Không thể tạo icon:', error.message);
}
