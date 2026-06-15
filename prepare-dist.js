const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '../fontend');
const LOCAL_DIST_DIR = path.join(__dirname, 'dist');
const DIST_INDEX_HTML = path.join(LOCAL_DIST_DIR, 'index.html');
const API_URL = process.env.VITE_API_URL || 'https://store-uat.tisbroker.com/api';

console.log('=== BẮT ĐẦU QUÁ TRÌNH CHUẨN BỊ BUILD APP IOS ===');

try {
  // 1. Kiểm tra và build frontend nếu thư mục code nguồn tồn tại (ở máy local)
  if (fs.existsSync(FRONTEND_DIR)) {
    console.log(`\n1. Phát hiện thư mục mã nguồn frontend tại: ${FRONTEND_DIR}`);
    console.log(`   Đang tiến hành biên dịch frontend React...`);
    execSync('npm run build', { cwd: FRONTEND_DIR, stdio: 'inherit' });
    console.log('=> Biên dịch frontend thành công!');

    // Copy thư mục dist từ frontend sang App-IOS/dist
    console.log(`\n   Đang sao chép tài nguyên đã build vào thư mục app iOS...`);
    if (fs.existsSync(LOCAL_DIST_DIR)) {
      fs.rmSync(LOCAL_DIST_DIR, { recursive: true, force: true });
    }
    fs.cpSync(path.join(FRONTEND_DIR, 'dist'), LOCAL_DIST_DIR, { recursive: true });
    console.log(`=> Sao chép tài nguyên thành công vào: ${LOCAL_DIST_DIR}`);
  } else {
    console.log('\n1. [Thông tin] Không tìm thấy thư mục mã nguồn frontend (đang chạy trên môi trường Git/Build CI).');
    console.log('   Sẽ sử dụng trực tiếp tài nguyên web đã compile trong thư mục App-IOS/dist.');
  }

  // 2. Patch index.html để định nghĩa window.__TIS_API_URL__
  if (!fs.existsSync(DIST_INDEX_HTML)) {
    throw new Error(`Không tìm thấy file index.html tại: ${DIST_INDEX_HTML}. Vui lòng chạy build frontend trước.`);
  }

  console.log(`\n2. Đang cấu hình API URL cho ứng dụng iOS...`);
  console.log(`   URL API sử dụng: ${API_URL}`);

  let htmlContent = fs.readFileSync(DIST_INDEX_HTML, 'utf8');

  // Thêm window.__TIS_API_URL__ ngay sau thẻ <head> để các file JS load sau có thể đọc được ngay
  const scriptToInject = `\n    <script>window.__TIS_API_URL__ = "${API_URL}";</script>`;
  
  if (htmlContent.includes('<head>')) {
    htmlContent = htmlContent.replace('<head>', `<head>${scriptToInject}`);
  } else {
    // Trường hợp dự phòng nếu không tìm thấy thẻ <head> viết thường
    htmlContent = htmlContent.replace(/<head>/i, (match) => `${match}${scriptToInject}`);
  }

  fs.writeFileSync(DIST_INDEX_HTML, htmlContent, 'utf8');
  console.log('=> Cấu hình API URL vào index.html thành công!');

  // 3. Sync tài nguyên sang Xcode
  console.log(`\n3. Đang đồng bộ tài nguyên web sang dự án iOS native qua Capacitor...`);
  try {
    // Tự động tắt telemetry để tránh hiển thị câu hỏi khảo sát gây nghẽn tiến trình build
    execSync('npx cap telemetry off', { cwd: __dirname, stdio: 'ignore' });
  } catch (e) {}
  execSync('npx cap sync ios', { cwd: __dirname, stdio: 'inherit' });
  console.log('=> Đồng bộ Capacitor thành công!');

  console.log('\n=== HOÀN TẤT CHUẨN BỊ APP IOS ===');
} catch (error) {
  console.error('\n[LỖI] Quá trình chuẩn bị thất bại:', error.message);
  process.exit(1);
}
