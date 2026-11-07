'use strict';
/* ---------- language ---------- */
// Every text field is [中文, Tiếng Việt]. L() picks the current language.
let LANG = 0;
const L = x => Array.isArray(x) ? (x[LANG] ?? x[0]) : x;
const STR = {
  title:['味憶夜市','Chợ Đêm Vị Ức'], sub:['港都深夜食堂','Quán Khuya Cảng Cao Hùng'],
  tagline:['一碗湯，喚回一段被遺忘的家鄉。猜出客人的回憶、備料、抓準火候，把十五盞燈籠重新點亮。','Một bát canh gọi về miền quê đã quên. Đoán ký ức của khách, chuẩn bị nguyên liệu, canh lửa thật chuẩn để thắp lại mười lăm chiếc lồng đèn.'],
  cont:['繼續營業','Tiếp tục'], newgame:['開始遊戲','Bắt đầu'], restart:['重新開始','Chơi lại từ đầu'], importSave:['匯入存檔','Nhập save'],
  credit:['生成式AI應用 期中專題・阮庭陽','Đồ án giữa kỳ môn Ứng dụng AI tạo sinh・阮庭陽'],
  restartQ:['重新開始？','Chơi lại từ đầu?'], restartWarn:['現有的存檔會被覆蓋，不能復原。','Save hiện tại sẽ bị ghi đè, không khôi phục được.'],
  cancel:['取消','Hủy'], confirm:['確定','Xác nhận'], close:['關閉','Đóng'], back:['返回','Quay lại'], next:['下一句','Tiếp'], skip:['略過','Bỏ qua'], start:['開始','Bắt đầu'],
  day:['第 {0} 天','Ngày {0}'], wd:[['週一','週二','週三','週四','週五','週六','週日'],['T2','T3','T4','T5','T6','T7','CN']],
  money:['新台幣','Tiền'], rep:['口碑','Uy tín'], stamina:['體力','Thể lực'],
  billIn:['週日帳單 ${0}・還有 {1} 天','Hóa đơn CN ${0}・còn {1} ngày'], billTonight:['今晚收攤要繳帳單 ${0}','Tối nay đóng quán phải trả ${0}'],
  map:['地圖','Bản đồ'], stats:['能力','Kỹ năng'], album:['圖鑑','Bộ sưu tập'], saves:['存檔','Lưu game'], open:['開店營業','Mở quán'],
  serveNext:['接待客人','Tiếp khách'], closeEarly:['提早收攤','Đóng quán sớm'], toStall:['回到攤位','Về quán'],
  dayHint:['白天：先到地圖採買食材、升級器具，晚上再開店。','Ban ngày: lên bản đồ mua nguyên liệu, nâng cấp đồ nghề, tối hẵng mở quán.'],
  goalZone:['開放下一區：口碑 {0}/3・本區料理卡 {1}/3・本區營業 {2}/3 夜','Mở khu mới: uy tín {0}/3・thẻ món khu này {1}/3・đã bán {2}/3 đêm'],
  goalEnd:['集滿 15 張料理卡迎接結局：{0}/15','Gom đủ 15 thẻ món để xem kết: {0}/15'],
  lowStock:['有 {0} 道菜缺食材，客人點了會做不出來。','Có {0} món đang thiếu nguyên liệu, khách gọi sẽ không làm được.'],
  tapCustomer:['點一下頭上有「!」的客人開始接待','Chạm vào khách có dấu「!」để tiếp'],
  says:['客人說','Khách nói'], guessQ:['猜猜客人想吃什麼？','Khách muốn ăn món gì?'], clue:['線索：{0}的味道。','Gợi ý: hương vị {0}.'],
  wrongGuess:['「不是這個味道……」','"Không phải vị này..."'], stockN:['庫存夠做 {0} 份','Đủ làm {0} phần'],
  order:['「老闆，來一份{0}！」','"Chủ quán ơi, cho một phần {0}!"'], cookIt:['開始料理','Bắt tay nấu'],
  noIng:['缺少食材：{0}，客人只好離開。','Thiếu nguyên liệu: {0}, khách đành bỏ đi.'],
  noSalt:['沒有鹽或糖了，味道差了一點（-15）','Hết muối/đường, món nhạt đi (-15)'],
  patience:['耐心','Kiên nhẫn'], prepT:['依序備料','Chuẩn bị theo thứ tự'], prepHint:['照上面的食譜順序點食材，發光的就是下一樣。','Làm theo công thức phía trên, nguyên liệu phát sáng là món tiếp theo.'],
  hw_mash:['狂點按鈕（或空白鍵），在時間內把進度條灌滿！','Bấm liên tục (hoặc Space) cho đầy thanh trước khi hết giờ!'],
  hw_sweep:['指針越跑越快，進綠區時按下翻面；跑到底就燒焦了！','Kim chạy nhanh dần, vào vùng xanh thì bấm lật; chạy tới cuối là cháy!'],
  hw_hold:['按住加火、放開降溫，讓指針待在綠區直到下方進度滿。','Giữ nút để tăng lửa, thả ra để hạ; giữ kim trong vùng xanh tới khi thanh dưới đầy.'],
  hw_arrows:['像 Audition 一樣照順序按方向鍵，按錯就要從頭來！','Bấm đúng chuỗi mũi tên như Audition, sai là làm lại từ đầu!'],
  hw_multi:['油鍋裡有 3 份料：指針每次進綠區就按一下撈起一份。','Có 3 mẻ trong chảo dầu: mỗi lần kim vào vùng xanh thì bấm vớt một mẻ.'],
  hw_rhythm:['蒸氣音符飛到左邊的線上時按下，跟著節奏！','Bấm khi nốt hơi nước bay chạm vạch bên trái, theo nhịp!'],
  timeLeft:['{0} 秒','{0}s'], hits:['已撈起 {0}/3','Đã vớt {0}/3'], holdKey:['按住按鈕或空白鍵','Giữ nút hoặc phím Space'],
  miss:['失誤 {0}','Sai {0}'], timeUp:['時間到！先下鍋再說','Hết giờ! Cứ cho vào nồi đã'], heating:['加熱中……','Đang làm nóng...'],
  zoneW:['綠區 {0}%','Vùng xanh {0}%'], perfect:['完美 +30','Hoàn hảo +30'], good:['不錯 +15','Khá +15'], fail0:['失手 0','Hỏng 0'],
  tier1:['完美上菜！','Hoàn hảo!'], tier2:['普通，客人吃飽了','Tạm được, khách no rồi'], tier3:['客人失望地離開了……','Khách thất vọng bỏ đi...'],
  sIng:['食材正確','Nguyên liệu'], sHeat:['火候','Độ lửa'], sSpeed:['速度','Tốc độ'], sTotal:['料理分數','Điểm món'], sBonus:['器具加成','Thưởng đồ nghề'], sQual:['品質','Phẩm chất'],
  hLabel:[['完美','不錯','失手'],['Hoàn hảo','Khá','Hỏng']],
  frag:['回憶碎片 +1（{0}/3）','Mảnh ký ức +1 ({0}/3)'], fragFull:['這道菜的回憶已經集滿了。','Ký ức món này đã gom đủ.'],
  redo:['用月嬤的祕方重做','Dùng bí kíp bà Nguyệt nấu lại'], serve:['上菜！','Mang món ra!'], secretLeft:['祕方剩 {0} 次','Bí kíp còn {0} lần'],
  redoToast:['月嬤的祕方：再試一次！','Bí kíp bà Nguyệt: thử lại nào!'],
  leftAngry:['等太久了，客人生氣地走了……','Chờ lâu quá, khách bực bỏ đi...'], leftRep:['口碑下降','Uy tín giảm'],
  paid:['+${0}','+${0}'], lvUp:['升到 Lv {0}！獲得 2 點能力點','Lên Lv {0}! Nhận 2 điểm kỹ năng'],
  lantern:['點亮第 {0} 盞燈籠','Thắp sáng lồng đèn thứ {0}'], keepGoing:['繼續營業','Tiếp tục bán'],
  staminaOut:['體力用完了，今晚提早收攤。','Hết thể lực, tối nay đóng quán sớm.'], allServed:['最後一位客人吃飽了。','Vị khách cuối cùng đã no nê.'], closedEarly:['今晚提早收攤。','Tối nay đóng quán sớm.'],
  sumT:['第 {0} 天・收攤結算','Ngày {0}・Tổng kết'], sPerfect:['完美上菜','Hoàn hảo'], sNormal:['普通','Tạm được'], sFail:['失望離開','Bỏ đi'], sIncome:['收入','Thu nhập'], sRep:['口碑變化','Uy tín'], sFrag:['回憶碎片','Mảnh ký ức'], sSpoil:['壞掉的食材','Nguyên liệu hỏng'], sBest:['最高品質','Phẩm chất cao nhất'],
  litTonight:['今晚點亮了：{0}','Tối nay thắp sáng: {0}'], newZone:['新街區開放：{0}','Mở khu mới: {0}'], lvNote:['等級提升！記得分配能力點。','Lên cấp! Nhớ cộng điểm kỹ năng.'], autoSaved:['已自動存檔。','Đã tự lưu.'],
  goHome:['回家休息，迎接明天','Về nghỉ, đón ngày mai'], endingBtn:['夜市好像有點不一樣……','Chợ đêm hình như khác lạ...'],
  billT:['週日帳單','Hóa đơn Chủ nhật'], rent:['店租','Tiền thuê'], power:['電費','Tiền điện'], hospital:['月嬤的醫藥費','Viện phí của bà'], total:['合計','Tổng'], pay:['繳費','Thanh toán'], afterPay:['繳完剩下 ${0}','Trả xong còn ${0}'],
  overT:['夜市熄燈了……','Chợ đêm tắt đèn...'], overMsg:['錢不夠繳帳單，「月嬤的灶腳」只好收起來了。','Không đủ tiền trả hóa đơn, quán của bà Nguyệt đành dẹp.'], overStats:['撐了 {0} 天・招待 {1} 位客人・點亮 {2} 盞燈籠','Trụ được {0} ngày・phục vụ {1} khách・thắp {2} lồng đèn'], tryAgain:['再來一次','Chơi lại'],
  shopBuy:['買下（${0}）','Mua (${0})'], notEnough:['錢不夠','Không đủ tiền'], fill:['補到每道菜 2 份','Mua đủ mỗi món 2 phần'], have:['庫存 {0}','Có {0}'], pack:['一包 {0} 份','1 gói {0} phần'], fresh:['生鮮・{0} 天內要用完','Đồ tươi・dùng trong {0} ngày'], dry:['乾貨・不會壞','Đồ khô・không hỏng'], bought:['採購完成','Đã mua xong'], needNothing:['庫存已經夠了','Kho đã đủ'],
  wsTools:['器具','Đồ nghề'], wsShop:['店面','Mặt tiền'], wsGear:['設備','Thiết bị'], upgrade:['升級 ${0}','Nâng cấp ${0}'], maxed:['已滿級','Tối đa'], owned:['已擁有','Đã có'], buyFor:['購買 ${0}','Mua ${0}'],
  toolEff:['綠區 +{0}%・指針慢 {1}%・加熱 {2} 秒・品質 +{3}','Vùng xanh +{0}%・kim chậm {1}%・làm nóng {2}s・phẩm chất +{3}'],
  shopLv:['店面 Lv {0}・{1} 個座位・每週店租 ${2}','Quán Lv {0}・{1} chỗ ngồi・thuê ${2}/tuần'],
  usedBy:['用於：{0}','Dùng cho: {0}'],
  hospT:['高雄醫院','Bệnh viện Cao Hùng'], visit:['探望月嬤（體力全滿）','Thăm bà Nguyệt (hồi đầy thể lực)'], visited:['今天已經探望過了','Hôm nay đã thăm rồi'],
  statT:['攤主能力','Kỹ năng chủ quán'], statPts:['等級 {0}・能力點 {1}（每升一級 2 點）','Cấp {0}・điểm {1} (mỗi cấp +2)'],
  statInfo:['耐心 {0} 秒・備料 {1} 秒・基礎綠區 {2}%','Kiên nhẫn {0}s・chuẩn bị {1}s・vùng xanh gốc {2}%'],
  albumT:['回憶圖鑑 {0}/15','Bộ sưu tập {0}/15'], albumHint:['招待故事客人時拿到 80 分以上得到回憶碎片，集滿 3 片解鎖料理卡。','Phục vụ khách có câu chuyện đạt từ 80 điểm sẽ được mảnh ký ức, đủ 3 mảnh mở thẻ món.'],
  unlocked:['已解鎖','Đã mở'], fragN:['碎片 {0}/3','Mảnh {0}/3'], cardNo:['料理卡 No.{0}・{1}','Thẻ món No.{0}・{1}'], guest:['客人：{0}','Khách: {0}'], recipe:['食材順序：{0}','Thứ tự: {0}'], method:['做法：{0}','Cách nấu: {0}'], fact:['小知識：{0}','Biết thêm: {0}'],
  saveT:['存檔備份','Sao lưu'], saveHint:['每晚收攤自動存在這個瀏覽器。換裝置時複製存檔碼，到新裝置貼上讀取。','Mỗi tối đóng quán sẽ tự lưu vào trình duyệt. Muốn đổi máy thì chép mã save rồi dán ở máy mới.'],
  saveCode:['目前的存檔碼','Mã save hiện tại'], copy:['複製存檔碼','Chép mã save'], pasteHere:['貼上存檔碼，或選擇 .json 備份檔','Dán mã save hoặc chọn file .json'], load:['讀取存檔','Đọc save'],
  copied:['已複製存檔碼。','Đã chép mã save.'], selected:['已幫你選取存檔碼，請按「複製」。','Đã chọn sẵn mã save, hãy bấm sao chép.'], badSave:['讀不到存檔：內容不完整或不是味憶夜市的存檔碼。','Không đọc được: mã save không đúng hoặc thiếu.'], loaded:['存檔讀取完成','Đã đọc save'],
  rotate:['請把手機轉成橫向','Hãy xoay ngang điện thoại'], rotateSub:['這個遊戲用橫向畫面遊玩','Game này chơi màn hình ngang'], anyway:['仍要直式遊玩','Vẫn chơi màn dọc'],
  vipBoss:['「我是來談生意的。給我最好的{0}，品質至少 SR。」','"Tôi đến bàn chuyện làm ăn. Cho tôi phần {0} ngon nhất, phẩm chất ít nhất SR."'],
  vipCritic:['「聽說這攤很有名？來一份{0}，我會寫進專欄。」','"Nghe nói quán này nổi tiếng? Cho một phần {0}, tôi sẽ viết lên chuyên mục."'],
  bossOk:['大老闆很滿意，留下一大筆小費！','Ông chủ lớn rất hài lòng, để lại tiền tip to!'], bossBad:['大老闆搖搖頭：「品質不夠。」口碑下降','Ông chủ lắc đầu: "Chưa đủ chất lượng." Uy tín giảm'],
  criticGood:['評論家寫了一篇大力推薦！口碑大漲','Nhà phê bình viết bài khen hết lời! Uy tín tăng mạnh'], criticMeh:['評論家的評價普普通通。','Nhà phê bình chấm điểm bình thường.'], criticBad:['評論家寫了負評……口碑下跌','Nhà phê bình chê thẳng... uy tín giảm'],
  tip:['小費','Tip'], rankNeed:['需要 {0} 以上','Cần từ {0} trở lên'],
  fullscreen:['全螢幕','Toàn màn hình'], sound:['音效','Âm thanh'],
  intro0:['（按任意處繼續）','(chạm để tiếp)'], firstTip:['先到「地圖」採買食材，再按「開店營業」','Hãy lên "Bản đồ" mua nguyên liệu rồi bấm "Mở quán"'],
  thanks:['感謝遊玩','Cảm ơn đã chơi'], creditsLine:['你招待了 {0} 位客人，花了 {1} 天，點亮了 15 盞燈籠。','Bạn đã phục vụ {0} khách trong {1} ngày và thắp sáng 15 lồng đèn.'], keepPlaying:['夜市會繼續營業，月嬤出院後不用再付醫藥費了。','Chợ đêm vẫn mở tiếp, bà đã xuất viện nên không còn viện phí nữa.'], backToStall:['回到夜市','Về chợ đêm'],
};
const t = (k, ...a) => { let s = L(STR[k] ?? k); if (typeof s === 'string') a.forEach((v, i) => s = s.split('{' + i + '}').join(v)); return s; };

/* ---------- world data ---------- */
const ZONES = [
  { name:['古早味街','Phố Vị Xưa'], cuisine:['台灣小吃','món Đài Loan'] },
  { name:['南洋巷','Hẻm Nam Dương'], cuisine:['越南料理','món Việt Nam'] },
  { name:['千島角','Góc Vạn Đảo'], cuisine:['印尼・菲律賓料理','món Indonesia・Philippines'] },
  { name:['湄南河攤','Sạp Sông Chao Phraya'], cuisine:['泰國料理','món Thái'] },
  { name:['燈塔碼頭','Bến Hải Đăng'], cuisine:['月嬤的原創融合料理','món sáng tạo của bà Nguyệt'] }
];
// Cooking methods: each has its own art and its own minigame (game):
// mash = tap fast to fill, sweep = one timed press before it burns, hold = hold to keep the needle in the zone,
// arrows = Audition-style arrow sequence, multi = 3 timed catches, rhythm = tap notes on the beat
const METHODS = {
  wok:     { name:['炒鍋','Chảo xào'],  verb:['大火快炒','Xào lửa lớn'], stop:['翻炒！','Đảo!'], game:'mash', icon:'🔥' },
  pan:     { name:['平底鍋','Chảo rán'], verb:['煎到金黃','Rán vàng'], stop:['翻面起鍋！','Lật & nhấc!'], game:'sweep', icon:'🍳' },
  pot:     { name:['湯鍋','Nồi nấu'],   verb:['慢火熬煮','Ninh lửa nhỏ'], stop:['按住加火','Giữ để tăng lửa'], game:'hold', icon:'🍲' },
  grill:   { name:['烤架','Vỉ nướng'],  verb:['炭火燒烤','Nướng than'], stop:['取下！','Gắp ra!'], game:'arrows', icon:'♨️' },
  fryer:   { name:['油鍋','Nồi chiên'], verb:['熱油酥炸','Chiên ngập dầu'], stop:['撈起！','Vớt lên!'], game:'multi', icon:'🫕' },
  steamer: { name:['蒸籠','Xửng hấp'],  verb:['大火蒸熟','Hấp cách thủy'], stop:['拍！','Nhịp!'], game:'rhythm', icon:'♨' }
};
const TOOL_TIERS = [ // RPG tiers: name, metal color, light color
  { name:['破舊','Cũ nát'],  c:'#6E6259', l:'#8C7F73' },
  { name:['鐵製','Sắt'],     c:'#7D8794', l:'#B4BEC9' },
  { name:['精銅','Đồng tinh'], c:'#B8692E', l:'#F0A35E' },
  { name:['秘銀','Bạc huyền'], c:'#5FA9C9', l:'#BDF0FF' },
  { name:['傳說','Truyền thuyết'], c:'#D9A520', l:'#FFE98A' }
];
const TOOL_COST = [0, 300, 800, 1800, 3600]; // cost to reach level index+1
// shop: harbor / market / grocery. f=1 fresh (spoils), n = units per pack, p = pack price
const ING = {
  '豬絞肉':{e:'🥩',vi:'Thịt heo xay',s:'market',p:12,n:1,f:1}, '紅蔥頭':{e:'🧅',vi:'Hành tím',s:'market',p:5,n:1,f:1},
  '醬油':{e:'🫙',vi:'Nước tương',s:'grocery',p:20,n:5,f:0}, '白飯':{e:'🍚',vi:'Cơm trắng',s:'grocery',p:25,n:5,f:0},
  '魚骨高湯':{e:'🍲',vi:'Nước dùng xương cá',s:'harbor',p:10,n:1,f:1}, '虱目魚肚':{e:'🐟',vi:'Bụng cá măng',s:'harbor',p:18,n:1,f:1},
  '薑絲':{e:'🫚',vi:'Gừng sợi',s:'market',p:4,n:1,f:1}, '蚵仔':{e:'🦪',vi:'Hàu',s:'harbor',p:16,n:1,f:1},
  '地瓜粉漿':{e:'🥣',vi:'Bột khoai lang',s:'grocery',p:20,n:5,f:0}, '雞蛋':{e:'🥚',vi:'Trứng gà',s:'market',p:5,n:1,f:1},
  '甜辣醬':{e:'🥫',vi:'Tương ngọt cay',s:'grocery',p:20,n:5,f:0}, '河粉':{e:'🍜',vi:'Bánh phở',s:'grocery',p:30,n:5,f:0},
  '生牛肉片':{e:'🐄',vi:'Bò tái thái lát',s:'market',p:22,n:1,f:1}, '牛骨高湯':{e:'🦴',vi:'Nước dùng xương bò',s:'market',p:14,n:1,f:1},
  '九層塔':{e:'🌿',vi:'Húng quế',s:'market',p:4,n:1,f:1}, '法國麵包':{e:'🥖',vi:'Bánh mì',s:'market',p:8,n:1,f:1},
  '肝醬':{e:'🫕',vi:'Pa-tê',s:'grocery',p:35,n:5,f:0}, '越式火腿':{e:'🍖',vi:'Chả lụa',s:'market',p:14,n:1,f:1},
  '醃紅白蘿蔔':{e:'🥕',vi:'Đồ chua',s:'market',p:5,n:1,f:1}, '冬粉木耳':{e:'🍄',vi:'Miến & mộc nhĩ',s:'grocery',p:25,n:5,f:0},
  '米紙':{e:'⚪',vi:'Bánh tráng',s:'grocery',p:20,n:5,f:0}, '熱油':{e:'🛢️',vi:'Dầu ăn',s:'grocery',p:30,n:5,f:0},
  '雞肉':{e:'🍗',vi:'Thịt gà',s:'market',p:15,n:1,f:1}, '薑黃醃料':{e:'🟡',vi:'Sốt ướp nghệ',s:'grocery',p:25,n:5,f:0},
  '竹籤':{e:'🥢',vi:'Que tre',s:'grocery',p:10,n:5,f:0}, '花生醬':{e:'🥜',vi:'Sốt đậu phộng',s:'grocery',p:30,n:5,f:0},
  '香料泥':{e:'🌶️',vi:'Gia vị xay',s:'market',p:8,n:1,f:1}, '牛肉塊':{e:'🍖',vi:'Thịt bò khối',s:'market',p:24,n:1,f:1},
  '椰奶':{e:'🥥',vi:'Nước cốt dừa',s:'grocery',p:35,n:5,f:0}, '烤椰絲':{e:'🍂',vi:'Dừa sợi rang',s:'grocery',p:20,n:5,f:0},
  '蒜頭':{e:'🧄',vi:'Tỏi',s:'market',p:4,n:1,f:1}, '醋':{e:'🍶',vi:'Giấm',s:'grocery',p:15,n:5,f:0},
  '魚露':{e:'🫗',vi:'Nước mắm',s:'harbor',p:25,n:5,f:0}, '打拋葉':{e:'☘️',vi:'Lá húng Thái',s:'market',p:5,n:1,f:1},
  '綠咖哩醬':{e:'🟢',vi:'Sốt cà ri xanh',s:'grocery',p:35,n:5,f:0}, '泰國小茄子':{e:'🍆',vi:'Cà pháo Thái',s:'market',p:6,n:1,f:1},
  '糯米':{e:'🍙',vi:'Gạo nếp',s:'grocery',p:25,n:5,f:0}, '芒果':{e:'🥭',vi:'Xoài',s:'market',p:14,n:1,f:1},
  '脆綠豆':{e:'🫘',vi:'Đậu xanh giòn',s:'grocery',p:15,n:5,f:0}, '溫體牛肉':{e:'🐂',vi:'Bò tươi',s:'market',p:28,n:1,f:1},
  '香茅':{e:'🌾',vi:'Sả',s:'market',p:4,n:1,f:1},
  '鹽':{e:'🧂',vi:'Muối',s:'grocery',p:20,n:10,f:0,seas:1}, '糖':{e:'🍬',vi:'Đường',s:'grocery',p:20,n:10,f:0,seas:1}
};
const ingName = k => LANG ? ING[k].vi : k;
const SHOPS = {
  harbor:  { name:['漁港','Cảng cá'], desc:['新鮮的魚貨、蚵仔和魚露。','Cá tươi, hàu và nước mắm.'] },
  market:  { name:['菜市場','Chợ'], desc:['肉、菜、香草和水果。','Thịt, rau, rau thơm và trái cây.'] },
  grocery: { name:['雜貨店','Tạp hóa'], desc:['鹽、糖、醬料、米和乾貨。','Muối, đường, nước sốt, gạo và đồ khô.'] },
  workshop:{ name:['阿鐵的工坊','Xưởng của chú Thiết'], desc:['升級鍋具、擴建店面。','Nâng cấp nồi chảo, mở rộng quán.'] },
  hospital:{ name:['醫院','Bệnh viện'], desc:['月嬤住院的地方。','Nơi bà Nguyệt đang nằm viện.'] },
  stall:   { name:['月嬤的灶腳','Quán của bà Nguyệt'], desc:['你的小吃攤。','Quán ăn của bạn.'] }
};
const SHOP_LV = [ // restaurant levels: seats, rent / week, upgrade cost to reach it
  { name:['破舊鐵皮攤','Sạp tôn xập xệ'], seats:2, rent:400, cost:0 },
  { name:['木造小吃攤','Quán gỗ nhỏ'], seats:4, rent:700, cost:1500 },
  { name:['紅燈籠食堂','Quán Đèn Lồng Đỏ'], seats:6, rent:1100, cost:3500 },
  { name:['港都名店','Quán danh tiếng Cảng Đô'], seats:8, rent:1600, cost:7000 }
];
const GEAR = {
  fridge: { name:['保鮮冰箱','Tủ lạnh'], max:2, cost:[400, 900], desc:['生鮮多放 1 天','Đồ tươi để thêm 1 ngày'] },
  sign:   { name:['霓虹招牌','Biển neon'], max:1, cost:[600], desc:['每晚多 2 位客人','Mỗi tối thêm 2 khách'] },
  fan:    { name:['電風扇','Quạt máy'], max:1, cost:[350], desc:['客人更有耐心 +6 秒','Khách kiên nhẫn hơn +6s'] }
};
const STATS = {
  knife:  { name:['刀工','Dao pháp'], desc:['備料時間變長。','Thêm thời gian chuẩn bị.'] },
  heat:   { name:['火候','Hỏa hầu'], desc:['所有器具的綠區變寬。','Vùng xanh của mọi dụng cụ rộng hơn.'] },
  memory: { name:['味覺記憶','Trí nhớ vị giác'], desc:['猜菜、備料時出現更多提示。','Thêm gợi ý khi đoán món và chuẩn bị.'] },
  charm:  { name:['人情','Tình người'], desc:['客人更有耐心，小費更多。','Khách kiên nhẫn hơn, tip nhiều hơn.'] }
};
// Rank of a finished dish (quality = score + tool bonus)
const RANKS = [
  { id:'UR',  min:115, mult:2.6, c:'#FF6FD8' },
  { id:'SSR', min:100, mult:1.9, c:'#F2C94C' },
  { id:'SR',  min:85,  mult:1.4, c:'#B583FF' },
  { id:'R',   min:0,   mult:1.0, c:'#7FB7FF' }
];

/* Looks: skin, hair color, hair style, top, bottom, hat, acc[], kid */
const SK = ['#F1C9A5','#D9A57C','#B8865B','#E8B98F'];
const DISHES = [
  { name:['肉燥飯','Cơm thịt băm kho'], emoji:'🍚', zone:0, m:'pot', sweet:1, steps:['豬絞肉','紅蔥頭','醬油','白飯'],
    who:['阿土伯','Bác Thổ'], look:{skin:SK[1],hair:'#B9B6C2',hs:'bald',top:'#6B8E5A',bot:'#5A4636',acc:['mustache']},
    memory:['放學回家，巷口那碗淋得油亮亮的飯，旁邊總有一片黃色醃蘿蔔。','Tan học về, bát cơm bóng mỡ đầu hẻm, bên cạnh lúc nào cũng có lát củ cải muối vàng.'],
    story:['阿土伯想起來了：那是媽媽在巷口擺的攤。每天放學，他都蹲在攤子旁邊，等那一碗熱騰騰的飯。','Bác Thổ nhớ ra rồi: đó là sạp mẹ bác bày đầu hẻm. Ngày nào tan học bác cũng ngồi xổm cạnh sạp, đợi bát cơm nóng hổi.'],
    fact:['肉燥用豬肉、醬油和紅蔥頭慢火滷製，是台灣最常見的小吃之一。','Thịt băm kho bằng thịt heo, nước tương và hành tím trên lửa nhỏ, là món ăn vặt phổ biến nhất Đài Loan.'] },
  { name:['虱目魚粥','Cháo cá măng sữa'], emoji:'🥣', zone:0, m:'pot', steps:['魚骨高湯','白飯','虱目魚肚','薑絲'],
    who:['秀琴姨','Dì Tú Cầm'], look:{skin:SK[0],hair:'#3A2A1E',hs:'bun',top:'#C98BB9',bot:'#4A4560',acc:['glasses']},
    memory:['台南的清晨，攤子還冒著白煙，阿公說魚肚要趁熱吃。','Sáng sớm ở Đài Nam, sạp còn bốc khói trắng, ông nội bảo bụng cá phải ăn lúc nóng.'],
    story:['秀琴姨想起，阿公每天清晨牽著她去吃魚粥，總說最嫩的魚肚要留給孫女。','Dì Tú Cầm nhớ lại, sáng nào ông cũng dắt dì đi ăn cháo cá, bảo phần bụng cá mềm nhất phải để cho cháu gái.'],
    fact:['虱目魚是台南代表性的養殖魚，魚肚粥是當地常見的早餐。','Cá măng sữa là loài cá nuôi tiêu biểu của Đài Nam, cháo bụng cá là bữa sáng quen thuộc ở đó.'] },
  { name:['蚵仔煎','Trứng chiên hàu'], emoji:'🍳', zone:0, m:'pan', sweet:1, steps:['蚵仔','地瓜粉漿','雞蛋','甜辣醬'],
    who:['小凱','Bé Khải'], look:{skin:SK[3],hair:'#1C1C28',hs:'spiky',top:'#E2574C',bot:'#3B5BA5',acc:['backpack'],kid:1},
    memory:['第一次逛夜市，鐵板上滋滋作響，粉漿邊緣煎得脆脆的。','Lần đầu đi chợ đêm, chảo gang kêu xèo xèo, mép bột chiên giòn rụm.'],
    story:['小凱想起，那天爸爸把最大顆的蚵仔都夾給他，自己只吃粉漿。','Bé Khải nhớ ra, hôm đó bố gắp hết những con hàu to nhất cho em, còn bố chỉ ăn phần bột.'],
    fact:['粉漿多用地瓜粉調成，煎好後淋上甜甜辣辣的紅色醬汁。','Bột thường pha từ bột khoai lang, chiên xong rưới nước sốt đỏ ngọt ngọt cay cay.'] },
  { name:['牛肉河粉 Phở','Phở bò'], emoji:'🍜', zone:1, m:'pot', steps:['河粉','生牛肉片','牛骨高湯','九層塔'],
    who:['阿明伯','Bác Minh'], look:{skin:SK[2],hair:'#C8C5CF',hs:'short',top:'#7C8BD6',bot:'#3E3A36',hat:'cap',acc:['beard']},
    memory:['下雨的西貢清晨，媽媽在巷口煮的那鍋湯。','Sáng mưa ở Sài Gòn, nồi nước dùng mẹ nấu đầu hẻm.'],
    story:['阿明伯想起，媽媽總在湯裡多放一把香草，說這樣下雨天就不會感冒。','Bác Minh nhớ, mẹ luôn thả thêm một nắm rau thơm vào nồi, bảo vậy trời mưa sẽ không bị cảm.'],
    fact:['湯頭用牛骨長時間熬煮，加入八角、肉桂等香料；滾燙的湯會把生牛肉片燙熟。','Nước dùng ninh xương bò thật lâu với hoa hồi, quế; nước sôi chan vào làm chín lát bò tái.'] },
  { name:['越南法國麵包','Bánh mì Việt Nam'], emoji:'🥖', zone:1, m:'grill', steps:['法國麵包','肝醬','越式火腿','醃紅白蘿蔔'],
    who:['小芳','Phương'], look:{skin:SK[0],hair:'#141018',hs:'long',top:'#F2F2F2',bot:'#2B2F4A',hat:'helmet',acc:[]},
    memory:['騎機車趕去上學前，在路邊買一份，脆皮屑掉滿身。','Phóng xe máy đi học, ghé lề đường mua một ổ, vụn vỏ giòn rơi đầy người.'],
    story:['小芳想起，賣麵包的阿姨總會偷偷多塞一片火腿給她，說讀書要吃飽。','Phương nhớ ra, cô bán bánh mì lúc nào cũng lén nhét thêm miếng chả, bảo đi học phải ăn cho no.'],
    fact:['源自法國殖民時期的長棍麵包，越南人加入肝醬、火腿和醃紅白蘿蔔絲。','Ổ bánh mì có từ thời Pháp thuộc, người Việt thêm pa-tê, chả lụa và đồ chua.'] },
  { name:['越南炸春捲','Chả giò'], emoji:'🥟', zone:1, m:'fryer', steps:['豬絞肉','冬粉木耳','米紙','熱油'],
    who:['阿蓮姨','Dì Liên'], look:{skin:SK[1],hair:'#2B2420',hs:'bun',top:'#E8C547',bot:'#6A3A3A',acc:['scarf']},
    memory:['過年全家圍在一起捲春捲，外婆總說捲太鬆會炸開。','Tết cả nhà ngồi quây quần cuốn chả giò, bà ngoại luôn nói cuốn lỏng là chiên bị bung.'],
    story:['阿蓮姨想起，外婆捲的春捲總是最緊，炸好的第一條一定先拿去拜祖先。','Dì Liên nhớ, cuốn chả giò của bà lúc nào cũng chặt nhất, cuốn chiên đầu tiên luôn được dâng lên cúng ông bà.'],
    fact:['越南炸春捲用米紙包豬肉、冬粉、木耳等內餡，炸到金黃，沾魚露調的醬汁吃。','Chả giò cuốn bánh tráng với nhân thịt heo, miến, mộc nhĩ, chiên vàng, chấm nước mắm pha.'] },
  { name:['沙嗲串燒','Sate xiên nướng'], emoji:'🍢', zone:2, m:'grill', steps:['雞肉','薑黃醃料','竹籤','花生醬'],
    who:['布迪','Budi'], look:{skin:SK[2],hair:'#1C1C28',hs:'short',top:'#A4501A',bot:'#2E2A26',hat:'peci',acc:[]},
    memory:['爪哇的夜市，炭火的煙裡全是花生醬的香味。','Chợ đêm ở Java, khói than nồng mùi sốt đậu phộng.'],
    story:['布迪想起，爸爸在家鄉擺沙嗲攤，他從小就在旁邊幫忙搧炭火。','Budi nhớ, bố anh bày sạp sate ở quê, anh phụ quạt than từ hồi còn bé.'],
    fact:['沙嗲是印尼常見的炭烤肉串，通常搭配花生醬汁一起吃。','Sate là món thịt xiên nướng than phổ biến ở Indonesia, thường ăn kèm sốt đậu phộng.'] },
  { name:['巴東牛肉','Bò Rendang'], emoji:'🍛', zone:2, m:'pot', sweet:1, steps:['香料泥','牛肉塊','椰奶','烤椰絲'],
    who:['西蒂','Siti'], look:{skin:SK[1],hair:'#2B2420',hs:'short',top:'#B04A6A',bot:'#3A2E4A',hat:'hijab',acc:[]},
    memory:['開齋節那天，媽媽從早燉到晚，整間屋子都是椰奶香。','Ngày lễ Eid, mẹ hầm từ sáng đến tối, cả nhà thơm mùi nước cốt dừa.'],
    story:['西蒂想起，開齋節全家人都會回到媽媽家，那鍋牛肉要燉一整天才上桌。','Siti nhớ, cứ lễ Eid cả nhà lại về bên mẹ, nồi bò phải hầm cả ngày mới dọn lên.'],
    fact:['源自印尼蘇門答臘的米南佳保族，牛肉用椰奶和香料慢燉好幾個小時。','Món của người Minangkabau ở Sumatra, Indonesia: bò hầm nhiều giờ với nước cốt dừa và gia vị.'] },
  { name:['菲式阿多波','Gà Adobo Philippines'], emoji:'🍲', zone:2, m:'wok', steps:['蒜頭','雞肉','醬油','醋'],
    who:['喬伊','Joy'], look:{skin:SK[3],hair:'#5B3A29',hs:'pony',top:'#4FC1B0',bot:'#3E4A6A',acc:['glasses']},
    memory:['馬尼拉的雨季，奶奶說加了醋的菜放到明天會更好吃。','Mùa mưa ở Manila, bà nội bảo món có giấm để qua hôm sau càng ngon.'],
    story:['喬伊想起，奶奶的阿多波總是隔天最入味，她每次都偷偷留一碗當早餐。','Joy nhớ, adobo của bà luôn đậm vị nhất vào hôm sau, lần nào cô cũng lén để dành một bát ăn sáng.'],
    fact:['用醋、醬油、蒜頭和月桂葉燉煮，常被稱為菲律賓的國民料理之一。','Nấu với giấm, nước tương, tỏi và lá nguyệt quế, thường được xem là món quốc dân của Philippines.'] },
  { name:['打拋豬','Heo xào Pad Kra Pao'], emoji:'🌶️', zone:3, m:'wok', steps:['蒜頭','豬絞肉','魚露','打拋葉'],
    who:['娜娜','Nana'], look:{skin:SK[0],hair:'#1C1C28',hs:'bob',top:'#F2F2F2',bot:'#24305E',acc:['bow']},
    memory:['曼谷巷子裡的大火快炒，老闆說一定要配一顆煎蛋。','Món xào lửa lớn trong hẻm Bangkok, ông chủ bảo nhất định phải kèm trứng ốp la.'],
    story:['娜娜想起，那是她第一次一個人出門吃飯，老闆笑著多送了她一顆蛋。','Nana nhớ, đó là lần đầu cô tự đi ăn một mình, ông chủ cười rồi tặng thêm một quả trứng.'],
    fact:['「打拋」是泰文聖羅勒（kaphrao）的音譯，台灣常用九層塔代替。','"Kra pao" là tên tiếng Thái của húng thánh, ở Đài Loan hay dùng húng quế thay.'] },
  { name:['綠咖哩','Cà ri xanh'], emoji:'🥘', zone:3, m:'wok', steps:['綠咖哩醬','椰奶','雞肉','泰國小茄子'],
    who:['頌猜','Somchai'], look:{skin:SK[2],hair:'#1C1C28',hs:'short',top:'#D98E48',bot:'#3A3A3A',acc:['mustache']},
    memory:['清邁的廚房裡，媽媽一邊搗香料，一邊教我分辨辣椒。','Trong bếp ở Chiang Mai, mẹ vừa giã gia vị vừa dạy tôi phân biệt các loại ớt.'],
    story:['頌猜想起，媽媽說綠辣椒比紅辣椒更嗆，要他搗完香料千萬別揉眼睛。','Somchai nhớ, mẹ bảo ớt xanh còn cay hơn ớt đỏ, giã xong nhớ đừng dụi mắt.'],
    fact:['綠咖哩的綠色來自青辣椒和香草，是泰國很有代表性的咖哩。','Màu xanh của cà ri đến từ ớt xanh và rau thơm, là loại cà ri tiêu biểu của Thái.'] },
  { name:['芒果糯米','Xôi xoài'], emoji:'🥭', zone:3, m:'steamer', sweet:1, steps:['糯米','椰奶','芒果','脆綠豆'],
    who:['帕恩','Pan'], look:{skin:SK[3],hair:'#2B2420',hs:'long',top:'#8FC8F0',bot:'#5A6A8A',acc:['flower']},
    memory:['潑水節的午後全身濕透，奶奶遞來一盤冰涼的甜點。','Chiều lễ té nước ướt sũng, bà đưa cho một đĩa món ngọt mát lạnh.'],
    story:['帕恩想起，奶奶家院子裡有一棵芒果樹，每年四月都結滿果實。','Pan nhớ, sân nhà bà có một cây xoài, tháng tư năm nào cũng trĩu quả.'],
    fact:['糯米蒸熟後拌入甜椰奶，配上熟芒果，是泰國夏天最受歡迎的甜點之一。','Nếp hấp chín trộn nước cốt dừa ngọt, ăn với xoài chín, là món tráng miệng mùa hè được ưa nhất ở Thái.'] },
  { name:['月嬤牛肉河粉','Phở bò bà Nguyệt'], emoji:'🍜', zone:4, m:'pot', steps:['牛骨高湯','河粉','溫體牛肉','薑絲'],
    who:['穿舊夾克的老船員','Ông thủy thủ áo khoác cũ'], look:{skin:SK[1],hair:'#E6E3EA',hs:'short',top:'#5A4A3A',bot:'#2A2F3A',hat:'captain',acc:['beard']},
    memory:['西貢港的夜裡，有個女孩請我喝了一碗河粉。後來，我把她帶回了高雄。','Một đêm ở cảng Sài Gòn, có cô gái mời tôi một bát phở. Về sau, tôi đưa cô ấy về Cao Hùng.'],
    story:['老船員笑了：「那個女孩，就是你的外婆。」原來他是小燈從沒見過的外公。','Ông thủy thủ mỉm cười: "Cô gái ấy chính là bà ngoại cháu." Hóa ra ông là người ông ngoại Tiểu Đăng chưa từng gặp.'],
    fact:['月嬤的原創料理：台南牛肉湯的溫體牛肉，配上越南河粉的香料湯頭。','Món sáng tạo của bà Nguyệt: bò tươi kiểu canh bò Đài Nam, chan nước dùng phở đậm gia vị.'] },
  { name:['蚵仔煎春捲','Cuốn trứng hàu'], emoji:'🌯', zone:4, m:'fryer', steps:['蚵仔','雞蛋','米紙','甜辣醬'],
    who:['戴斗笠的女孩','Cô gái đội nón lá'], look:{skin:SK[0],hair:'#141018',hs:'long',top:'#EDE6D3',bot:'#2A2A2A',hat:'conical',acc:[]},
    memory:['剛到高雄的第一個夏天，我很想家，就把夜市的蚵仔煎包進春捲皮。','Mùa hè đầu tiên đến Cao Hùng, tôi nhớ nhà quá, bèn gói trứng chiên hàu của chợ đêm vào bánh tráng.'],
    story:['女孩的臉，和老照片裡年輕的月嬤一模一樣。她輕聲說：「謝謝你，還記得我的味道。」','Gương mặt cô gái giống hệt bà Nguyệt thời trẻ trong tấm ảnh cũ. Cô khẽ nói: "Cảm ơn cháu vẫn còn nhớ hương vị của bà."'],
    fact:['月嬤的原創料理：把蚵仔煎的蚵仔和蛋包進米紙，沾甜辣醬吃。','Món sáng tạo của bà Nguyệt: hàu và trứng gói trong bánh tráng, chấm tương ngọt cay.'] },
  { name:['香茅肉燥飯','Cơm thịt băm sả'], emoji:'🍚', zone:4, m:'wok', sweet:1, steps:['香茅','豬絞肉','魚露','白飯'],
    who:['放學的小女孩','Cô bé tan học'], look:{skin:SK[3],hair:'#2B2420',hs:'twin',top:'#F2F2F2',bot:'#C0504A',acc:['backpack'],kid:1},
    memory:['放學回家，媽媽的飯裡總有一股香茅味，同學都說好香。','Tan học về, cơm của mẹ lúc nào cũng thơm mùi sả, bạn bè ai cũng khen thơm.'],
    story:['小女孩跑開前回頭喊了一聲「媽媽」。那是小時候的媽媽，月嬤的女兒。','Trước khi chạy đi, cô bé ngoảnh lại gọi "Mẹ ơi". Đó là mẹ của Tiểu Đăng hồi nhỏ, con gái bà Nguyệt.'],
    fact:['月嬤的原創料理：在肉燥裡加入香茅和魚露，是台越家庭的家常味。','Món sáng tạo của bà Nguyệt: thịt băm kho thêm sả và nước mắm, vị cơm nhà của gia đình Đài–Việt.'] }
];
const SPECIAL = {
  grandma: { name:['月嬤','Bà Nguyệt'], look:{skin:SK[1],hair:'#D8D5DE',hs:'bun',top:'#C0504A',bot:'#3A2E3A',acc:['glasses']} },
  hero:    { name:['小燈','Tiểu Đăng'], look:{skin:SK[0],hair:'#241C18',hs:'short',top:'#2E6F8E',bot:'#2A2A3A',hat:'band',acc:['apron']} },
  boss:    { name:['大老闆','Ông chủ lớn'], look:{skin:SK[3],hair:'#101014',hs:'slick',top:'#23232F',bot:'#1A1A22',acc:['sunglasses','tie','mustache','chain']} },
  critic:  { name:['美食評論家','Nhà phê bình ẩm thực'], look:{skin:SK[0],hair:'#6A4A3A',hs:'bob',top:'#6A3D7C',bot:'#2A2A3A',hat:'beret',acc:['glasses','scarf']} },
  gang:    { name:['討債的大哥','Đại ca đòi nợ'], look:{skin:SK[2],hair:'#101014',hs:'bald',top:'#E8C547',bot:'#1A1A22',acc:['sunglasses','chain','tattoo']} },
  gang2:   { name:['小弟','Đàn em'], look:{skin:SK[1],hair:'#C04030',hs:'spiky',top:'#1E1E26',bot:'#3A3A4A',acc:['tattoo']} },
  ghost:   { name:['白衣女子','Người đàn bà áo trắng'], look:{skin:'#DDEBFF',hair:'#0C0C14',hs:'ghost',top:'#EEF4FF',bot:'#EEF4FF',acc:[],ghost:1} }
};
const NORMAL_LINES = [
  ['「肚子好餓，有什麼好吃的？」','"Đói bụng quá, có gì ngon không?"'],
  ['「剛下班，想吃點熱的。」','"Vừa tan ca, muốn ăn gì đó nóng nóng."'],
  ['「朋友說這攤很好吃！」','"Bạn tôi bảo quán này ngon lắm!"']
];
const INTRO = [
  { who:'', text:['高雄港，舊碼頭。每到午夜，這裡會出現一座只營業到天亮的夜市。','Cảng Cao Hùng, bến tàu cũ. Cứ nửa đêm, nơi đây lại hiện ra một khu chợ chỉ mở đến sáng.'] },
  { who:'', text:['來這裡的客人，很多是離鄉太久、忘了家鄉味道的「失味旅人」。','Nhiều vị khách ghé đây là những "lữ khách mất vị", xa quê quá lâu đến quên cả hương vị quê nhà.'] },
  { who:'grandma', text:['小燈，外婆住院這陣子，「月嬤的灶腳」就交給你了。','Tiểu Đăng à, bà nằm viện ít hôm, quán "Bếp của bà Nguyệt" giao lại cho cháu nhé.'] },
  { who:'grandma', text:['白天去漁港、市場和雜貨店買菜，晚上開店。有的客人只說一段回憶，你要猜出是哪道菜。','Ban ngày ra cảng cá, chợ với tạp hóa mua đồ, tối thì mở quán. Có vị khách chỉ kể một đoạn ký ức, cháu phải đoán ra món gì.'] },
  { who:'grandma', text:['店租、電費每週日要繳……還有外婆的醫藥費。錢要是不夠，攤子就得收了。','Tiền thuê, tiền điện đóng vào mỗi Chủ nhật... cả viện phí của bà nữa. Không đủ tiền là phải dẹp quán đấy.'] },
  { who:'grandma', text:['做對了那一口，他們就會想起來。夜市的燈籠，也會一盞一盞亮回來。','Nấu đúng miếng ăn ấy, họ sẽ nhớ ra. Lồng đèn chợ đêm cũng sẽ sáng lại từng chiếc một.'] }
];
const ENDING = [
  { who:'', text:['十五盞燈籠全亮了。月光夜市，從來沒有這麼熱鬧過。','Mười lăm chiếc lồng đèn đều sáng. Chợ đêm ánh trăng chưa bao giờ đông vui đến thế.'] },
  { who:'', text:['人群裡，一個熟悉的身影慢慢走來。是出院的月嬤。','Giữa đám đông, một bóng dáng quen thuộc chậm rãi bước tới. Là bà Nguyệt đã xuất viện.'] },
  { who:'grandma', text:['三十年前，我在西貢港遇到一個從高雄來的船員。他說，高雄的港口晚上也看得到月亮。','Ba mươi năm trước, bà gặp một anh thủy thủ từ Cao Hùng ở cảng Sài Gòn. Anh ấy nói, đêm ở cảng Cao Hùng cũng ngắm được trăng.'] },
  { who:'grandma', text:['我跟著他來到這裡，把家鄉的河粉，煮成了台南牛肉湯的樣子。那就是我的招牌湯。','Bà theo anh ấy đến đây, nấu bát phở quê nhà theo kiểu canh bò Đài Nam. Đó là món tủ của bà.'] },
  { who:'grandma', text:['小燈，味道會被忘記。可是只要有人繼續煮，回憶就不會消失。','Tiểu Đăng à, hương vị có thể bị quên. Nhưng chỉ cần còn người nấu, ký ức sẽ không mất đi.'] }
];
/* Events: each choice returns an outcome key handled in game.js */
const EVENTS = {
  gang: { who:'gang', text:['「月嬤以前欠我們老大一筆錢，今天由你來還。拿 ${0} 出來！」','"Bà Nguyệt hồi trước nợ đại ca tụi tao một khoản, hôm nay mày trả. Đưa ${0} đây!"'],
    choices:[ ['pay',['乖乖付錢（${0}）','Ngoan ngoãn trả (${0})']], ['haggle',['討價還價（人情檢定）','Mặc cả (thử Tình người)']], ['feed',['請大哥吃一頓再談','Mời đại ca ăn một bữa rồi nói']], ['police',['偷偷報警','Lén báo cảnh sát']] ] },
  ghost: { who:'ghost', text:['午夜三點，一位渾身濕透的白衣女子坐了下來，桌上的燈開始閃爍……','Ba giờ sáng, một người đàn bà áo trắng ướt sũng ngồi xuống, ngọn đèn trên bàn bắt đầu chập chờn...'],
    choices:[ ['ghostfeed',['煮一碗給祂','Nấu cho người ấy một bát']], ['salt',['撒鹽驅邪（用 3 份鹽）','Rắc muối trừ tà (tốn 3 muối)']], ['ignore',['假裝沒看到','Giả vờ không thấy']] ] },
  blackout: { who:'', text:['「啪」一聲，整條街停電了。客人們在黑暗中議論紛紛。','"Tạch" một tiếng, cả con phố mất điện. Khách xì xào trong bóng tối.'],
    choices:[ ['candle',['點蠟燭繼續營業（$60）','Thắp nến bán tiếp ($60)']], ['closeup',['今晚就到這裡','Tối nay dừng ở đây']] ] }
};
const EV_OUT = {
  pay:['大哥收了錢，揮揮手走了。','Đại ca cầm tiền, phẩy tay bỏ đi.'],
  haggleOk:['你搬出月嬤的面子，大哥只收了一半。','Bạn đem thể diện bà Nguyệt ra, đại ca chỉ lấy một nửa.'],
  haggleBad:['大哥火大了，多收了一倍半！','Đại ca nổi điên, đòi gấp rưỡi!'],
  smash:['錢不夠……他們把食材踢翻了，生鮮全毀。','Không đủ tiền... chúng đá đổ nguyên liệu, đồ tươi hỏng hết.'],
  feedOk:['大哥吃完沉默很久：「這是我阿母的味道。」債一筆勾銷！','Đại ca ăn xong im lặng hồi lâu: "Đây là vị của mẹ tao." Xóa nợ luôn!'],
  feedBad:['大哥吐了出來：「這什麼東西！」硬是拿走了錢。','Đại ca nhổ ra: "Cái quái gì đây!" rồi vẫn lấy tiền.'],
  policeOk:['警笛聲響起，他們落荒而逃。街坊都說你很勇敢，口碑上升。','Còi cảnh sát vang lên, chúng chạy mất dép. Hàng xóm khen bạn gan dạ, uy tín tăng.'],
  policeBad:['警察還沒到，他們就砸了攤子，搶走一些錢。','Cảnh sát chưa tới chúng đã đập quán, cướp mất ít tiền.'],
  ghostOk:['祂喝完湯，露出微笑消失了。桌上留下一個紅包，大家都說這攤有福氣。','Người ấy húp hết bát, mỉm cười rồi biến mất. Trên bàn để lại một phong bao lì xì, ai cũng bảo quán có phúc.'],
  ghostBad:['湯不對味，祂尖叫一聲，客人全嚇跑了！','Không đúng vị, người ấy hét lên một tiếng, khách sợ chạy hết!'],
  salt:['你撒了一把鹽，白影嘆了口氣，慢慢消散。','Bạn rắc một nắm muối, bóng trắng thở dài rồi tan dần.'],
  ignoreOk:['你低頭切菜，再抬頭時，祂已經不見了。','Bạn cúi đầu thái rau, ngẩng lên thì người ấy đã biến mất.'],
  ignoreBad:['祂慢慢轉頭看向客人……大家尖叫著逃走了。','Người ấy từ từ quay sang nhìn khách... ai nấy la hét bỏ chạy.'],
  candle:['燭光下的夜市別有一番風味，客人反而更多了。','Chợ đêm dưới ánh nến lại có nét riêng, khách còn đông hơn.'],
  closeup:['你收起攤子，早點回家休息。','Bạn dọn quán, về nghỉ sớm.']
};
