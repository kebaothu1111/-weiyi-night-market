# 味憶夜市：港都深夜食堂 — ghi chú cho Claude

Game web một file của 阮庭陽 (đồ án giữa kỳ môn 生成式AI應用). Chủ repo nói tiếng Việt thân mật; chữ trong game là 繁體中文 (Đài Loan).

## Cấu trúc
- `index.html` (~900 dòng): toàn bộ game, HTML + CSS + JS thuần, không build, không thư viện, không ảnh ngoài.
- `.github/workflows/deploy.yml`: push lên `main` → tự đăng GitHub Pages (https://kebaothu1111.github.io/-weiyi-night-market/).
- `README.md`: giới thiệu cho người chơi.

## Bản đồ `index.html` (tìm theo comment `/* ---------- tên ---------- */`)
- CSS: token màu/font trong `:root{` ở đầu file; giao diện tối duy nhất (không có light mode).
- `data`: `ZONES` (5 khu), `ING` (nguyên liệu → emoji), `DISHES` (15 món: name, emoji, zone, steps[4], who, memory, story, fact), `STATS`, `UPGRADES`, `INTRO`, `ENDING`.
- `state & save`: `SAVE_KEY`, `newState()`, `valid()` kiểm tra save, `save()/loadSave()` dùng localStorage.
- `derived rules`: công thức độ khó/kinh tế (`patienceMax`, `prepMax`, `greenW`, `freshNights`, `customersTonight`, `dishPrice`, `bundleCost`, `expNeed`).
- `audio`: âm thanh tổng hợp bằng Web Audio (`sfx`).
- Màn hình: `title`, `story panels`, `hub`, `market`, `stats`, `album`, `save / backup`.
- `night`: vòng chơi — `pickCustomers` → `nextCustomer` (đoán món) → `startPrep`/`onIng` (chọn nguyên liệu theo thứ tự) → `startHeat`/`onStop` (canh lửa, chấm điểm) → `onServe` (cộng thưởng, mở thẻ) → `endNight` (hỏng nguyên liệu, mở khu, lưu).
- `main loop` (requestAnimationFrame: thanh kiên nhẫn, thời gian chuẩn bị, kim lửa), `events` (mọi nút dùng `data-act`, xử lý trong một `switch`), `boot`.

## Luật cần giữ
- 15 món là con số cố định: `S.frags` dài 15, 15 lồng đèn, `valid()` kiểm `length===15`. Thêm/bớt món phải sửa cả mấy chỗ đó và đổi `SAVE_KEY`/`v` để save cũ không vỡ.
- Đổi cấu trúc `S` (state lưu) → cập nhật `newState()` và `valid()`; nếu không tương thích thì tăng phiên bản save.
- Công thức điểm (khớp slide báo cáo): nguyên liệu `50*đúng/(4+sai)`, lửa 30/15/0, tốc độ `20*kiên nhẫn còn lại`. ≥80 hoàn hảo (được mảnh ký ức), 50–79 thường, <50 thất bại. Đổi luật thì nhắc chủ repo cập nhật slide.
- Bản public không ghi MSSV, chỉ ghi tên 阮庭陽.
- Chỉ sửa đúng phần được nhờ; không viết lại cả file.

## Kiểm tra trước khi push
Chạy nhanh bằng Playwright (có sẵn): mở `index.html`, bấm `[data-act=newgame]` → `[data-act=skip]` → `[data-act=open]`, chơi 1 khách (đọc `N.cur.i`, bấm đúng món, đúng thứ tự `DISHES[i].steps`, bấm `[data-act=stop]`), xem console không có lỗi. Kiểm thêm phần vừa sửa.

## Đăng lên
Commit vào `main` rồi push; Actions tự đăng trong 1–2 phút. Không mở được github.io từ sandbox — nhờ chủ repo mở link kiểm tra.
