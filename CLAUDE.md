# 味憶夜市：港都深夜食堂 — ghi chú cho Claude

Game web của 阮庭陽 (đồ án giữa kỳ môn 生成式AI應用). Chủ repo nói tiếng Việt thân mật. Game song ngữ 繁體中文 (Đài Loan) / Tiếng Việt, nút đổi ngôn ngữ ở HUD và màn hình tiêu đề.

## Cấu trúc (HTML + CSS + JS thuần, không build, không thư viện, không ảnh ngoài)
- `index.html`: khung trang, nạp `css/game.css`, `js/data.js`, `js/art.js`, `js/game.js` theo thứ tự đó.
- `css/game.css`: sân khấu cố định 960×540 (màn ngang), JS scale cho vừa cửa sổ; màn dọc hiện lớp "xoay ngang".
- `js/data.js`: `LANG`, `L()`, `STR` + `t()` (mọi chữ là `[中文, Tiếng Việt]`), `ZONES`, `METHODS` (6 cách nấu: wok/pan/pot/grill/fryer/steamer, mỗi cách một kiểu kim chạy), `TOOL_TIERS` (5 bậc đồ nghề), `ING` (nguyên liệu: cửa hàng, giá gói, số phần/gói, tươi hay khô), `SHOPS`, `SHOP_LV` (4 cấp quán: số ghế, tiền thuê), `GEAR`, `STATS`, `RANKS` (R/SR/SSR/UR), `DISHES` (15 món: name, emoji, zone, m, sweet, steps[4], who, look, memory, story, fact), `SPECIAL` (bà, nhân vật chính, VIP, giang hồ, ma), `INTRO`, `ENDING`, `EVENTS`, `EV_OUT`.
- `js/art.js`: pixel art vẽ bằng canvas — `ART.scene` (quán theo cấp, khách, bàn ghế, bếp), `ART.person`, `ART.portrait`, `ART.cook` (cận cảnh 6 dụng cụ, đổi màu/hình theo bậc), `ART.toolIcon`, `ART.stallPreview`, `ART.map`, `ART.MAP_SPOTS`, `ART.SEATS`, `ART.ENTRY`, `ART.EXIT_X`.
- `js/game.js`: state & save, luật suy ra, kho nguyên liệu, audio, HUD/dock, title, story, ban ngày (`showHub`), bản đồ + cửa hàng + xưởng + bệnh viện, đêm (`openStall` → `simNight` mỗi khung hình: khách vào ngồi, chờ, gọi món → `beginOrder` → `confirmCook` → `startPrep`/`onIng` → `startWarm` → `startHeat`/`stepPointer`/`onStop` → `onServe`), sự kiện (`startEvent`/`evChoice`/`evOutcome`), `endNight`, hóa đơn Chủ nhật (`showBills`), `showOver`, vòng lặp `loop`, sự kiện click qua `data-act` trong một `switch`, `boot`.
- `.github/workflows/deploy.yml`: push lên `main` → copy `index.html css js` lên GitHub Pages (https://kebaothu1111.github.io/-weiyi-night-market/).

## Luật cần giữ
- 15 món là con số cố định: `S.frags` dài 15, 15 lồng đèn, `valid()` kiểm `length===15`. Thêm/bớt món phải sửa mấy chỗ đó và đổi `SAVE_KEY`/`v`.
- Save hiện tại `v:2` (`weiyi-night-market-v2`); `migrate()` chuyển save v1 cũ. Đổi cấu trúc `S` → sửa `newState()` + `valid()`, không tương thích thì tăng phiên bản.
- Công thức điểm (khớp slide báo cáo): nguyên liệu `50*đúng/(4+sai)`, lửa 30/15/0, tốc độ `20*kiên nhẫn còn lại`, thiếu muối/đường −15. ≥80 hoàn hảo (khách có câu chuyện cho mảnh ký ức), 50–79 thường, <50 thất bại. Rank = điểm + thưởng đồ nghề `(cấp-1)*5`: UR≥115, SSR≥100, SR≥85, còn lại R. Đổi luật thì nhắc chủ repo cập nhật slide.
- Hóa đơn mỗi Chủ nhật (thuê + điện + viện phí 600 đến khi xem kết). Không đủ tiền → game over, xóa save.
- Chữ mới phải có cả hai ngôn ngữ. Bản public không ghi MSSV, chỉ ghi tên 阮庭陽.
- Chỉ sửa đúng phần được nhờ; không viết lại cả file.

## Kiểm tra trước khi push
Playwright (Python, có sẵn): mở `index.html`, bấm `[data-act=newgame]` → `[data-act=skip]` → `[data-act=open]`, đợi khách ngồi, bấm `[data-act=servenext]`; nếu là khách câu chuyện thì bấm `[data-act=guess][data-i=N.active.dish]`, không thì `[data-act=cookit]`; bấm nguyên liệu theo `DISHES[i].steps`, đợi pha `heat`, bấm `[data-act=stop]`, `[data-act=serve]`. Console không được có lỗi. Chụp màn hình 1280×720 để xem.

## Đăng lên
Commit vào `main` rồi push; Actions tự đăng trong 1–2 phút. Không mở được github.io từ sandbox — nhờ chủ repo mở link kiểm tra.
