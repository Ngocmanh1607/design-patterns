const P = [
/* ============ SINGLETON ============ */
{id:"singleton", g:"Creational", t:"Singleton",
 tag:"Đảm bảo một class chỉ có đúng một instance, và cung cấp một điểm truy cập toàn cục tới nó.",
 when:["Tài nguyên dùng chung: connection pool, config, logger","Cần kiểm soát chặt số lượng instance"],
 avoid:["Chỉ để “tiện” truy cập global","Code cần unit test nhiều (khó mock)"],
 steps:[
 {t:"Vấn đề: ai cũng new",
  p:["Mỗi service tự gọi <code>new Database()</code>. Kết quả: ba kết nối riêng rẽ, tốn tài nguyên và trạng thái không đồng nhất.","Ta muốn <b>mọi nơi dùng chung một instance</b>, nhưng vẫn không để ai tự tạo bừa."],
  n:[{i:"a",l:"ServiceA",x:150,y:100},{i:"b",l:"ServiceB",x:150,y:220},{i:"c",l:"ServiceC",x:150,y:340},
     {i:"d1",l:"Database #1",s:"new Database()",x:610,y:100,k:"warn"},{i:"d2",l:"Database #2",s:"new Database()",x:610,y:220,k:"warn"},{i:"d3",l:"Database #3",s:"new Database()",x:610,y:340,k:"warn"}],
  e:[{f:"a",t:"d1",flow:1,k:"warn"},{f:"b",t:"d2",flow:1,k:"warn"},{f:"c",t:"d3",flow:1,k:"warn"}],
  code:`// Mỗi nơi tạo một kết nối mới 😬
const db1 = new Database();
const db2 = new Database();
db1 === db2; // false`},
 {t:"Giải pháp: getInstance()",
  p:["Đặt constructor là <code>private</code> để không ai <code>new</code> được từ bên ngoài.","Thêm phương thức tĩnh <code>getInstance()</code> — cánh cổng duy nhất trả về instance dùng chung."],
  n:[{i:"a",l:"ServiceA",x:130,y:100},{i:"b",l:"ServiceB",x:130,y:220},{i:"c",l:"ServiceC",x:130,y:340},
     {i:"g",l:"getInstance()",s:"static",x:390,y:220,k:"blue"},{i:"d1",l:"Database",s:"instance duy nhất",x:650,y:220,k:"accent"}],
  e:[{f:"a",t:"g",flow:1,seq:0},{f:"b",t:"g",flow:1,seq:0},{f:"c",t:"g",flow:1,seq:0},{f:"g",t:"d1",flow:1,seq:1,k:"accent"}],
  code:`class Database {
  private static instance: Database;
  private constructor() {}          // chặn new

  static getInstance(): Database {
    return this.instance ??= new Database();
  }
}

Database.getInstance() === Database.getInstance(); // true`},
 {t:"Khởi tạo lười (lazy)",
  p:["Instance chỉ được tạo ở <b>lần gọi đầu tiên</b>. Các lần sau, <code>getInstance()</code> chỉ trả lại đối tượng đã lưu.","Nhờ vậy, nếu chương trình không bao giờ cần database, ta cũng không tốn chi phí khởi tạo."],
  n:[{i:"g",l:"getInstance()",x:120,y:220,k:"blue"},{i:"chk",l:"instance == null ?",x:370,y:220,k:"gold",w:180},
     {i:"cr",l:"new Database()",s:"lần đầu",x:640,y:100,k:"green"},{i:"d1",l:"return instance",s:"mọi lần sau",x:640,y:340,k:"accent"}],
  e:[{f:"g",t:"chk",flow:1,seq:0},{f:"chk",t:"cr",l:"có",flow:1,seq:1,k:"green"},{f:"cr",t:"d1",l:"lưu lại",flow:1,seq:2,dash:1},{f:"chk",t:"d1",l:"không",flow:1,seq:1,k:"accent"}],
  code:`static getInstance(): Database {
  if (Database.instance == null) {
    Database.instance = new Database(); // chỉ chạy 1 lần
  }
  return Database.instance;
}`},
 {t:"Cái giá phải trả",
  p:["Singleton thực chất là <b>trạng thái toàn cục</b> được ngụy trang. Nó che giấu phụ thuộc, khiến test khó mock, và trong môi trường đa luồng phải cẩn thận race condition.","Trong nhiều dự án hiện đại, người ta dùng <b>Dependency Injection</b> với scope “singleton” thay vì tự viết pattern này."],
  n:[{i:"d1",l:"Database",s:"global state",x:400,y:220,k:"accent"},
     {i:"w1",l:"Khó unit test",x:150,y:90,k:"warn"},{i:"w2",l:"Ẩn phụ thuộc",x:650,y:90,k:"warn"},
     {i:"w3",l:"Race condition",s:"đa luồng",x:150,y:350,k:"warn"},{i:"w4",l:"Vi phạm SRP",x:650,y:350,k:"warn"}],
  e:[{f:"d1",t:"w1",dash:1,k:"warn"},{f:"d1",t:"w2",dash:1,k:"warn"},{f:"d1",t:"w3",dash:1,k:"warn"},{f:"d1",t:"w4",dash:1,k:"warn"}],
  code:`// Thay vì gọi Database.getInstance() khắp nơi,
// hãy tiêm phụ thuộc qua constructor:
class UserService {
  constructor(private db: Database) {}
}

// test dễ dàng:
new UserService(new FakeDatabase());`}
 ]},

/* ============ FACTORY METHOD ============ */
{id:"factory-method", g:"Creational", t:"Factory Method",
 tag:"Định nghĩa một phương thức tạo đối tượng ở lớp cha, để lớp con quyết định tạo đối tượng cụ thể nào.",
 when:["Chưa biết trước loại đối tượng cần tạo","Muốn người dùng thư viện mở rộng loại sản phẩm"],
 avoid:["Chỉ có một loại sản phẩm, không có dấu hiệu mở rộng"],
 steps:[
 {t:"Vấn đề: dính chặt vào Truck",
  p:["App logistics ban đầu chỉ chở bằng xe tải, nên code gọi thẳng <code>new Truck()</code> ở khắp nơi.","Khi cần thêm tàu biển, ta phải chèn <code>if/else</code> vào mọi chỗ tạo phương tiện."],
  n:[{i:"app",l:"LogisticsApp",x:160,y:220},{i:"truck",l:"Truck",x:580,y:130,k:"accent"},{i:"ship",l:"Ship ?",s:"chưa hỗ trợ",x:580,y:320,k:"muted"}],
  e:[{f:"app",t:"truck",l:"new Truck()",flow:1,k:"accent"},{f:"app",t:"ship",l:"if / else …",dash:1,k:"warn"}],
  code:`function planDelivery(type: string) {
  let t;
  if (type === "road") t = new Truck();
  else if (type === "sea") t = new Ship();   // sửa mãi không hết
  t.deliver();
}`},
 {t:"Lớp con quyết định",
  p:["Lớp cha <code>Logistics</code> khai báo phương thức trừu tượng <code>createTransport()</code>.","Mỗi lớp con override nó: <code>RoadLogistics</code> trả về Truck, <code>SeaLogistics</code> trả về Ship."],
  n:[{i:"cr",l:"Logistics",s:"createTransport()",x:400,y:80,k:"blue",w:180},
     {i:"road",l:"RoadLogistics",x:220,y:220},{i:"sea",l:"SeaLogistics",x:580,y:220},
     {i:"truck",l:"Truck",x:220,y:360,k:"accent"},{i:"ship",l:"Ship",x:580,y:360,k:"green"}],
  e:[{f:"road",t:"cr",l:"extends",dash:1},{f:"sea",t:"cr",l:"extends",dash:1},
     {f:"road",t:"truck",l:"create",flow:1,k:"accent"},{f:"sea",t:"ship",l:"create",flow:1,k:"green"}],
  code:`abstract class Logistics {
  abstract createTransport(): Transport;   // factory method

  planDelivery() {
    const t = this.createTransport();
    t.deliver();
  }
}

class RoadLogistics extends Logistics {
  createTransport() { return new Truck(); }
}
class SeaLogistics extends Logistics {
  createTransport() { return new Ship(); }
}`},
 {t:"Client chỉ biết interface",
  p:["Code nghiệp vụ chỉ làm việc với interface <code>Transport</code>. Nó không cần biết bên dưới là Truck hay Ship.","Muốn thêm <code>Plane</code>? Viết thêm <code>AirLogistics</code>, <b>không sửa code cũ</b> (Open/Closed Principle)."],
  n:[{i:"app",l:"Client",x:110,y:180},{i:"cr",l:"Logistics",s:"planDelivery()",x:350,y:180,k:"blue",w:170},
     {i:"tr",l:"«Transport»",s:"deliver()",x:620,y:180,k:"accent"},
     {i:"truck",l:"Truck",x:520,y:350,w:110},{i:"ship",l:"Ship",x:650,y:350,w:110},{i:"plane",l:"Plane",s:"mới",x:780-60,y:350,w:100,k:"green"}],
  e:[{f:"app",t:"cr",flow:1,seq:0},{f:"cr",t:"tr",flow:1,seq:1,k:"accent"},
     {f:"truck",t:"tr",dash:1},{f:"ship",t:"tr",dash:1},{f:"plane",t:"tr",dash:1,k:"green"}],
  code:`interface Transport { deliver(): void; }

class Plane implements Transport {
  deliver() { console.log("Giao bằng đường hàng không"); }
}
class AirLogistics extends Logistics {
  createTransport() { return new Plane(); }
}

const logistics: Logistics = new AirLogistics();
logistics.planDelivery();`}
 ]},

/* ============ BUILDER ============ */
{id:"builder", g:"Creational", t:"Builder",
 tag:"Xây dựng đối tượng phức tạp theo từng bước, tách quy trình tạo khỏi cách biểu diễn.",
 when:["Đối tượng có nhiều tham số tùy chọn","Cùng một quy trình tạo ra nhiều biến thể"],
 avoid:["Đối tượng đơn giản, ít trường"],
 steps:[
 {t:"Vấn đề: constructor khổng lồ",
  p:["Một ngôi nhà có thể có tường, cửa, mái, gara, bể bơi, vườn… Đưa tất cả vào constructor tạo ra lời gọi khó đọc như <code>new House(4, 2, true, false, true, null)</code>.","Đọc lại sau một tuần, không ai nhớ <code>true</code> thứ ba nghĩa là gì."],
  n:[{i:"cl",l:"Client",x:130,y:220},{i:"h",l:"new House(4, 2, true, false, true, null, …)",x:500,y:220,k:"warn",w:420}],
  e:[{f:"cl",t:"h",flow:1,k:"warn"}],
  code:`const house = new House(
  4, 2, true, false, true, null, "wood", false
); // 😵 tham số nào là gì?`},
 {t:"Xây từng bước",
  p:["<code>HouseBuilder</code> cung cấp các bước đặt tên rõ ràng. Client gọi đúng những bước mình cần, theo kiểu chuỗi (fluent).","Cuối cùng <code>build()</code> trả về đối tượng hoàn chỉnh. Bước nào không gọi thì đơn giản là không có."],
  n:[{i:"cl",l:"Client",x:100,y:220,w:120},{i:"bd",l:"HouseBuilder",x:300,y:220,k:"blue"},
     {i:"w1",l:".walls(4)",x:520,y:80,w:140},{i:"w2",l:".doors(2)",x:520,y:175,w:140},{i:"w3",l:".roof(\"wood\")",x:520,y:270,w:140},{i:"w4",l:".garage()",s:"tùy chọn",x:520,y:365,w:140,k:"muted"},
     {i:"h",l:"House",s:"build()",x:715,y:220,k:"accent",w:120}],
  e:[{f:"cl",t:"bd",flow:1,seq:0},{f:"bd",t:"w1",flow:1,seq:1},{f:"bd",t:"w2",flow:1,seq:2},{f:"bd",t:"w3",flow:1,seq:3},{f:"bd",t:"w4",dash:1},
     {f:"w1",t:"h",flow:1,seq:4,k:"accent"},{f:"w2",t:"h",flow:1,seq:4,k:"accent"},{f:"w3",t:"h",flow:1,seq:4,k:"accent"}],
  code:`class HouseBuilder {
  private h = new House();
  walls(n: number)  { this.h.walls = n;  return this; }
  doors(n: number)  { this.h.doors = n;  return this; }
  roof(m: string)   { this.h.roof = m;   return this; }
  garage()          { this.h.garage = true; return this; }
  build()           { return this.h; }
}

const house = new HouseBuilder()
  .walls(4).doors(2).roof("wood")
  .build();`},
 {t:"Director: đóng gói công thức",
  p:["Nếu có những “công thức” hay dùng (nhà gỗ, biệt thự…), ta gom chúng vào <code>Director</code>.","Director biết <b>thứ tự</b> các bước; Builder biết <b>cách</b> làm từng bước. Đổi builder là ra sản phẩm khác với cùng quy trình."],
  n:[{i:"cl",l:"Client",x:110,y:340,w:120},{i:"dr",l:"Director",s:"buildCabin()",x:110,y:120,k:"gold",w:150},
     {i:"bd",l:"HouseBuilder",x:380,y:220,k:"blue"},{i:"bd2",l:"ManualBuilder",s:"tạo tài liệu",x:380,y:370,k:"muted"},
     {i:"h",l:"House",x:650,y:220,k:"accent",w:130}],
  e:[{f:"cl",t:"dr",flow:1,seq:0},{f:"dr",t:"bd",l:"walls → roof → doors",flow:1,seq:1},{f:"bd",t:"h",l:"build()",flow:1,seq:2,k:"accent"},{f:"dr",t:"bd2",dash:1}],
  code:`class Director {
  buildCabin(b: HouseBuilder) {
    return b.walls(4).roof("wood").doors(1).build();
  }
}

const cabin = new Director().buildCabin(new HouseBuilder());`}
 ]},

/* ============ ADAPTER ============ */
{id:"adapter", g:"Structural", t:"Adapter",
 tag:"Cho phép các đối tượng có interface không tương thích làm việc được với nhau.",
 when:["Tích hợp thư viện cũ / bên thứ ba","Interface có sẵn không khớp với code của bạn"],
 avoid:["Bạn có thể sửa trực tiếp interface gốc"],
 steps:[
 {t:"Vấn đề: hai bên không khớp",
  p:["App của bạn làm việc với dữ liệu JSON, nhưng thư viện chứng khoán cũ chỉ trả về XML.","Sửa thư viện thì không được (không có mã nguồn), sửa app thì phá vỡ mọi thứ đang chạy."],
  n:[{i:"app",l:"App",s:"cần JSON",x:160,y:220,k:"blue"},{i:"lib",l:"LegacyStockAPI",s:"trả về XML",x:640,y:220,k:"gold",w:180}],
  e:[{f:"app",t:"lib",l:"✕ không tương thích",dash:1,k:"warn"}],
  code:`interface DataSource { getJson(): object; }

class LegacyStockAPI {
  fetchXml(): string { return "<stock>…</stock>"; }
}
// app.use(new LegacyStockAPI()) ❌ sai kiểu`},
 {t:"Adapter đứng giữa",
  p:["<code>XmlToJsonAdapter</code> nhận lời gọi theo interface app hiểu, chuyển thành lời gọi mà thư viện hiểu, rồi chuyển kết quả XML ngược về JSON.","Giống ổ cắm chuyển đổi khi đi du lịch: hai bên không đổi, chỉ thêm một lớp ở giữa."],
  n:[{i:"app",l:"App",s:"cần JSON",x:120,y:220,k:"blue"},{i:"ad",l:"XmlToJsonAdapter",x:400,y:220,k:"accent",w:190},{i:"lib",l:"LegacyStockAPI",s:"trả về XML",x:670,y:220,k:"gold",w:170}],
  e:[{f:"app",t:"ad",l:"getJson()",flow:1,seq:0,b:-40},{f:"ad",t:"lib",l:"fetchXml()",flow:1,seq:1,b:-40},
     {f:"lib",t:"ad",l:"<xml>",flow:1,seq:2,b:-40,k:"gold"},{f:"ad",t:"app",l:"{json}",flow:1,seq:3,b:-40,k:"accent"}],
  code:`class XmlToJsonAdapter implements DataSource {
  constructor(private api: LegacyStockAPI) {}

  getJson(): object {
    const xml = this.api.fetchXml();
    return xmlToJson(xml);   // chuyển đổi
  }
}`},
 {t:"Cấu trúc tổng quát",
  p:["Adapter <b>implement</b> interface mục tiêu (<code>DataSource</code>) và <b>bọc</b> đối tượng cần chuyển đổi (adaptee).","App chỉ phụ thuộc vào <code>DataSource</code>, nên có thể dùng adapter hoặc bất kỳ nguồn JSON thật nào khác."],
  n:[{i:"app",l:"App",x:130,y:90,k:"blue"},{i:"tg",l:"«DataSource»",s:"getJson()",x:430,y:90,k:"blue"},
     {i:"ad",l:"XmlToJsonAdapter",x:430,y:240,k:"accent",w:190},{i:"lib",l:"LegacyStockAPI",x:430,y:380,k:"gold",w:170},{i:"js",l:"RestJsonAPI",x:690,y:240}],
  e:[{f:"app",t:"tg",flow:1,seq:0},{f:"ad",t:"tg",l:"implements",dash:1},{f:"js",t:"tg",l:"implements",dash:1},{f:"ad",t:"lib",l:"wraps",flow:1,seq:1,k:"gold"}],
  code:`function render(source: DataSource) {
  draw(source.getJson());
}

render(new XmlToJsonAdapter(new LegacyStockAPI()));
render(new RestJsonAPI());   // cũng chạy`}
 ]},

/* ============ DECORATOR ============ */
{id:"decorator", g:"Structural", t:"Decorator",
 tag:"Gắn thêm hành vi cho đối tượng bằng cách bọc nó trong các lớp vỏ có cùng interface.",
 when:["Cần thêm/bớt tính năng lúc runtime","Kế thừa sinh ra quá nhiều tổ hợp lớp con"],
 avoid:["Thứ tự bọc quá phức tạp, khó debug"],
 steps:[
 {t:"Vấn đề: bùng nổ lớp con",
  p:["Ban đầu <code>Notifier</code> chỉ gửi email. Rồi người dùng muốn thêm SMS, Slack, Facebook… và <b>kết hợp</b> chúng.","Dùng kế thừa, mỗi tổ hợp là một lớp con: số lớp tăng theo cấp số nhân."],
  n:[{i:"base",l:"Notifier",s:"send()",x:400,y:80,k:"blue"},
     {i:"s1",l:"SMSNotifier",x:150,y:220},{i:"s2",l:"SlackNotifier",x:400,y:220},{i:"s3",l:"FBNotifier",x:650,y:220},
     {i:"c1",l:"SMS+Slack",x:150,y:360,k:"warn"},{i:"c2",l:"SMS+FB",x:400,y:360,k:"warn"},{i:"c3",l:"Slack+FB+SMS",x:650,y:360,k:"warn"}],
  e:[{f:"s1",t:"base",dash:1},{f:"s2",t:"base",dash:1},{f:"s3",t:"base",dash:1},{f:"c1",t:"s1",dash:1,k:"warn"},{f:"c2",t:"s2",dash:1,k:"warn"},{f:"c3",t:"s3",dash:1,k:"warn"}],
  code:`class SMSNotifier extends Notifier {}
class SlackNotifier extends Notifier {}
class SMSAndSlackNotifier extends Notifier {}
class SMSAndSlackAndFBNotifier extends Notifier {}
// … 2ⁿ lớp 😱`},
 {t:"Bọc từng lớp",
  p:["Mỗi decorator <b>có cùng interface</b> với đối tượng nó bọc và giữ tham chiếu tới đối tượng bên trong.","Lời gọi <code>send()</code> đi xuyên qua các lớp vỏ: mỗi lớp làm việc của mình rồi chuyển tiếp vào trong."],
  n:[{i:"cl",l:"Client",x:90,y:220,w:110},{i:"s2",l:"SlackDecorator",x:290,y:220,k:"accent",w:165},{i:"s1",l:"SMSDecorator",x:490,y:220,k:"green",w:160},{i:"base",l:"EmailNotifier",x:690,y:220,k:"blue",w:160}],
  e:[{f:"cl",t:"s2",l:"send()",flow:1,seq:0},{f:"s2",t:"s1",l:"send()",flow:1,seq:1,k:"accent"},{f:"s1",t:"base",l:"send()",flow:1,seq:2,k:"green"}],
  code:`interface Notifier { send(msg: string): void; }

class EmailNotifier implements Notifier {
  send(msg) { mail(msg); }
}

class SMSDecorator implements Notifier {
  constructor(private inner: Notifier) {}
  send(msg) {
    this.inner.send(msg);   // chuyển tiếp
    sms(msg);               // + hành vi mới
  }
}`},
 {t:"Mỗi lớp thêm một hành vi",
  p:["Kết quả: một lần gọi <code>send()</code> tạo ra cả Slack, SMS và Email, mà không cần lớp con tổ hợp nào.","Bọc lớp nào, theo thứ tự nào là do bạn quyết định lúc chạy. Middleware trong Express hay <code>@decorator</code> trong TypeScript đều dựa trên ý tưởng này."],
  n:[{i:"cl",l:"Client",x:90,y:150,w:110},{i:"s2",l:"SlackDecorator",x:290,y:150,k:"accent",w:165},{i:"s1",l:"SMSDecorator",x:490,y:150,k:"green",w:160},{i:"base",l:"EmailNotifier",x:690,y:150,k:"blue",w:160},
     {i:"o1",l:"💬 Slack",x:290,y:340,k:"note"},{i:"o2",l:"📱 SMS",x:490,y:340,k:"note"},{i:"o3",l:"✉️ Email",x:690,y:340,k:"note"}],
  e:[{f:"cl",t:"s2",flow:1,seq:0},{f:"s2",t:"s1",flow:1,seq:1,k:"accent"},{f:"s1",t:"base",flow:1,seq:2,k:"green"},
     {f:"base",t:"o3",flow:1,seq:3,k:"blue"},{f:"s1",t:"o2",flow:1,seq:3,k:"green"},{f:"s2",t:"o1",flow:1,seq:3,k:"accent"}],
  code:`let n: Notifier = new EmailNotifier();
if (user.wantsSMS)   n = new SMSDecorator(n);
if (user.wantsSlack) n = new SlackDecorator(n);

n.send("Server sập rồi!");
// → Email + SMS + Slack`}
 ]},

/* ============ FACADE ============ */
{id:"facade", g:"Structural", t:"Facade",
 tag:"Cung cấp một interface đơn giản cho một hệ thống con phức tạp.",
 when:["Thư viện/hệ thống con có quá nhiều lớp","Muốn phân tầng hệ thống rõ ràng"],
 avoid:["Facade phình to thành “god object”"],
 steps:[
 {t:"Vấn đề: client biết quá nhiều",
  p:["Để convert một video, client phải tự điều phối năm lớp của thư viện: đọc file, chọn codec, đọc bitrate, trộn âm thanh, nén…","Client bị <b>gắn chặt</b> với chi tiết nội bộ; thư viện đổi phiên bản là vỡ."],
  n:[{i:"cl",l:"Client",x:130,y:220},
     {i:"v1",l:"VideoFile",x:600,y:50},{i:"v2",l:"CodecFactory",x:600,y:135},{i:"v3",l:"BitrateReader",x:600,y:220},{i:"v4",l:"AudioMixer",x:600,y:305},{i:"v5",l:"Mp4Compressor",x:600,y:390}],
  e:["v1","v2","v3","v4","v5"].map((t,i)=>({f:"cl",t,flow:1,k:"warn"})),
  code:`const file = new VideoFile("cat.ogg");
const codec = CodecFactory.extract(file);
const buf = BitrateReader.read(file, codec);
const audio = new AudioMixer().fix(buf);
const out = new Mp4Compressor().compress(buf, audio);
// 😓 client phải biết hết`},
 {t:"Một cửa duy nhất",
  p:["<code>VideoConverter</code> che toàn bộ sự phức tạp sau một phương thức <code>convert()</code>.","Client chỉ nói <b>muốn gì</b>; facade lo <b>làm thế nào</b>. Các lớp bên trong vẫn có thể dùng trực tiếp khi thật cần."],
  n:[{i:"cl",l:"Client",x:100,y:220,w:120},{i:"fa",l:"VideoConverter",s:"convert(file, 'mp4')",x:340,y:220,k:"accent",w:200},
     {i:"v1",l:"VideoFile",x:640,y:50},{i:"v2",l:"CodecFactory",x:640,y:135},{i:"v3",l:"BitrateReader",x:640,y:220},{i:"v4",l:"AudioMixer",x:640,y:305},{i:"v5",l:"Mp4Compressor",x:640,y:390}],
  e:[{f:"cl",t:"fa",flow:1,seq:0,k:"accent"}].concat(["v1","v2","v3","v4","v5"].map((t,i)=>({f:"fa",t,flow:1,seq:1}))),
  code:`class VideoConverter {
  convert(path: string, format: string) {
    const file = new VideoFile(path);
    const codec = CodecFactory.extract(file);
    // … toàn bộ chi tiết nằm ở đây
    return new Mp4Compressor().compress(buf, audio);
  }
}

new VideoConverter().convert("cat.ogg", "mp4"); // ✨`}
 ]},

/* ============ PROXY ============ */
{id:"proxy", g:"Structural", t:"Proxy",
 tag:"Đặt một đối tượng thay thế đứng trước đối tượng thật để kiểm soát việc truy cập tới nó.",
 when:["Cache, lazy-load, kiểm tra quyền, ghi log","Đối tượng thật nặng hoặc nằm ở xa"],
 avoid:["Thêm độ trễ không cần thiết cho lời gọi đơn giản"],
 steps:[
 {t:"Vấn đề: gọi thẳng dịch vụ nặng",
  p:["Ba client cùng xin một video. Mỗi lần đều gọi thẳng <code>YouTubeAPI</code>, vốn chậm và tốn quota.","Ta muốn thêm cache nhưng không được sửa thư viện và không muốn sửa từng client."],
  n:[{i:"c1",l:"Client 1",x:130,y:100},{i:"c2",l:"Client 2",x:130,y:220},{i:"c3",l:"Client 3",x:130,y:340},{i:"sv",l:"YouTubeAPI",s:"chậm · tốn quota",x:640,y:220,k:"warn",w:170}],
  e:[{f:"c1",t:"sv",l:"getVideo(42)",flow:1,k:"warn"},{f:"c2",t:"sv",flow:1,k:"warn"},{f:"c3",t:"sv",flow:1,k:"warn"}],
  code:`const api = new YouTubeAPI();
api.getVideo(42);  // 800ms
api.getVideo(42);  // lại 800ms
api.getVideo(42);  // lại 800ms 🐢`},
 {t:"Proxy đứng chắn",
  p:["<code>CachedYouTube</code> có <b>cùng interface</b> với API thật, nên client không hề biết mình đang nói chuyện với proxy.","Proxy kiểm tra cache trước: có thì trả ngay, không có mới gọi dịch vụ thật rồi lưu lại."],
  n:[{i:"c1",l:"Client 1",x:110,y:100,w:130},{i:"c2",l:"Client 2",x:110,y:220,w:130},{i:"c3",l:"Client 3",x:110,y:340,w:130},
     {i:"px",l:"CachedYouTube",s:"proxy",x:390,y:220,k:"accent",w:170},{i:"ca",l:"Cache",x:390,y:385,k:"green",w:120},{i:"sv",l:"YouTubeAPI",x:665,y:220,k:"blue",w:160}],
  e:[{f:"c1",t:"px",flow:1,seq:0},{f:"c2",t:"px",flow:1,seq:0},{f:"c3",t:"px",flow:1,seq:0},
     {f:"px",t:"ca",l:"hit ✓",flow:1,seq:1,k:"green"},{f:"px",t:"sv",l:"miss",flow:1,seq:2,dash:1,k:"blue"}],
  code:`class CachedYouTube implements VideoService {
  private cache = new Map<number, Video>();
  constructor(private real: YouTubeAPI) {}

  getVideo(id: number) {
    if (!this.cache.has(id)) {
      this.cache.set(id, this.real.getVideo(id));
    }
    return this.cache.get(id)!;
  }
}`},
 {t:"Các biến thể của Proxy",
  p:["Cùng một cấu trúc, nhiều mục đích: <b>Virtual</b> (tạo đối tượng nặng khi cần), <b>Protection</b> (kiểm quyền), <b>Remote</b> (đối tượng ở máy khác), <b>Logging</b> (ghi lại lời gọi).","Trong JavaScript, đối tượng <code>Proxy</code> có sẵn giúp bạn chặn mọi thao tác get/set."],
  n:[{i:"px",l:"Proxy",s:"cùng interface",x:400,y:220,k:"accent"},
     {i:"t1",l:"Virtual",s:"lazy load",x:150,y:90,k:"blue"},{i:"t2",l:"Protection",s:"kiểm tra quyền",x:650,y:90,k:"gold"},
     {i:"t3",l:"Remote",s:"gọi qua mạng",x:150,y:350,k:"green"},{i:"t4",l:"Logging",s:"ghi log",x:650,y:350}],
  e:[{f:"px",t:"t1",dash:1},{f:"px",t:"t2",dash:1},{f:"px",t:"t3",dash:1},{f:"px",t:"t4",dash:1}],
  code:`const user = new Proxy(target, {
  get(obj, key) {
    console.log("đọc", key);        // logging proxy
    return obj[key];
  },
  set(obj, key, val) {
    if (key === "role") throw Error("Cấm!"); // protection
    obj[key] = val; return true;
  }
});`}
 ]},

/* ============ OBSERVER ============ */
{id:"observer", g:"Behavioral", t:"Observer",
 tag:"Cơ chế đăng ký để nhiều đối tượng được thông báo khi có sự kiện xảy ra ở đối tượng mà chúng theo dõi.",
 when:["Một thay đổi cần lan tới nhiều nơi","UI phản ứng theo dữ liệu, hệ thống event"],
 avoid:["Chuỗi thông báo dây chuyền khó theo dõi"],
 steps:[
 {t:"Vấn đề: hỏi liên tục (polling)",
  p:["Khách hàng muốn mua iPhone mới nên ngày nào cũng ghé cửa hàng hỏi: “Có hàng chưa?”","Phần lớn các lần hỏi là vô ích. Còn nếu cửa hàng gửi thư cho <b>mọi</b> khách thì lại thành spam."],
  n:[{i:"c1",l:"Customer A",x:150,y:100},{i:"c2",l:"Customer B",x:150,y:220},{i:"c3",l:"Customer C",x:150,y:340},{i:"st",l:"Store",x:630,y:220,k:"accent"}],
  e:[{f:"c1",t:"st",l:"có hàng chưa?",flow:1,k:"warn"},{f:"c2",t:"st",l:"có hàng chưa?",flow:1,k:"warn"},{f:"c3",t:"st",l:"có hàng chưa?",flow:1,k:"warn"}],
  code:`setInterval(() => {
  if (store.hasNewIphone()) buy();   // hỏi mãi…
}, 1000);`},
 {t:"Đăng ký (subscribe)",
  p:["Cửa hàng trở thành <b>Publisher</b> và giữ danh sách <code>subscribers</code>.","Ai quan tâm thì gọi <code>subscribe()</code> một lần duy nhất, rồi thôi không hỏi nữa."],
  n:[{i:"c1",l:"Customer A",x:150,y:100},{i:"c2",l:"Customer B",x:150,y:220},{i:"c3",l:"Customer C",x:150,y:340},{i:"st",l:"Store",s:"subscribers[ ]",x:630,y:220,k:"accent"}],
  e:[{f:"c1",t:"st",l:"subscribe()",flow:1,seq:0,dash:1,k:"blue"},{f:"c2",t:"st",l:"subscribe()",flow:1,seq:1,dash:1,k:"blue"},{f:"c3",t:"st",l:"subscribe()",flow:1,seq:2,dash:1,k:"blue"}],
  code:`class Store {
  private subscribers: Subscriber[] = [];

  subscribe(s: Subscriber)   { this.subscribers.push(s); }
  unsubscribe(s: Subscriber) {
    this.subscribers = this.subscribers.filter(x => x !== s);
  }
}`},
 {t:"Sự kiện xảy ra → notify",
  p:["Khi hàng về, Publisher duyệt danh sách và gọi <code>update()</code> của từng subscriber.","Publisher <b>không cần biết</b> subscriber là ai, chỉ cần họ có phương thức <code>update()</code>."],
  n:[{i:"ev",l:"📦 Hàng mới về!",x:630,y:70,k:"note"},{i:"c1",l:"Customer A",x:150,y:100},{i:"c2",l:"Customer B",x:150,y:220},{i:"c3",l:"Customer C",x:150,y:340},{i:"st",l:"Store",s:"notify()",x:630,y:220,k:"accent"}],
  e:[{f:"ev",t:"st",flow:1,seq:0,k:"gold"},{f:"st",t:"c1",l:"update(event)",flow:1,seq:1,k:"green"},{f:"st",t:"c2",l:"update(event)",flow:1,seq:1,k:"green"},{f:"st",t:"c3",l:"update(event)",flow:1,seq:1,k:"green"}],
  code:`interface Subscriber { update(e: string): void; }

class Store {
  // …
  notify(event: string) {
    for (const s of this.subscribers) s.update(event);
  }
  restock() { this.notify("iphone-arrived"); }
}`},
 {t:"Hủy đăng ký",
  p:["Khách B đã mua ở nơi khác nên gọi <code>unsubscribe()</code>. Lần thông báo sau sẽ bỏ qua B.","Đây chính là cách <code>addEventListener</code>, RxJS, hay state store trong React/Vue hoạt động. Nhớ hủy đăng ký để tránh rò rỉ bộ nhớ."],
  n:[{i:"c1",l:"Customer A",x:150,y:100},{i:"c2",l:"Customer B",s:"đã rời đi",x:150,y:220,k:"muted"},{i:"c3",l:"Customer C",x:150,y:340},{i:"st",l:"Store",s:"subscribers[A, C]",x:630,y:220,k:"accent",w:180}],
  e:[{f:"c2",t:"st",l:"unsubscribe()",dash:1,k:"warn"},{f:"st",t:"c1",l:"update()",flow:1,k:"green"},{f:"st",t:"c3",l:"update()",flow:1,k:"green"}],
  code:`const onClick = () => console.log("clicked");

button.addEventListener("click", onClick);    // subscribe
button.removeEventListener("click", onClick); // unsubscribe`}
 ]},

/* ============ STRATEGY ============ */
{id:"strategy", g:"Behavioral", t:"Strategy",
 tag:"Định nghĩa một họ thuật toán, đóng gói từng cái và cho phép hoán đổi chúng lúc runtime.",
 when:["Nhiều cách làm cùng một việc","Chuỗi if/else theo “loại” ngày càng dài"],
 avoid:["Chỉ có 1–2 thuật toán hiếm khi đổi"],
 steps:[
 {t:"Vấn đề: một hàm ôm hết",
  p:["App bản đồ ban đầu chỉ chỉ đường cho ô tô. Rồi thêm đi bộ, xe buýt, xe đạp… và tất cả nằm trong một hàm <code>buildRoute()</code>.","Mỗi lần thêm kiểu mới là sửa lớp chính, rủi ro làm hỏng các kiểu cũ."],
  n:[{i:"nav",l:"Navigator",s:"buildRoute()",x:220,y:220,k:"warn",w:180},
     {i:"r1",l:"if (car) …",x:600,y:70,k:"muted"},{i:"r2",l:"else if (walk) …",x:600,y:170,k:"muted"},{i:"r3",l:"else if (bus) …",x:600,y:270,k:"muted"},{i:"r4",l:"else if (bike) …",x:600,y:370,k:"muted"}],
  e:["r1","r2","r3","r4"].map(t=>({f:"nav",t,flow:1,k:"warn"})),
  code:`buildRoute(a, b, mode) {
  if (mode === "car")       { /* 200 dòng */ }
  else if (mode === "walk") { /* 150 dòng */ }
  else if (mode === "bus")  { /* 300 dòng */ }
  // …
}`},
 {t:"Tách thành strategy",
  p:["Mỗi thuật toán thành một lớp riêng, cùng implement <code>RouteStrategy</code>.","<code>Navigator</code> (context) chỉ giữ một tham chiếu và ủy quyền: <code>this.strategy.build(a, b)</code>."],
  n:[{i:"nav",l:"Navigator",s:"context",x:170,y:220,k:"accent"},{i:"if",l:"«RouteStrategy»",s:"build(a, b)",x:430,y:220,k:"blue",w:180},
     {i:"r1",l:"CarStrategy",x:680,y:90},{i:"r2",l:"WalkStrategy",x:680,y:220},{i:"r3",l:"BusStrategy",x:680,y:350}],
  e:[{f:"nav",t:"if",l:"strategy.build()",flow:1,k:"accent"},{f:"r1",t:"if",dash:1},{f:"r2",t:"if",dash:1},{f:"r3",t:"if",dash:1}],
  code:`interface RouteStrategy { build(a: Point, b: Point): Route; }

class WalkStrategy implements RouteStrategy {
  build(a, b) { /* tránh đường cao tốc */ }
}

class Navigator {
  constructor(private strategy: RouteStrategy) {}
  setStrategy(s: RouteStrategy) { this.strategy = s; }
  route(a, b) { return this.strategy.build(a, b); }
}`},
 {t:"Đổi chiến lược lúc chạy",
  p:["Người dùng bấm nút “Đi bộ” → app gọi <code>setStrategy(new WalkStrategy())</code>. Navigator không đổi một dòng code nào.","Ví dụ thực tế: <code>Array.sort(compareFn)</code>, các chiến lược thanh toán, nén file, xác thực…"],
  n:[{i:"u",l:"🧑 Người dùng",x:170,y:70,k:"note"},{i:"nav",l:"Navigator",s:"strategy = Walk",x:170,y:250,k:"accent",w:170},
     {i:"r1",l:"CarStrategy",x:600,y:100,k:"muted"},{i:"r2",l:"WalkStrategy",s:"đang dùng",x:600,y:250,k:"green"},{i:"r3",l:"BusStrategy",x:600,y:400,k:"muted"}],
  e:[{f:"u",t:"nav",l:"setStrategy(walk)",flow:1,seq:0,k:"gold"},{f:"nav",t:"r2",l:"build()",flow:1,seq:1,k:"green"},{f:"nav",t:"r1",dash:1},{f:"nav",t:"r3",dash:1}],
  code:`const nav = new Navigator(new CarStrategy());

walkButton.onclick = () => nav.setStrategy(new WalkStrategy());

// ví dụ có sẵn trong JS:
[3, 1, 2].sort((a, b) => b - a);  // strategy so sánh`}
 ]},

/* ============ COMMAND ============ */
{id:"command", g:"Behavioral", t:"Command",
 tag:"Biến một yêu cầu thành một đối tượng độc lập, để có thể xếp hàng, ghi lại hoặc hoàn tác.",
 when:["Undo/redo, macro, hàng đợi tác vụ","Nhiều nơi kích hoạt cùng một hành động"],
 avoid:["Hành động đơn giản, không cần lưu lịch sử"],
 steps:[
 {t:"Vấn đề: logic rải rác",
  p:["Trình soạn thảo có nút Save trên toolbar, phím tắt Ctrl+S và menu File ▸ Save. Mỗi nơi tự gọi logic lưu.","UI bị dính với nghiệp vụ, code trùng lặp, và không có cách nào hoàn tác (undo)."],
  n:[{i:"i1",l:"Nút 💾 Save",x:150,y:90},{i:"i2",l:"Ctrl + S",x:150,y:220},{i:"i3",l:"Menu ▸ Save",x:150,y:350},{i:"rc",l:"Editor.save()",s:"logic trùng lặp",x:610,y:220,k:"warn",w:170}],
  e:[{f:"i1",t:"rc",flow:1,k:"warn"},{f:"i2",t:"rc",flow:1,k:"warn"},{f:"i3",t:"rc",flow:1,k:"warn"}],
  code:`saveButton.onclick = () => { validate(); editor.save(); log(); };
hotkey("ctrl+s", ()  => { validate(); editor.save(); log(); });
menu.save.onclick = () => { validate(); editor.save(); log(); };`},
 {t:"Yêu cầu thành đối tượng",
  p:["Ta đóng gói hành động vào <code>SaveCommand</code> có phương thức <code>execute()</code>.","<b>Invoker</b> (nút, phím tắt) chỉ biết gọi <code>execute()</code>; <b>Receiver</b> (Editor) mới là nơi làm việc thật."],
  n:[{i:"i1",l:"Nút 💾 Save",x:120,y:90},{i:"i2",l:"Ctrl + S",x:120,y:220},{i:"i3",l:"Menu ▸ Save",x:120,y:350},
     {i:"cm",l:"SaveCommand",s:"execute()",x:400,y:220,k:"accent",w:170},{i:"rc",l:"Editor",s:"receiver",x:660,y:220,k:"blue"}],
  e:[{f:"i1",t:"cm",flow:1,seq:0},{f:"i2",t:"cm",flow:1,seq:0},{f:"i3",t:"cm",flow:1,seq:0},{f:"cm",t:"rc",l:"save()",flow:1,seq:1,k:"accent"}],
  code:`interface Command { execute(): void; undo?(): void; }

class SaveCommand implements Command {
  constructor(private editor: Editor) {}
  execute() { this.editor.save(); }
}

const save = new SaveCommand(editor);
saveButton.onclick = () => save.execute();
hotkey("ctrl+s", () => save.execute());`},
 {t:"Lịch sử & Undo",
  p:["Mỗi command đã chạy được đẩy vào <code>History</code>. Command lưu đủ thông tin để tự đảo ngược.","Bấm Ctrl+Z: lấy command cuối khỏi stack và gọi <code>undo()</code>. Đây là nền tảng của undo/redo, job queue và transaction log."],
  n:[{i:"i2",l:"Ctrl + Z",x:120,y:350},{i:"i1",l:"Gõ chữ",x:120,y:90},
     {i:"cm",l:"TypeCommand",s:"execute() / undo()",x:400,y:90,k:"accent",w:180},{i:"rc",l:"Editor",s:"receiver",x:670,y:220,k:"blue"},
     {i:"hs",l:"History",s:"[cmd, cmd, cmd]",x:400,y:350,k:"green",w:180}],
  e:[{f:"i1",t:"cm",l:"execute()",flow:1,seq:0},{f:"cm",t:"rc",flow:1,seq:1,k:"accent"},{f:"cm",t:"hs",l:"push",flow:1,seq:1,k:"green"},
     {f:"i2",t:"hs",l:"pop()",flow:1,seq:2,k:"gold"},{f:"hs",t:"rc",l:"undo()",flow:1,seq:3,k:"green"}],
  code:`class TypeCommand implements Command {
  private backup = "";
  constructor(private ed: Editor, private text: string) {}
  execute() { this.backup = this.ed.text; this.ed.insert(this.text); }
  undo()    { this.ed.text = this.backup; }
}

const history: Command[] = [];
function run(c: Command) { c.execute(); history.push(c); }
function undo() { history.pop()?.undo?.(); }`}
 ]},

/* ============ STATE ============ */
{id:"state", g:"Behavioral", t:"State",
 tag:"Cho phép đối tượng thay đổi hành vi khi trạng thái nội bộ thay đổi, như thể nó đổi sang một class khác.",
 when:["Hành vi phụ thuộc nhiều vào trạng thái","switch(state) lặp lại ở nhiều phương thức"],
 avoid:["Chỉ có 2–3 trạng thái và hiếm khi thay đổi"],
 steps:[
 {t:"Vấn đề: switch khắp nơi",
  p:["Một bài viết có các trạng thái Draft, Moderation, Published. Phương thức <code>publish()</code> phải <code>switch</code> theo trạng thái, và <code>render()</code>, <code>edit()</code> cũng vậy.","Thêm trạng thái “Archived” nghĩa là phải sửa mọi câu <code>switch</code>."],
  n:[{i:"doc",l:"Document",s:"publish()",x:170,y:220,k:"blue"},{i:"sw",l:"switch (state)",x:410,y:220,k:"warn",w:160},
     {i:"d",l:"case 'draft'",x:660,y:100,k:"muted"},{i:"m",l:"case 'moderation'",x:660,y:220,k:"muted",w:170},{i:"p",l:"case 'published'",x:660,y:340,k:"muted",w:170}],
  e:[{f:"doc",t:"sw",flow:1,seq:0},{f:"sw",t:"d",flow:1,seq:1,k:"warn"},{f:"sw",t:"m",flow:1,seq:1,k:"warn"},{f:"sw",t:"p",flow:1,seq:1,k:"warn"}],
  code:`publish() {
  switch (this.state) {
    case "draft":      this.state = "moderation"; break;
    case "moderation": if (isAdmin) this.state = "published"; break;
    case "published":  /* không làm gì */ break;
  }
}`},
 {t:"Máy trạng thái",
  p:["Vẽ ra sơ đồ: mỗi trạng thái quyết định chuyển sang trạng thái nào khi nhận một hành động.","Ý tưởng của pattern là: <b>mỗi nút trên sơ đồ trở thành một class</b>."],
  n:[{i:"d",l:"Draft",x:150,y:250,k:"blue",w:140},{i:"m",l:"Moderation",x:400,y:100,k:"gold",w:150},{i:"p",l:"Published",x:650,y:250,k:"green",w:150}],
  e:[{f:"d",t:"m",l:"publish()",flow:1,seq:0,k:"blue"},{f:"m",t:"p",l:"approve()",flow:1,seq:1,k:"green"},
     {f:"m",t:"d",l:"reject()",flow:1,seq:2,b:-90,dash:1,k:"warn"},{f:"p",t:"d",l:"expire()",flow:1,seq:3,b:-60,dash:1,k:"gold"}],
  code:`// Draft      --publish()-->  Moderation
// Moderation --approve()-->  Published
// Moderation --reject()-->   Draft
// Published  --expire()-->   Draft`},
 {t:"Ủy quyền cho đối tượng State",
  p:["<code>Document</code> giữ một tham chiếu <code>state</code> và chuyển mọi lời gọi cho nó: <code>this.state.publish()</code>.","Mỗi lớp trạng thái tự quyết định hành vi và tự chuyển document sang trạng thái kế tiếp. Không còn <code>switch</code> nào."],
  n:[{i:"doc",l:"Document",s:"state: State",x:140,y:220,k:"accent"},{i:"if",l:"«State»",s:"publish() · render()",x:410,y:220,k:"blue",w:180},
     {i:"d",l:"DraftState",x:680,y:90,w:150},{i:"m",l:"ModerationState",x:680,y:220,w:170},{i:"p",l:"PublishedState",x:680,y:350,w:160}],
  e:[{f:"doc",t:"if",l:"state.publish()",flow:1,k:"accent"},{f:"d",t:"if",dash:1},{f:"m",t:"if",dash:1},{f:"p",t:"if",dash:1}],
  code:`interface State { publish(doc: Document): void; }

class DraftState implements State {
  publish(doc) { doc.setState(new ModerationState()); }
}
class ModerationState implements State {
  publish(doc) {
    if (doc.user.isAdmin) doc.setState(new PublishedState());
  }
}

class Document {
  state: State = new DraftState();
  setState(s: State) { this.state = s; }
  publish() { this.state.publish(this); }
}`}
 ]},
/* ============ ABSTRACT FACTORY ============ */
{id:"abstract-factory", g:"Creational", t:"Abstract Factory",
 tag:"Tạo ra các họ đối tượng liên quan với nhau mà không cần chỉ rõ class cụ thể của chúng.",
 when:["Cần nhiều sản phẩm đi theo bộ, phải đồng bộ với nhau","Hỗ trợ nhiều nền tảng / theme"],
 avoid:["Chỉ có một họ sản phẩm, hiếm khi thêm sản phẩm mới"],
 steps:[
 {t:"Vấn đề: trộn lẫn sai bộ",
  p:["App cần Button, Checkbox, Dialog… theo phong cách Material trên Android và Cupertino trên iOS.","Nếu mỗi màn hình tự <code>new</code> từng widget, rất dễ xảy ra cảnh nút Material đứng cạnh checkbox Cupertino."],
  n:[{i:"app",l:"Màn hình Login",x:150,y:220,w:170},{i:"mb",l:"MaterialButton",x:580,y:120,k:"green",w:170},{i:"cc",l:"CupertinoCheckbox",s:"✕ lệch bộ",x:580,y:320,k:"warn",w:190}],
  e:[{f:"app",t:"mb",l:"new",flow:1},{f:"app",t:"cc",l:"new",flow:1,k:"warn"}],
  code:`const btn = new MaterialButton();
const chk = new CupertinoCheckbox(); // 😬 lệch phong cách
if (isIOS) { /* ... sửa ở 100 chỗ */ }`},
 {t:"Một factory cho mỗi họ",
  p:["Interface <code>GUIFactory</code> khai báo các phương thức tạo cho <b>cả bộ</b> sản phẩm: <code>createButton()</code>, <code>createCheckbox()</code>.","Mỗi họ có một factory cụ thể. <code>MaterialFactory</code> chỉ sinh ra đồ Material, nên không bao giờ bị lệch bộ."],
  n:[{i:"gf",l:"«GUIFactory»",s:"createButton() · createCheckbox()",x:400,y:70,k:"blue",w:270},
     {i:"mf",l:"MaterialFactory",x:200,y:200,w:170},{i:"cf",l:"CupertinoFactory",x:600,y:200,w:180},
     {i:"mb",l:"MaterialButton",x:110,y:355,k:"green",w:150},{i:"mc",l:"MaterialCheckbox",x:290,y:355,k:"green",w:165},
     {i:"cb",l:"CupertinoButton",x:510,y:355,k:"accent",w:155},{i:"cc",l:"CupertinoCheckbox",x:695,y:355,k:"accent",w:170}],
  e:[{f:"mf",t:"gf",dash:1},{f:"cf",t:"gf",dash:1},{f:"mf",t:"mb",flow:1,seq:0,k:"green"},{f:"mf",t:"mc",flow:1,seq:0,k:"green"},{f:"cf",t:"cb",flow:1,seq:1,k:"accent"},{f:"cf",t:"cc",flow:1,seq:1,k:"accent"}],
  code:`interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

class MaterialFactory implements GUIFactory {
  createButton()   { return new MaterialButton(); }
  createCheckbox() { return new MaterialCheckbox(); }
}
class CupertinoFactory implements GUIFactory {
  createButton()   { return new CupertinoButton(); }
  createCheckbox() { return new CupertinoCheckbox(); }
}`},
 {t:"Chọn factory một lần",
  p:["Lúc khởi động, app chọn factory phù hợp với nền tảng. Phần còn lại của code chỉ làm việc với <code>GUIFactory</code>.","Muốn thêm theme “Fluent” cho Windows? Viết <code>FluentFactory</code>, và các màn hình không phải sửa gì."],
  n:[{i:"app",l:"App",s:"khởi động",x:110,y:220,w:130},{i:"chk",l:"Platform.isIOS ?",x:330,y:220,k:"gold",w:180},
     {i:"mf",l:"MaterialFactory",x:600,y:100,w:170,k:"green"},{i:"cf",l:"CupertinoFactory",x:600,y:340,w:180,k:"accent"}],
  e:[{f:"app",t:"chk",flow:1,seq:0},{f:"chk",t:"mf",l:"Android",flow:1,seq:1,k:"green"},{f:"chk",t:"cf",l:"iOS",flow:1,seq:1,k:"accent"}],
  code:`const factory: GUIFactory = Platform.isIOS
  ? new CupertinoFactory()
  : new MaterialFactory();

function buildLogin(f: GUIFactory) {
  return [f.createButton(), f.createCheckbox()];
}
buildLogin(factory);`}
 ]},

/* ============ PROTOTYPE ============ */
{id:"prototype", g:"Creational", t:"Prototype",
 tag:"Tạo đối tượng mới bằng cách sao chép (clone) một đối tượng có sẵn, thay vì dựng lại từ đầu.",
 when:["Khởi tạo tốn kém, cần nhiều bản giống nhau","Muốn sao chép mà không phụ thuộc class cụ thể"],
 avoid:["Đối tượng có tham chiếu vòng, khó deep-copy"],
 steps:[
 {t:"Vấn đề: copy từ bên ngoài",
  p:["Muốn tạo bản sao của một <code>Shape</code>, ta phải biết class của nó và đọc từng field. Nhưng có những field <code>private</code> mà bên ngoài không đọc được.","Ngoài ra, code copy còn bị gắn chặt vào class cụ thể."],
  n:[{i:"cl",l:"Client",x:140,y:220},{i:"o",l:"Circle",s:"🔒 private fields",x:450,y:220,k:"warn",w:170},{i:"cp",l:"Bản sao ?",x:690,y:220,k:"muted",w:130}],
  e:[{f:"cl",t:"o",l:"đọc từng field…",flow:1,k:"warn"},{f:"o",t:"cp",dash:1}],
  code:`const copy = new Circle();
copy.x = circle.x;
copy.radius = circle.radius;
copy.secret = circle.secret; // ❌ private`},
 {t:"Đối tượng tự clone()",
  p:["Mỗi đối tượng tự cài phương thức <code>clone()</code>. Vì nằm bên trong class, nó truy cập được mọi field.","Client chỉ cần gọi <code>shape.clone()</code>, không cần biết đó là Circle hay Rectangle."],
  n:[{i:"cl",l:"Client",x:120,y:220,w:120},{i:"o",l:"Circle",s:"clone()",x:360,y:220,k:"accent"},
     {i:"c1",l:"Circle (copy)",s:"x=10, r=5",x:640,y:110,k:"green",w:170},{i:"c2",l:"Circle (copy)",s:"x=10, r=5",x:640,y:330,k:"green",w:170}],
  e:[{f:"cl",t:"o",l:"clone()",flow:1,seq:0},{f:"o",t:"c1",flow:1,seq:1,k:"green"},{f:"o",t:"c2",flow:1,seq:1,k:"green"}],
  code:`interface Prototype<T> { clone(): T; }

class Circle implements Prototype<Circle> {
  constructor(public x: number, private radius: number) {}
  clone() { return new Circle(this.x, this.radius); }
}

const a = new Circle(10, 5);
const b = a.clone();   // độc lập với a`},
 {t:"Sao chép rồi chỉnh",
  p:["Trên mobile, cách dùng phổ biến nhất là <b>copy-and-modify</b> với state bất biến: giữ nguyên bản cũ, tạo bản mới chỉ khác vài trường.","Kotlin có <code>data class.copy()</code>, Dart có <code>copyWith()</code>, còn struct trong Swift tự sao chép khi gán."],
  n:[{i:"o",l:"UiState",s:"loading=true, items=[]",x:200,y:220,k:"blue",w:230},{i:"c1",l:"UiState",s:"loading=false, items=[…]",x:590,y:220,k:"green",w:240}],
  e:[{f:"o",t:"c1",l:"copy(loading = false)",flow:1,k:"green"}],
  code:`// Kotlin
val next = state.copy(loading = false, items = data)

// Dart / Flutter
final next = state.copyWith(loading: false, items: data);`}
 ]},

/* ============ BRIDGE ============ */
{id:"bridge", g:"Structural", t:"Bridge",
 tag:"Tách một class lớn thành hai tầng (abstraction và implementation) có thể phát triển độc lập.",
 when:["Class phát triển theo hai chiều độc lập","Cần đổi implementation lúc runtime"],
 avoid:["Chỉ có một chiều biến đổi: thêm tầng là thừa"],
 steps:[
 {t:"Vấn đề: nhân chéo lớp con",
  p:["<code>Shape</code> có hai chiều biến đổi: hình dạng (Circle, Square) và màu (Red, Blue). Kế thừa theo cả hai chiều sinh ra RedCircle, BlueCircle, RedSquare…","Thêm một màu nữa là phải thêm một lớp con cho mỗi hình."],
  n:[{i:"sh",l:"Shape",x:400,y:70,k:"blue"},{i:"c",l:"Circle",x:220,y:190},{i:"s",l:"Square",x:580,y:190},
     {i:"rc",l:"RedCircle",x:110,y:350,k:"warn",w:135},{i:"bc",l:"BlueCircle",x:300,y:350,k:"warn",w:140},{i:"rs",l:"RedSquare",x:500,y:350,k:"warn",w:135},{i:"bs",l:"BlueSquare",x:690,y:350,k:"warn",w:140}],
  e:[{f:"c",t:"sh",dash:1},{f:"s",t:"sh",dash:1},{f:"rc",t:"c",dash:1,k:"warn"},{f:"bc",t:"c",dash:1,k:"warn"},{f:"rs",t:"s",dash:1,k:"warn"},{f:"bs",t:"s",dash:1,k:"warn"}],
  code:`class RedCircle extends Circle {}
class BlueCircle extends Circle {}
class RedSquare extends Square {}
class BlueSquare extends Square {}
// thêm Green → +2 lớp, thêm Triangle → +3 lớp…`},
 {t:"Bắc cầu bằng composition",
  p:["Ta tách thành hai tầng. <b>Abstraction</b> (Remote) giữ tham chiếu tới <b>Implementation</b> (Device) và ủy quyền công việc cho nó.","Hai tầng phát triển độc lập: thêm loại remote không đụng tới thiết bị, thêm thiết bị không đụng tới remote."],
  n:[{i:"rm",l:"Remote",s:"device: Device",x:180,y:120,k:"accent",w:170},{i:"adv",l:"AdvancedRemote",s:"mute()",x:180,y:320,k:"accent",w:170},
     {i:"dv",l:"«Device»",s:"on() · setVolume()",x:580,y:120,k:"blue",w:190},{i:"tv",l:"TV",x:490,y:320,w:120},{i:"rd",l:"Radio",x:670,y:320,w:120}],
  e:[{f:"rm",t:"dv",l:"bridge",flow:1,k:"accent"},{f:"adv",t:"rm",l:"extends",dash:1},{f:"tv",t:"dv",dash:1},{f:"rd",t:"dv",dash:1}],
  code:`interface Device { on(): void; setVolume(v: number): void; }

class Remote {
  constructor(protected device: Device) {}
  power()  { this.device.on(); }
}
class AdvancedRemote extends Remote {
  mute() { this.device.setVolume(0); }
}

new AdvancedRemote(new TV()).mute();
new AdvancedRemote(new Radio()).mute();`}
 ]},

/* ============ COMPOSITE ============ */
{id:"composite", g:"Structural", t:"Composite",
 tag:"Gom các đối tượng thành cấu trúc cây và xử lý từng phần tử lẫn cả nhóm theo cùng một cách.",
 when:["Dữ liệu có dạng cây: thư mục, menu, UI","Muốn client không phân biệt phần tử đơn và nhóm"],
 avoid:["Cấu trúc phẳng, không lồng nhau"],
 steps:[
 {t:"Vấn đề: cây lồng nhau",
  p:["Một đơn hàng gồm các hộp. Mỗi hộp có thể chứa sản phẩm hoặc hộp nhỏ hơn. Muốn tính tổng tiền, ta phải mở từng hộp và kiểm tra kiểu từng thứ bên trong.","Code đầy <code>instanceof</code> và đệ quy viết tay."],
  n:[{i:"r",l:"📦 Hộp lớn",x:400,y:60,k:"accent"},{i:"b",l:"📦 Hộp nhỏ",x:220,y:200,k:"accent"},{i:"p1",l:"📱 Điện thoại",x:590,y:200,k:"green",w:170},
     {i:"p2",l:"🎧 Tai nghe",x:120,y:350,k:"green"},{i:"p3",l:"🔌 Sạc",x:330,y:350,k:"green"}],
  e:[{f:"r",t:"b",dash:1},{f:"r",t:"p1",dash:1},{f:"b",t:"p2",dash:1},{f:"b",t:"p3",dash:1}],
  code:`function total(item) {
  if (item instanceof Product) return item.price;
  if (item instanceof Box) { /* lặp + đệ quy… */ }
}`},
 {t:"Cùng một interface",
  p:["Cả <code>Product</code> (lá) và <code>Box</code> (nhánh) đều implement <code>getPrice()</code>.","Box chỉ việc hỏi các con của nó rồi cộng lại. Lời gọi đi xuống cây, kết quả cộng dồn đi lên."],
  n:[{i:"r",l:"📦 Hộp lớn",s:"= $600",x:400,y:60,k:"accent"},{i:"b",l:"📦 Hộp nhỏ",s:"= $100",x:220,y:200,k:"accent"},{i:"p1",l:"📱 Điện thoại",s:"$500",x:590,y:200,k:"green",w:170},
     {i:"p2",l:"🎧 Tai nghe",s:"$80",x:120,y:350,k:"green"},{i:"p3",l:"🔌 Sạc",s:"$20",x:330,y:350,k:"green"}],
  e:[{f:"r",t:"b",l:"getPrice()",flow:1,seq:0},{f:"r",t:"p1",l:"getPrice()",flow:1,seq:0},{f:"b",t:"p2",flow:1,seq:1},{f:"b",t:"p3",flow:1,seq:1}],
  code:`interface Item { getPrice(): number; }

class Product implements Item {
  constructor(private price: number) {}
  getPrice() { return this.price; }
}

class Box implements Item {
  children: Item[] = [];
  add(i: Item) { this.children.push(i); return this; }
  getPrice() {
    return this.children.reduce((s, c) => s + c.getPrice(), 0);
  }
}`},
 {t:"Cây giao diện chính là Composite",
  p:["Mọi UI framework trên mobile đều dựng theo kiểu này: một <code>Column</code> chứa nhiều <code>Widget</code>, một <code>ViewGroup</code> chứa nhiều <code>View</code>.","Gọi <code>measure()</code> hay <code>draw()</code> ở gốc là lời gọi tự lan xuống toàn bộ cây."],
  n:[{i:"r",l:"Scaffold",x:400,y:60,k:"blue"},{i:"b",l:"Column",x:220,y:200,k:"blue"},{i:"p1",l:"AppBar",x:590,y:200,w:150},
     {i:"p2",l:"Text",x:120,y:350,w:120},{i:"p3",l:"Button",x:330,y:350,w:120}],
  e:[{f:"r",t:"b",l:"build()",flow:1,seq:0,k:"blue"},{f:"r",t:"p1",flow:1,seq:0,k:"blue"},{f:"b",t:"p2",flow:1,seq:1,k:"blue"},{f:"b",t:"p3",flow:1,seq:1,k:"blue"}],
  code:`// Flutter
Scaffold(
  appBar: AppBar(title: Text("Giỏ hàng")),
  body: Column(children: [
    Text("Tổng: $600"),
    ElevatedButton(onPressed: pay, child: Text("Thanh toán")),
  ]),
);`}
 ]},

/* ============ FLYWEIGHT ============ */
{id:"flyweight", g:"Structural", t:"Flyweight",
 tag:"Tiết kiệm RAM bằng cách chia sẻ phần trạng thái chung giữa rất nhiều đối tượng, thay vì mỗi đối tượng giữ một bản riêng.",
 when:["Có hàng nghìn đến hàng triệu đối tượng giống nhau","RAM là nút thắt cổ chai"],
 avoid:["Số lượng đối tượng ít: chỉ thêm phức tạp"],
 steps:[
 {t:"Vấn đề: hết RAM",
  p:["Game bắn hạt có hàng nghìn viên đạn. Mỗi viên tự giữ một sprite 20KB, cùng với tọa độ và vận tốc của nó.","10.000 viên × 20KB = 200MB chỉ để lưu <b>cùng một hình ảnh</b> lặp đi lặp lại."],
  n:[{i:"a",l:"Particle",s:"sprite 20KB · x,y",x:150,y:90,k:"warn",w:180},{i:"b",l:"Particle",s:"sprite 20KB · x,y",x:150,y:220,k:"warn",w:180},{i:"c",l:"Particle",s:"sprite 20KB · x,y",x:150,y:350,k:"warn",w:180},
     {i:"ram",l:"💥 RAM: 200MB",x:600,y:220,k:"warn",w:180}],
  e:[{f:"a",t:"ram",flow:1,k:"warn"},{f:"b",t:"ram",flow:1,k:"warn"},{f:"c",t:"ram",flow:1,k:"warn"}],
  code:`class Particle {
  x = 0; y = 0; speed = 0;
  sprite = loadImage("bullet.png"); // 20KB × 10.000 😱
}`},
 {t:"Tách phần dùng chung",
  p:["Chia trạng thái làm hai loại. <b>Intrinsic</b> là phần giống nhau (sprite, màu), lưu một lần trong flyweight. <b>Extrinsic</b> là phần riêng của từng viên (x, y, speed).","Một nghìn viên đạn giờ chỉ trỏ tới một <code>ParticleType</code> dùng chung."],
  n:[{i:"a",l:"Particle",s:"x,y,speed",x:150,y:90,w:150},{i:"b",l:"Particle",s:"x,y,speed",x:150,y:220,w:150},{i:"c",l:"Particle",s:"x,y,speed",x:150,y:350,w:150},
     {i:"ram",l:"ParticleType",s:"sprite 20KB · dùng chung",x:540,y:220,k:"green",w:230}],
  e:[{f:"a",t:"ram",l:"type",flow:1,k:"green"},{f:"b",t:"ram",flow:1,k:"green"},{f:"c",t:"ram",flow:1,k:"green"}],
  code:`class ParticleType {               // flyweight
  constructor(readonly sprite: Image, readonly color: string) {}
}
class Particle {
  constructor(public x: number, public y: number,
              readonly type: ParticleType) {}
}`},
 {t:"Factory giữ cache",
  p:["<code>FlyweightFactory</code> trả lại flyweight có sẵn nếu đã từng tạo, chỉ tạo mới khi chưa có.","Ý tưởng chia sẻ và tái sử dụng này cũng có trên mobile: <b>bitmap pool</b> trong Glide, cache ảnh, hay <code>const</code> widget trong Flutter."],
  n:[{i:"a",l:"Game",x:120,y:220,w:120},{i:"f",l:"TypeFactory",s:"Map<key, Type>",x:370,y:220,k:"accent",w:180},
     {i:"ram",l:"ParticleType",s:"đã có → trả lại",x:640,y:110,k:"green",w:180},{i:"n",l:"new ParticleType",s:"chưa có → tạo",x:640,y:330,k:"blue",w:180}],
  e:[{f:"a",t:"f",l:"get(\"bullet\")",flow:1,seq:0},{f:"f",t:"ram",l:"hit",flow:1,seq:1,k:"green"},{f:"f",t:"n",l:"miss",dash:1,flow:1,seq:2,k:"blue"}],
  code:`class TypeFactory {
  private cache = new Map<string, ParticleType>();
  get(key: string) {
    if (!this.cache.has(key))
      this.cache.set(key, new ParticleType(load(key), "red"));
    return this.cache.get(key)!;
  }
}`}
 ]},

/* ============ CHAIN OF RESPONSIBILITY ============ */
{id:"chain-of-responsibility", g:"Behavioral", t:"Chain of Responsibility",
 tag:"Chuyển yêu cầu dọc theo một chuỗi handler. Mỗi handler quyết định tự xử lý hoặc chuyển tiếp cho handler kế tiếp.",
 when:["Nhiều bước kiểm tra/xử lý nối tiếp","Muốn thêm/bớt/đổi thứ tự bước dễ dàng"],
 avoid:["Chuỗi quá dài, khó biết request dừng ở đâu"],
 steps:[
 {t:"Vấn đề: một hàm kiểm tra mọi thứ",
  p:["Trước khi gửi request, ta cần thêm token, ghi log, kiểm tra cache, retry khi lỗi… Tất cả dồn vào một hàm <code>send()</code> dài hàng trăm dòng.","Muốn bỏ hoặc đổi thứ tự một bước là phải sửa trong cái hàm khổng lồ đó."],
  n:[{i:"rq",l:"Request",x:130,y:220},{i:"big",l:"send()",s:"auth + log + cache + retry + …",x:500,y:220,k:"warn",w:300}],
  e:[{f:"rq",t:"big",flow:1,k:"warn"}],
  code:`async function send(req) {
  if (!token) { /* … */ }
  log(req);
  if (cache.has(req)) { /* … */ }
  for (let i = 0; i < 3; i++) { /* retry … */ }
  // 300 dòng nữa…
}`},
 {t:"Xếp thành chuỗi",
  p:["Mỗi bước là một handler riêng, giữ tham chiếu tới handler kế tiếp. Request đi lần lượt qua từng mắt xích.","Đây chính xác là cách <b>OkHttp Interceptor</b> và <b>Dio interceptor</b> hoạt động."],
  n:[{i:"rq",l:"Request",x:100,y:110,w:120},{i:"h1",l:"AuthInterceptor",x:340,y:110,k:"blue",w:165},{i:"h2",l:"LogInterceptor",x:600,y:110,k:"blue",w:160},{i:"h3",l:"CacheInterceptor",x:600,y:300,k:"blue",w:170},
     {i:"net",l:"🌐 Network",x:280,y:330,k:"green",w:140}],
  e:[{f:"rq",t:"h1",flow:1,seq:0},{f:"h1",t:"h2",l:"next",flow:1,seq:1,k:"blue"},{f:"h2",t:"h3",l:"next",flow:1,seq:2,k:"blue"},{f:"h3",t:"net",l:"proceed",flow:1,seq:3,k:"green"}],
  code:`abstract class Handler {
  next?: Handler;
  setNext(h: Handler) { this.next = h; return h; }
  handle(req: Req): Res { return this.next!.handle(req); }
}

class AuthHandler extends Handler {
  handle(req) {
    req.headers.auth = token;
    return super.handle(req);     // chuyển tiếp
  }
}

auth.setNext(log).setNext(cache).setNext(network);`},
 {t:"Dừng giữa chừng",
  p:["Handler nào cũng có quyền <b>cắt ngang chuỗi</b>. Ví dụ CacheInterceptor có sẵn dữ liệu thì trả về luôn, không gọi mạng nữa.","Trên mobile còn gặp pattern này ở responder chain của iOS, ở cách sự kiện chạm được chuyển qua các ViewGroup trên Android, và ở middleware."],
  n:[{i:"rq",l:"Request",x:100,y:110,w:120},{i:"h1",l:"AuthInterceptor",x:340,y:110,k:"blue",w:165},{i:"h2",l:"LogInterceptor",x:600,y:110,k:"blue",w:160},{i:"h3",l:"CacheInterceptor",s:"cache hit ✓",x:600,y:300,k:"green",w:170},
     {i:"net",l:"🌐 Network",s:"không cần gọi",x:280,y:330,k:"muted",w:150}],
  e:[{f:"rq",t:"h1",flow:1,seq:0},{f:"h1",t:"h2",flow:1,seq:1,k:"blue"},{f:"h2",t:"h3",flow:1,seq:2,k:"blue"},{f:"h3",t:"rq",l:"Response (cache)",flow:1,seq:3,b:40,k:"green"},{f:"h3",t:"net",dash:1}],
  code:`// OkHttp (Kotlin)
class CacheInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    cache[chain.request()]?.let { return it }  // dừng chuỗi
    return chain.proceed(chain.request())       // chuyển tiếp
  }
}`}
 ]},

/* ============ ITERATOR ============ */
{id:"iterator", g:"Behavioral", t:"Iterator",
 tag:"Duyệt qua các phần tử của một tập hợp mà không cần biết cấu trúc bên trong của nó (list, cây, đồ thị…).",
 when:["Collection có cấu trúc phức tạp","Cần nhiều cách duyệt khác nhau"],
 avoid:["Mảng đơn giản: for…of có sẵn là đủ"],
 steps:[
 {t:"Vấn đề: mỗi collection một kiểu duyệt",
  p:["Duyệt mảng thì dùng chỉ số, duyệt cây thì đệ quy, duyệt dữ liệu phân trang thì phải gọi API từng trang.","Client phải biết cấu trúc bên trong của từng loại."],
  n:[{i:"cl",l:"Client",x:140,y:220},{i:"a",l:"Array",s:"for i = 0…",x:580,y:90,k:"muted"},{i:"t",l:"Tree",s:"đệ quy DFS",x:580,y:220,k:"muted"},{i:"pg",l:"PagedAPI",s:"page=1,2,3…",x:580,y:350,k:"muted"}],
  e:[{f:"cl",t:"a",flow:1,k:"warn"},{f:"cl",t:"t",flow:1,k:"warn"},{f:"cl",t:"pg",flow:1,k:"warn"}],
  code:`for (let i = 0; i < arr.length; i++) …
function walk(node) { …; node.children.forEach(walk); }
let page = 1; while (hasMore) { await fetch(page++); … }`},
 {t:"Một interface duyệt chung",
  p:["Mỗi collection cung cấp một iterator có <code>next()</code> và <code>hasNext()</code>. Iterator giữ vị trí hiện tại, còn client chỉ việc lặp.","JavaScript, Kotlin, Swift và Dart đều có sẵn giao thức này. Đó là lý do <code>for…in</code> chạy được trên mọi kiểu tập hợp."],
  n:[{i:"cl",l:"Client",s:"for (x of coll)",x:130,y:220,w:160},{i:"it",l:"«Iterator»",s:"next() · hasNext()",x:400,y:220,k:"accent",w:180},
     {i:"a",l:"ArrayIterator",x:660,y:90,w:160},{i:"t",l:"TreeIterator",x:660,y:220,w:160},{i:"pg",l:"PageIterator",x:660,y:350,w:160}],
  e:[{f:"cl",t:"it",l:"next()",flow:1,k:"accent"},{f:"a",t:"it",dash:1},{f:"t",t:"it",dash:1},{f:"pg",t:"it",dash:1}],
  code:`class Tree implements Iterable<Node> {
  *[Symbol.iterator]() {            // generator = iterator
    yield this.root;
    for (const c of this.children) yield* c;
  }
}

for (const node of tree) console.log(node);

// tải phân trang như một iterator bất đồng bộ
async function* pages() {
  let p = 1;
  while (true) { const d = await api(p++); if (!d.length) return; yield* d; }
}`}
 ]},

/* ============ MEDIATOR ============ */
{id:"mediator", g:"Behavioral", t:"Mediator",
 tag:"Giảm sự phụ thuộc chằng chịt giữa các đối tượng bằng cách để chúng chỉ giao tiếp qua một đối tượng trung gian.",
 when:["Nhiều component phụ thuộc lẫn nhau","Muốn tái sử dụng component ở nơi khác"],
 avoid:["Mediator phình to thành god object"],
 steps:[
 {t:"Vấn đề: mạng nhện phụ thuộc",
  p:["Trong form đăng ký: tick “Có thú cưng” thì hiện ô nhập tên thú cưng, nhập đủ thông tin thì bật nút Submit, bấm Submit thì mở dialog…","Component nào cũng tham chiếu tới các component khác, nên không thể đem dùng lại ở chỗ khác."],
  n:[{i:"a",l:"☑ Checkbox",x:170,y:90},{i:"b",l:"TextField",x:630,y:90},{i:"c",l:"Nút Submit",x:170,y:350},{i:"d",l:"Dialog",x:630,y:350}],
  e:[{f:"a",t:"b",k:"warn",flow:1},{f:"a",t:"c",k:"warn",flow:1},{f:"b",t:"c",k:"warn",flow:1},{f:"c",t:"d",k:"warn",flow:1},{f:"b",t:"d",k:"warn",flow:1,b:30},{f:"d",t:"a",k:"warn",flow:1,b:30}],
  code:`checkbox.onChange = () => {
  textField.visible = checkbox.checked;
  submit.enabled = validate(textField);
  dialog.reset();   // 😵 ai cũng biết ai
};`},
 {t:"Mọi đường đi qua trung gian",
  p:["Các component chỉ báo cho mediator rằng “tôi vừa thay đổi”. Mediator quyết định ai cần phản ứng và phản ứng thế nào.","Trên mobile, vai trò này thường do <b>ViewModel</b>, <b>Coordinator</b> (iOS) hoặc <b>Bloc</b> đảm nhận: các View không nói chuyện trực tiếp với nhau."],
  n:[{i:"a",l:"☑ Checkbox",x:170,y:90},{i:"b",l:"TextField",x:630,y:90},{i:"c",l:"Nút Submit",x:170,y:350},{i:"d",l:"Dialog",x:630,y:350},
     {i:"m",l:"FormMediator",s:"ViewModel",x:400,y:220,k:"accent",w:170}],
  e:[{f:"a",t:"m",l:"notify(checked)",flow:1,seq:0},{f:"m",t:"b",l:"show()",flow:1,seq:1,k:"accent"},{f:"m",t:"c",l:"enable()",flow:1,seq:1,k:"accent"},{f:"d",t:"m",dash:1}],
  code:`class FormMediator {
  constructor(private cb: Checkbox, private tf: TextField,
              private btn: Button) {
    cb.onChange = () => this.notify("checked");
  }
  notify(event: string) {
    if (event === "checked") {
      this.tf.visible = this.cb.checked;
      this.btn.enabled = this.tf.valid;
    }
  }
}`}
 ]},

/* ============ MEMENTO ============ */
{id:"memento", g:"Behavioral", t:"Memento",
 tag:"Lưu và khôi phục trạng thái trước đó của một đối tượng mà không làm lộ chi tiết bên trong của nó.",
 when:["Undo, snapshot, lưu nháp","Khôi phục trạng thái sau khi bị hủy (xoay màn hình, app bị kill)"],
 avoid:["Snapshot quá lớn hoặc tạo quá thường xuyên"],
 steps:[
 {t:"Vấn đề: muốn lưu nhưng không được nhìn",
  p:["Để làm Undo, ta cần chụp lại trạng thái của Editor. Nhưng nếu lớp History đọc thẳng các field private của Editor thì phá vỡ tính đóng gói.","Editor đổi cấu trúc bên trong là History cũng phải sửa theo."],
  n:[{i:"ed",l:"Editor",s:"🔒 text, cursor, style",x:200,y:220,k:"accent",w:200},{i:"hs",l:"History",x:600,y:220,k:"warn"}],
  e:[{f:"hs",t:"ed",l:"đọc field private ✕",dash:1,k:"warn"}],
  code:`history.push({
  text: editor.text,
  cursor: editor.cursor,   // ❌ lộ chi tiết bên trong
  style: editor.style,
});`},
 {t:"Snapshot đóng gói",
  p:["<b>Originator</b> (Editor) tự tạo <b>Memento</b>, một snapshot bất biến của chính nó. <b>Caretaker</b> (History) cất giữ snapshot đó mà không đọc nội dung bên trong.","Khi cần, ta đưa memento lại cho Editor để nó tự khôi phục."],
  n:[{i:"ed",l:"Editor",s:"originator",x:150,y:220,k:"accent"},{i:"mm",l:"Snapshot",s:"memento · bất biến",x:420,y:90,k:"gold",w:180},{i:"hs",l:"History",s:"caretaker",x:660,y:220,k:"green"}],
  e:[{f:"ed",t:"mm",l:"save()",flow:1,seq:0,k:"gold"},{f:"mm",t:"hs",l:"push",flow:1,seq:1,k:"green"},{f:"hs",t:"ed",l:"restore(snapshot)",flow:1,seq:2,b:-70,k:"accent"}],
  code:`class Editor {
  private text = ""; private cursor = 0;
  save()              { return new Snapshot(this.text, this.cursor); }
  restore(s: Snapshot) { this.text = s.text; this.cursor = s.cursor; }
}

class Snapshot {
  constructor(readonly text: string, readonly cursor: number) {}
}

const history: Snapshot[] = [];
history.push(editor.save());
editor.restore(history.pop()!);`},
 {t:"Trên mobile: sống sót qua xoay màn hình",
  p:["Android có thể hủy Activity bất cứ lúc nào (xoay màn hình, thiếu RAM). <code>onSaveInstanceState</code> và <code>SavedStateHandle</code> chính là Memento: app gói trạng thái lại, hệ điều hành cất giữ, rồi trả về khi màn hình được tạo lại.","iOS có State Restoration, Flutter có <code>RestorationMixin</code>."],
  n:[{i:"ed",l:"Activity",s:"originator",x:150,y:220,k:"accent"},{i:"mm",l:"Bundle",s:"memento",x:420,y:90,k:"gold",w:160},{i:"hs",l:"Android OS",s:"caretaker",x:660,y:220,k:"green"}],
  e:[{f:"ed",t:"mm",l:"onSaveInstanceState",flow:1,seq:0,k:"gold"},{f:"mm",t:"hs",flow:1,seq:1,k:"green"},{f:"hs",t:"ed",l:"onCreate(savedState)",flow:1,seq:2,b:-70,k:"accent"}],
  code:`// Kotlin
class SearchViewModel(private val state: SavedStateHandle) : ViewModel() {
  var query: String
    get() = state["query"] ?: ""
    set(v) { state["query"] = v }   // tự lưu & khôi phục
}`}
 ]},

/* ============ TEMPLATE METHOD ============ */
{id:"template-method", g:"Behavioral", t:"Template Method",
 tag:"Định nghĩa khung của một thuật toán ở lớp cha, để lớp con tùy chỉnh vài bước mà không thay đổi cấu trúc chung.",
 when:["Nhiều class có quy trình giống nhau, khác vài bước","Framework muốn cho người dùng “móc” vào vòng đời"],
 avoid:["Lớp con cần thay đổi cả thứ tự các bước"],
 steps:[
 {t:"Vấn đề: code trùng lặp",
  p:["<code>PdfMiner</code> và <code>CsvMiner</code> đều làm các bước: mở file → trích dữ liệu → phân tích → báo cáo. Chỉ hai bước đầu là thật sự khác nhau.","Khoảng 80% code bị chép qua chép lại giữa hai class."],
  n:[{i:"pdf",l:"PdfMiner",x:150,y:110,k:"warn"},{i:"csv",l:"CsvMiner",x:150,y:330,k:"warn"},
     {i:"d1",l:"open → extract → analyze → report",x:520,y:110,k:"muted",w:330},{i:"d2",l:"open → extract → analyze → report",x:520,y:330,k:"muted",w:330}],
  e:[{f:"pdf",t:"d1",flow:1,k:"warn"},{f:"csv",t:"d2",flow:1,k:"warn"},{f:"d1",t:"d2",l:"trùng 80%",dash:1,k:"warn"}],
  code:`class PdfMiner { mine() { openPdf(); extract(); analyze(); report(); } }
class CsvMiner { mine() { openCsv(); extract(); analyze(); report(); } }
//                                    ^^^^^^^^^^^^^^^^^^^^ chép lại`},
 {t:"Khung cố định, bước tùy biến",
  p:["Lớp cha có <code>mine()</code> là <b>template method</b>: nó gọi các bước theo đúng thứ tự. Bước nào khác nhau thì để <code>abstract</code> cho lớp con viết.","Có thể thêm các <b>hook</b>, tức bước tùy chọn có sẵn cài đặt mặc định, để lớp con override nếu muốn."],
  n:[{i:"tm",l:"mine()",s:"template method",x:400,y:340,k:"blue",w:200},
     {i:"s1",l:"open()",s:"abstract",x:110,y:110,k:"accent",w:140},{i:"s2",l:"extract()",s:"abstract",x:300,y:110,k:"accent",w:140},{i:"s3",l:"analyze()",s:"dùng chung",x:490,y:110,w:140},{i:"s4",l:"report()",s:"hook",x:680,y:110,k:"gold",w:140}],
  e:[{f:"tm",t:"s1",flow:1,seq:0,k:"accent"},{f:"tm",t:"s2",flow:1,seq:1,k:"accent"},{f:"tm",t:"s3",flow:1,seq:2},{f:"tm",t:"s4",flow:1,seq:3,k:"gold"}],
  code:`abstract class DataMiner {
  mine() {                       // template method
    const f = this.open();
    const raw = this.extract(f);
    const r = this.analyze(raw);
    this.report(r);
  }
  protected abstract open(): File;
  protected abstract extract(f: File): string[];
  protected analyze(raw: string[]) { /* dùng chung */ }
  protected report(r) {}         // hook: tùy chọn
}`},
 {t:"Vòng đời màn hình = Template Method",
  p:["Framework mobile gọi các bước theo thứ tự cố định, còn bạn override từng bước. Android có <code>onCreate → onStart → onResume</code>, iOS có <code>viewDidLoad → viewWillAppear</code>, Flutter có <code>initState → build → dispose</code>.","Bạn không gọi chúng: <b>framework gọi bạn</b>. Nguyên tắc này có tên là “Hollywood principle”."],
  n:[{i:"tm",l:"Android OS",s:"template method",x:400,y:340,k:"blue",w:200},
     {i:"s1",l:"onCreate()",x:110,y:110,k:"accent",w:140},{i:"s2",l:"onStart()",x:300,y:110,k:"accent",w:140},{i:"s3",l:"onResume()",x:490,y:110,k:"accent",w:140},{i:"s4",l:"onPause()",x:680,y:110,k:"gold",w:140}],
  e:[{f:"tm",t:"s1",flow:1,seq:0,k:"accent"},{f:"tm",t:"s2",flow:1,seq:1,k:"accent"},{f:"tm",t:"s3",flow:1,seq:2,k:"accent"},{f:"tm",t:"s4",flow:1,seq:3,k:"gold"}],
  code:`class ProfileActivity : AppCompatActivity() {
  override fun onCreate(saved: Bundle?) {
    super.onCreate(saved)          // khung của framework
    setContentView(R.layout.profile)
  }
  override fun onResume() {
    super.onResume()
    viewModel.refresh()
  }
}`}
 ]},

/* ============ VISITOR ============ */
{id:"visitor", g:"Behavioral", t:"Visitor",
 tag:"Tách thuật toán ra khỏi các đối tượng mà nó xử lý, để thêm thao tác mới mà không phải sửa các class đó.",
 when:["Cấu trúc ổn định nhưng thao tác hay thay đổi","Duyệt AST, export nhiều định dạng"],
 avoid:["Hay thêm loại node mới: phải sửa mọi visitor"],
 steps:[
 {t:"Vấn đề: không muốn sửa node",
  p:["Ta có một đồ thị địa điểm gồm City, Industry và Sightseeing. Sếp muốn thêm chức năng export ra XML, tuần sau lại là JSON.","Mỗi lần thêm thao tác lại phải sửa cả ba class vốn đang chạy ổn định."],
  n:[{i:"c",l:"City",x:150,y:90},{i:"i",l:"Industry",x:150,y:220},{i:"s",l:"Sightseeing",x:150,y:350},
     {i:"x",l:"+ exportXml()",x:560,y:150,k:"warn"},{i:"j",l:"+ exportJson()",x:560,y:290,k:"warn"}],
  e:[{f:"x",t:"c",dash:1,k:"warn"},{f:"x",t:"i",dash:1,k:"warn"},{f:"x",t:"s",dash:1,k:"warn"},{f:"j",t:"s",dash:1,k:"warn"}],
  code:`class City     { exportXml() {…} exportJson() {…} toCsv() {…} }
class Industry { exportXml() {…} exportJson() {…} toCsv() {…} }
// mỗi thao tác mới = sửa mọi class 😩`},
 {t:"Double dispatch",
  p:["Mỗi node chỉ cần một phương thức: <code>accept(visitor)</code>, trong đó nó gọi lại <code>visitor.visitCity(this)</code>.","Toàn bộ logic export nằm trong <code>XmlExportVisitor</code>. Muốn thêm JSON thì viết thêm một visitor mới, và các node không đổi."],
  n:[{i:"c",l:"City",s:"accept(v)",x:150,y:90},{i:"i",l:"Industry",s:"accept(v)",x:150,y:220},{i:"s",l:"Sightseeing",s:"accept(v)",x:150,y:350},
     {i:"x",l:"XmlExportVisitor",x:560,y:150,k:"accent",w:190},{i:"j",l:"JsonExportVisitor",s:"thêm mới",x:560,y:310,k:"green",w:190}],
  e:[{f:"c",t:"x",l:"visitCity(this)",flow:1,seq:0,k:"accent"},{f:"i",t:"x",l:"visitIndustry(this)",flow:1,seq:1,k:"accent"},{f:"s",t:"x",l:"visitSight(this)",flow:1,seq:2,k:"accent"},{f:"s",t:"j",dash:1,k:"green"}],
  code:`interface Visitor {
  visitCity(c: City): void;
  visitIndustry(i: Industry): void;
}

class City {
  accept(v: Visitor) { v.visitCity(this); }   // double dispatch
}

class XmlExportVisitor implements Visitor {
  visitCity(c)     { out += "<city>" + c.name + "</city>"; }
  visitIndustry(i) { /* … */ }
}

nodes.forEach(n => n.accept(new XmlExportVisitor()));`}
 ]},

/* ============ INTERPRETER ============ */
{id:"interpreter", g:"Behavioral", t:"Interpreter",
 tag:"Biểu diễn ngữ pháp của một ngôn ngữ nhỏ dưới dạng cây đối tượng, và mỗi node tự biết cách diễn giải chính nó.",
 when:["Ngôn ngữ nhỏ, ngữ pháp đơn giản: rule, filter, công thức","Cần đánh giá biểu thức do người dùng nhập"],
 avoid:["Ngữ pháp phức tạp: dùng parser generator"],
 steps:[
 {t:"Từ chuỗi thành cây",
  p:["Ứng dụng có một ô cho người dùng nhập công thức như <code>1 + 2 * x</code>. Parser biến chuỗi đó thành một <b>cây cú pháp</b> (AST).","Mỗi loại node (Số, Biến, Cộng, Nhân) là một class."],
  n:[{i:"str",l:"\"1 + 2 * x\"",x:110,y:220,k:"note"},{i:"ps",l:"Parser",x:290,y:220,k:"blue",w:120},
     {i:"add",l:"Add (+)",x:560,y:70,k:"accent",w:120},{i:"n1",l:"Num 1",x:460,y:220,k:"green",w:110},{i:"mul",l:"Mul (×)",x:660,y:220,k:"accent",w:120},
     {i:"n2",l:"Num 2",x:590,y:370,k:"green",w:110},{i:"vx",l:"Var x",x:730,y:370,k:"gold",w:100}],
  e:[{f:"str",t:"ps",flow:1},{f:"ps",t:"add",flow:1,k:"blue"},{f:"add",t:"n1",dash:1},{f:"add",t:"mul",dash:1},{f:"mul",t:"n2",dash:1},{f:"mul",t:"vx",dash:1}],
  code:`// "1 + 2 * x" → cây:
new Add(
  new Num(1),
  new Mul(new Num(2), new Var("x"))
);`},
 {t:"Mỗi node tự interpret()",
  p:["Gọi <code>interpret(ctx)</code> ở gốc: node Add hỏi hai con, node Mul hỏi hai con, node Var tra giá trị trong context.","Với x = 5, kết quả đi ngược lên: 2 × 5 = 10, rồi 1 + 10 = <b>11</b>. Trên mobile, ý tưởng này xuất hiện trong rule engine, bộ lọc tìm kiếm, <code>NSPredicate</code> hay regex."],
  n:[{i:"ctx",l:"{ x: 5 }",x:110,y:70,k:"note"},
     {i:"add",l:"Add (+)",s:"= 11",x:560,y:70,k:"accent",w:120},{i:"n1",l:"Num 1",s:"= 1",x:460,y:220,k:"green",w:110},{i:"mul",l:"Mul (×)",s:"= 10",x:660,y:220,k:"accent",w:120},
     {i:"n2",l:"Num 2",s:"= 2",x:590,y:370,k:"green",w:110},{i:"vx",l:"Var x",s:"= 5",x:730,y:370,k:"gold",w:100}],
  e:[{f:"ctx",t:"add",l:"interpret(ctx)",flow:1,seq:0},{f:"add",t:"n1",flow:1,seq:1,k:"accent"},{f:"add",t:"mul",flow:1,seq:1,k:"accent"},{f:"mul",t:"n2",flow:1,seq:2,k:"accent"},{f:"mul",t:"vx",flow:1,seq:2,k:"gold"}],
  code:`interface Expr { interpret(ctx: Record<string, number>): number; }

class Num implements Expr {
  constructor(private v: number) {}
  interpret() { return this.v; }
}
class Var implements Expr {
  constructor(private name: string) {}
  interpret(ctx) { return ctx[this.name]; }
}
class Add implements Expr {
  constructor(private a: Expr, private b: Expr) {}
  interpret(ctx) { return this.a.interpret(ctx) + this.b.interpret(ctx); }
}

tree.interpret({ x: 5 }); // 11`}
 ]}
];

const MOB = {
 "observer":{t:1,why:"Nền tảng của mọi UI reactive",a:"LiveData, StateFlow, Compose State",i:"Combine, @Published, NotificationCenter",f:"Stream, ChangeNotifier, ValueNotifier"},
 "state":{t:1,why:"Màn hình nào cũng có Loading / Success / Error",a:"sealed class UiState { Loading, Success, Error }",i:"enum ViewState có associated values",f:"Bloc states, sealed class (Dart 3)"},
 "singleton":{t:1,why:"API client, database, DI container",a:"@Singleton trong Hilt/Koin cho Retrofit, Room",i:"URLSession.shared, UserDefaults.standard",f:"GetIt.registerSingleton"},
 "builder":{t:1,why:"Gặp ở khắp các SDK",a:"AlertDialog.Builder, NotificationCompat.Builder, Retrofit.Builder",i:"Chuỗi view modifier trong SwiftUI, URLComponents",f:"ThemeData(...), copyWith(), StringBuffer"},
 "adapter":{t:1,why:"Đổ dữ liệu vào list, map DTO → model",a:"RecyclerView.Adapter, mapper DTO → domain",i:"UITableViewDataSource, UIViewRepresentable",f:"fromJson mapper, PlatformView"},
 "facade":{t:1,why:"Repository: lõi của kiến trúc MVVM/Clean",a:"Repository gom Retrofit + Room + cache",i:"Service layer che URLSession + CoreData",f:"Repository bọc Dio + Hive / Firebase"},
 "strategy":{t:1,why:"Đổi hành vi không cần if/else",a:"Comparator, chiến lược đăng nhập Google/Facebook",i:"Protocol + DI cho payment, cache policy",f:"Truyền hàm / abstract class cho payment"},
 "factory-method":{t:1,why:"Tạo ViewModel, Fragment, cell",a:"ViewModelProvider.Factory, Fragment.newInstance()",i:"dequeueReusableCell theo identifier",f:"factory User.fromJson(...)"},
 "decorator":{t:2,why:"Bọc thêm hành vi cho View/Widget",a:"Compose Modifier: .padding().background()",i:"SwiftUI ViewModifier",f:"Padding(child: DecoratedBox(...))"},
 "composite":{t:2,why:"Cây View / Widget",a:"ViewGroup chứa View, cây layout Compose",i:"UIView.subviews, cây view SwiftUI",f:"Widget tree: Column(children: [...])"},
 "chain-of-responsibility":{t:2,why:"Interceptor mạng, xử lý sự kiện chạm",a:"OkHttp Interceptor, touch dispatch qua ViewGroup",i:"UIResponder chain, URLProtocol",f:"Dio interceptors, gesture arena"},
 "proxy":{t:2,why:"Tải ảnh lazy + cache",a:"Glide/Coil, Retrofit tạo proxy cho interface API",i:"Kingfisher, SDWebImage, NSProxy",f:"cached_network_image, cache interceptor"},
 "command":{t:2,why:"Action/Intent trong MVI, Undo",a:"MVI Intent, WorkManager WorkRequest",i:"UndoManager, Action trong TCA",f:"Bloc Event, Shortcuts/Actions"},
 "template-method":{t:2,why:"Hiểu vòng đời màn hình",a:"onCreate → onStart → onResume",i:"viewDidLoad → viewWillAppear",f:"initState → build → dispose"},
 "mediator":{t:2,why:"Điều phối màn hình & điều hướng",a:"ViewModel dùng chung giữa Fragment, NavController",i:"Coordinator pattern",f:"Bloc / Provider điều phối nhiều widget"},
 "memento":{t:2,why:"Giữ state khi xoay màn hình / app bị kill",a:"onSaveInstanceState, SavedStateHandle",i:"State Restoration, Codable snapshot",f:"RestorationMixin, HydratedBloc"},
 "flyweight":{t:2,why:"Hiệu năng list dài, ảnh",a:"Tái sử dụng ViewHolder, bitmap pool của Glide",i:"dequeueReusableCell, image cache",f:"const widget dùng chung instance"},
 "abstract-factory":{t:2,why:"UI đa nền tảng / đa theme",a:"Material 3 vs Wear OS components",i:"ButtonStyle khác nhau theo nền tảng",f:"Material vs Cupertino widgets"},
 "prototype":{t:3,why:"Thường đã có sẵn trong ngôn ngữ",a:"data class copy()",i:"struct tự copy khi gán, NSCopying",f:"copyWith() trên state bất biến"},
 "iterator":{t:3,why:"Ngôn ngữ lo sẵn, hiểu để dùng Paging",a:"Iterator/Sequence, Paging 3",i:"IteratorProtocol, Sequence",f:"Iterable, sync*/async* generator"},
 "bridge":{t:3,why:"Dùng khi viết SDK / plugin đa nền tảng",a:"Abstraction player trên ExoPlayer",i:"Lớp trừu tượng trên nhiều engine render",f:"Platform channel: Dart API ↔ native"},
 "visitor":{t:3,why:"Chủ yếu trong tooling, code-gen",a:"KSP / annotation processor duyệt AST",i:"SwiftSyntax visitor",f:"analyzer AST visitor (build_runner)"},
 "interpreter":{t:3,why:"Ít gặp: rule engine, bộ lọc",a:"Deep-link rules, Regex",i:"NSPredicate, NSExpression",f:"Rule engine, intl message format"}
};

/* ===================== OOP & SOLID ===================== */
const P_OOP = [
/* ---------- CLASS & OBJECT ---------- */
{id:"class-object", g:"OOP", t:"Class & Object",
 tag:"Class là bản thiết kế, object là thực thể cụ thể được tạo ra từ bản thiết kế đó.",
 when:["Mô hình hóa thực thể trong app: User, Product, Order","Gom dữ liệu và hành vi liên quan vào một chỗ"],
 avoid:["Chỉ là dữ liệu thuần, không có hành vi: dùng data class / struct là đủ"],
 steps:[
 {t:"Bản thiết kế và ngôi nhà", tag:"KHÁI NIỆM",
  p:["<b>Class</b> mô tả một loại đối tượng gồm những dữ liệu nào (thuộc tính) và làm được gì (phương thức). Nó giống bản vẽ kiến trúc của một ngôi nhà.","<b>Object</b> là ngôi nhà thật được xây từ bản vẽ đó. Từ một class có thể tạo ra bao nhiêu object tùy ý bằng <code>new</code>."],
  key:"Mỗi object có dữ liệu (state) riêng, nhưng dùng chung hành vi (method) định nghĩa trong class.",
  n:[{i:"cls",l:"class User",s:"name · email · login()",x:210,y:220,k:"violet",w:240},
     {i:"o1",l:"user1",s:"name = \"An\"",x:600,y:90,k:"green"},{i:"o2",l:"user2",s:"name = \"Bình\"",x:600,y:220,k:"green"},{i:"o3",l:"user3",s:"name = \"Chi\"",x:600,y:350,k:"green"}],
  e:[{f:"cls",t:"o1",l:"new",flow:1,k:"violet"},{f:"cls",t:"o2",l:"new",flow:1,k:"violet"},{f:"cls",t:"o3",l:"new",flow:1,k:"violet"}],
  code:`class User {
  constructor(public name: string, public email: string) {}

  login() {
    console.log(this.name + " đã đăng nhập");
  }
}

const user1 = new User("An", "an@mail.com");
const user2 = new User("Bình", "binh@mail.com");`},
 {t:"Gọi phương thức trên object",
  p:["Code bên ngoài làm việc với object bằng cách <b>gọi phương thức</b> của nó: <code>user1.login()</code>.","Bên trong phương thức, <code>this</code> trỏ tới chính object đang được gọi. Vì vậy cùng hàm <code>login()</code> nhưng mỗi user in ra tên của mình."],
  key:"Object = dữ liệu + hành vi đi cùng nhau. Đó là ý tưởng cốt lõi của lập trình hướng đối tượng.",
  n:[{i:"ui",l:"Màn hình Login",x:130,y:220,w:170},{i:"o1",l:"user1",s:"this.name = \"An\"",x:400,y:220,k:"green",w:180},{i:"au",l:"AuthService",x:660,y:220,k:"blue"}],
  e:[{f:"ui",t:"o1",l:"user1.login()",flow:1,seq:0},{f:"o1",t:"au",l:"verify()",flow:1,seq:1,k:"green"}],
  code:`// Kotlin: data class cho dữ liệu, class cho hành vi
data class User(val name: String, val email: String)

class LoginViewModel(private val auth: AuthService) {
  fun login(user: User) = auth.verify(user)
}`}
 ]},

/* ---------- ENCAPSULATION ---------- */
{id:"encapsulation", g:"OOP", t:"Đóng gói (Encapsulation)",
 tag:"Giấu dữ liệu bên trong object, chỉ cho phép thay đổi qua những phương thức có kiểm soát.",
 when:["Dữ liệu có quy tắc phải luôn đúng (số dư ≥ 0, email hợp lệ)","State dùng chung giữa nhiều màn hình"],
 avoid:["Viết getter/setter máy móc cho mọi field: vẫn là lộ dữ liệu"],
 steps:[
 {t:"Ai cũng sửa được dữ liệu",
  p:["<code>BankAccount</code> để <code>balance</code> là public. Màn hình A gán thẳng <code>balance = -1000</code>, màn hình B cộng thêm một tỷ.","Không ai kiểm tra gì cả, và khi có bug thì không biết dữ liệu bị sửa ở đâu."],
  n:[{i:"a",l:"Màn hình A",x:150,y:110},{i:"b",l:"Màn hình B",x:150,y:330},{i:"acc",l:"BankAccount",s:"public balance",x:600,y:220,k:"warn",w:180}],
  e:[{f:"a",t:"acc",l:"balance = -1000",flow:1,k:"warn"},{f:"b",t:"acc",l:"balance += 1e9",flow:1,k:"warn"}],
  code:`class BankAccount {
  balance = 0;            // ai cũng sửa được 😬
}

account.balance = -1000;  // số dư âm?!`},
 {t:"Cửa ra vào có kiểm soát",
  p:["Đặt <code>balance</code> là <code>private</code>. Muốn thay đổi thì phải đi qua <code>deposit()</code> hoặc <code>withdraw()</code>, nơi có kiểm tra điều kiện.","Từ đó, quy tắc “số dư không bao giờ âm” được đảm bảo ở <b>một chỗ duy nhất</b>."],
  key:"Object tự bảo vệ các bất biến (invariant) của nó. Bên ngoài chỉ được yêu cầu, không được ra lệnh trực tiếp lên dữ liệu.",
  n:[{i:"a",l:"Màn hình A",x:120,y:110,w:150},{i:"b",l:"Màn hình B",x:120,y:330,w:150},
     {i:"g1",l:"deposit(amount)",s:"amount > 0 ?",x:390,y:110,k:"blue",w:180},{i:"g2",l:"withdraw(amount)",s:"amount ≤ balance ?",x:390,y:330,k:"blue",w:190},
     {i:"acc",l:"BankAccount",s:"🔒 private balance",x:660,y:220,k:"green",w:190}],
  e:[{f:"a",t:"g1",flow:1,seq:0},{f:"b",t:"g2",flow:1,seq:0},{f:"g1",t:"acc",l:"✓",flow:1,seq:1,k:"green"},{f:"g2",t:"acc",l:"✓",flow:1,seq:1,k:"green"}],
  code:`class BankAccount {
  private balance = 0;

  deposit(amount: number) {
    if (amount <= 0) throw new Error("Số tiền không hợp lệ");
    this.balance += amount;
  }
  withdraw(amount: number) {
    if (amount > this.balance) throw new Error("Không đủ số dư");
    this.balance -= amount;
  }
  getBalance() { return this.balance; }   // chỉ đọc
}`},
 {t:"Trên mobile: state chỉ đọc", tag:"THỰC TẾ",
  p:["Trong ViewModel, state được giữ ở biến private có thể sửa (<code>_state</code>). UI chỉ nhận một bản <b>chỉ đọc</b> (<code>state</code>).","Muốn thay đổi, UI phải gửi sự kiện như <code>onLoginClick()</code>. Nhờ vậy, chỉ ViewModel mới được quyết định state."],
  key:"Đây là lý do bạn thấy cặp _state / state ở khắp các dự án Android, iOS và Flutter.",
  n:[{i:"acc",l:"LoginViewModel",s:"🔒 _state (mutable)",x:220,y:220,k:"violet",w:220},{i:"ui",l:"LoginScreen",x:620,y:220,k:"blue",w:170}],
  e:[{f:"acc",t:"ui",l:"state (chỉ đọc)",flow:1,b:-50,k:"green"},{f:"ui",t:"acc",l:"onLoginClick()",flow:1,b:-50,k:"accent"}],
  code:`class LoginViewModel : ViewModel() {
  private val _state = MutableStateFlow(LoginState())
  val state: StateFlow<LoginState> = _state   // UI chỉ đọc

  fun onLoginClick() {
    _state.update { it.copy(loading = true) }
  }
}`}
 ]},

/* ---------- INHERITANCE ---------- */
{id:"inheritance", g:"OOP", t:"Kế thừa (Inheritance)",
 tag:"Lớp con nhận lại thuộc tính và hành vi của lớp cha, rồi mở rộng thêm hoặc ghi đè (override).",
 when:["Quan hệ “is-a” rõ ràng: Dog là một Animal","Framework yêu cầu: kế thừa Activity, ViewModel, StatelessWidget"],
 avoid:["Kế thừa chỉ để tái sử dụng vài hàm","Cây kế thừa sâu quá 2–3 tầng"],
 steps:[
 {t:"Code lặp lại giữa các class",
  p:["<code>Dog</code> và <code>Cat</code> đều có <code>name</code>, <code>eat()</code>, <code>sleep()</code> viết y hệt nhau. Chỉ <code>bark()</code> và <code>meow()</code> là khác.","Sửa một lỗi trong <code>eat()</code> là phải nhớ sửa ở cả hai nơi."],
  n:[{i:"dog",l:"Dog",s:"name · eat() · sleep() · bark()",x:260,y:120,k:"warn",w:300},{i:"cat",l:"Cat",s:"name · eat() · sleep() · meow()",x:260,y:320,k:"warn",w:300},{i:"nt",l:"trùng 70% 😩",x:620,y:220,k:"note"}],
  e:[{f:"dog",t:"cat",dash:1,k:"warn"},{f:"nt",t:"dog",dash:1,k:"muted"},{f:"nt",t:"cat",dash:1,k:"muted"}],
  code:`class Dog { name = ""; eat() {…} sleep() {…} bark() {…} }
class Cat { name = ""; eat() {…} sleep() {…} meow() {…} }`},
 {t:"Đưa phần chung lên lớp cha",
  p:["Tạo lớp cha <code>Animal</code> chứa phần chung. <code>Dog</code> và <code>Cat</code> dùng <code>extends Animal</code> để nhận lại toàn bộ, rồi chỉ viết thêm phần riêng.","Lớp con cũng có thể <b>override</b> để thay đổi hành vi của lớp cha, ví dụ Cat ngủ 16 tiếng."],
  key:"Kế thừa diễn tả quan hệ “is-a”: Dog là một Animal. Nếu câu đó nghe sai thì đừng dùng kế thừa.",
  n:[{i:"an",l:"Animal",s:"name · eat() · sleep()",x:400,y:80,k:"violet",w:240},{i:"dog",l:"Dog",s:"+ bark()",x:220,y:300,k:"green",w:170},{i:"cat",l:"Cat",s:"+ meow() · override sleep()",x:580,y:300,k:"green",w:250}],
  e:[{f:"dog",t:"an",l:"extends",dash:1,k:"violet"},{f:"cat",t:"an",l:"extends",dash:1,k:"violet"}],
  code:`class Animal {
  constructor(public name: string) {}
  eat()   { console.log(this.name + " ăn"); }
  sleep() { console.log("ngủ 8 tiếng"); }
}

class Dog extends Animal {
  bark() { console.log("Gâu!"); }
}

class Cat extends Animal {
  meow() { console.log("Meo!"); }
  override sleep() { console.log("ngủ 16 tiếng"); }
}`},
 {t:"Cái bẫy của cây kế thừa sâu", tag:"LƯU Ý",
  p:["Animal → Bird → FlyingBird… rồi đến <code>Penguin</code>: là chim nhưng không bay được. Lớp con bị ép nhận một hành vi sai.","Trên mobile hay gặp <code>BaseActivity</code> phình to dần vì mọi màn hình đều nhét logic chung vào đó."],
  key:"Ưu tiên composition (has-a) khi quan hệ không thật sự là “is-a”. Xem bài Composition.",
  n:[{i:"an",l:"Animal",x:130,y:80,k:"violet",w:140},{i:"bd",l:"Bird",s:"fly()",x:300,y:180,k:"violet",w:140},{i:"fb",l:"FlyingBird",x:470,y:280,k:"violet",w:150},{i:"pg",l:"Penguin",s:"fly() ✕ không bay được",x:650,y:380,k:"warn",w:220}],
  e:[{f:"bd",t:"an",dash:1},{f:"fb",t:"bd",dash:1},{f:"pg",t:"fb",dash:1,k:"warn"}],
  code:`class Penguin extends Bird {
  override fly() {
    throw new Error("Chim cánh cụt không bay!"); // 🚩 dấu hiệu thiết kế sai
  }
}`}
 ]},

/* ---------- POLYMORPHISM ---------- */
{id:"polymorphism", g:"OOP", t:"Đa hình (Polymorphism)",
 tag:"Cùng một lời gọi, nhưng mỗi object phản hồi theo cách riêng của nó.",
 when:["Xử lý nhiều loại đối tượng theo cùng một cách","Thay chuỗi if/else hoặc switch theo “loại”"],
 avoid:["Chỉ có một loại và không có dấu hiệu mở rộng"],
 steps:[
 {t:"switch theo loại ở khắp nơi",
  p:["Hàm <code>calcArea()</code> phải kiểm tra từng loại hình: tròn thì dùng πr², chữ nhật thì dài × rộng…","Thêm hình tam giác là phải tìm và sửa mọi câu <code>switch</code> như vậy."],
  n:[{i:"fn",l:"calcArea(shape)",x:210,y:220,k:"warn",w:190},
     {i:"c",l:"if circle: πr²",x:590,y:90,k:"muted",w:180},{i:"r",l:"if rect: w × h",x:590,y:220,k:"muted",w:180},{i:"t",l:"if triangle: ???",x:590,y:350,k:"muted",w:180}],
  e:[{f:"fn",t:"c",flow:1,k:"warn"},{f:"fn",t:"r",flow:1,k:"warn"},{f:"fn",t:"t",flow:1,k:"warn"}],
  code:`function calcArea(s) {
  switch (s.type) {
    case "circle": return Math.PI * s.r * s.r;
    case "rect":   return s.w * s.h;
    // quên case mới = bug
  }
}`},
 {t:"Mỗi object tự biết cách làm",
  p:["Mỗi hình tự cài đặt phương thức <code>area()</code> của riêng nó. Vòng lặp chỉ gọi <code>shape.area()</code> mà không cần biết đó là hình gì.","Đây là đa hình lúc chạy (runtime), nhờ <b>override</b>. Còn <b>overload</b> (cùng tên, khác tham số) là đa hình lúc biên dịch."],
  key:"Viết code dựa trên interface chung, để mỗi object tự quyết định cách thực hiện.",
  n:[{i:"fn",l:"for (s of shapes)",s:"s.area()",x:160,y:220,k:"blue",w:190},{i:"if",l:"«Shape»",s:"area()",x:420,y:220,k:"violet",w:150},
     {i:"c",l:"Circle",s:"πr²",x:660,y:90,k:"green",w:150},{i:"r",l:"Rect",s:"w × h",x:660,y:220,k:"green",w:150},{i:"t",l:"Triangle",s:"½ × đáy × cao",x:660,y:350,k:"green",w:170}],
  e:[{f:"fn",t:"if",flow:1,seq:0,k:"blue"},{f:"if",t:"c",flow:1,seq:1,k:"green"},{f:"if",t:"r",flow:1,seq:1,k:"green"},{f:"if",t:"t",flow:1,seq:1,k:"green"}],
  code:`interface Shape { area(): number; }

class Circle implements Shape {
  constructor(private r: number) {}
  area() { return Math.PI * this.r ** 2; }
}
class Rect implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
}

const shapes: Shape[] = [new Circle(2), new Rect(3, 4)];
shapes.forEach(s => console.log(s.area()));   // đa hình`},
 {t:"Trên mobile: nhiều loại item trong một list", tag:"THỰC TẾ",
  p:["Feed tin tức có bài viết, quảng cáo, video. Mỗi loại item tự biết cách hiển thị (<code>render()</code>), và list chỉ việc gọi chung một hàm.","Trong Flutter, mọi Widget đều có <code>build()</code>. Framework gọi <code>build()</code> mà không cần biết đó là Text hay Image: đó là đa hình."],
  n:[{i:"fn",l:"FeedList",s:"item.render()",x:160,y:220,k:"blue",w:170},{i:"if",l:"«FeedItem»",s:"render()",x:420,y:220,k:"violet",w:150},
     {i:"c",l:"PostItem",x:660,y:90,k:"green",w:150},{i:"r",l:"AdItem",x:660,y:220,k:"gold",w:150},{i:"t",l:"VideoItem",x:660,y:350,k:"accent",w:150}],
  e:[{f:"fn",t:"if",flow:1,seq:0,k:"blue"},{f:"if",t:"c",flow:1,seq:1,k:"green"},{f:"if",t:"r",flow:1,seq:1,k:"gold"},{f:"if",t:"t",flow:1,seq:1,k:"accent"}],
  code:`// Kotlin + Compose
sealed interface FeedItem { @Composable fun Render() }

class PostItem(val text: String) : FeedItem {
  @Composable override fun Render() = Text(text)
}

LazyColumn { items(feed) { it.Render() } }`}
 ]},

/* ---------- ABSTRACTION ---------- */
{id:"abstraction", g:"OOP", t:"Trừu tượng (Abstraction)",
 tag:"Chỉ để lộ ra những gì cần dùng, và giấu sự phức tạp bên trong sau một interface đơn giản.",
 when:["Có nhiều cách triển khai cho cùng một việc","Muốn tách phần “dùng” khỏi phần “làm”"],
 avoid:["Tạo interface cho mọi thứ khi chỉ có đúng một triển khai"],
 steps:[
 {t:"Lái xe không cần biết động cơ", tag:"KHÁI NIỆM",
  p:["Tài xế chỉ cần biết <code>start()</code>, <code>accelerate()</code>, <code>brake()</code>. Bơm xăng, đánh lửa hay ABS hoạt động ra sao là việc bên trong xe.","Abstraction là <b>chọn ra những gì quan trọng</b> để lộ cho bên ngoài, còn encapsulation là <b>giấu</b> phần còn lại."],
  n:[{i:"dr",l:"🧑 Tài xế",x:110,y:220,k:"note"},{i:"api",l:"Car",s:"start() · brake()",x:350,y:220,k:"violet",w:190},
     {i:"h1",l:"Bơm xăng",x:640,y:90,k:"muted"},{i:"h2",l:"Đánh lửa",x:640,y:220,k:"muted"},{i:"h3",l:"Hệ thống ABS",x:640,y:350,k:"muted"}],
  e:[{f:"dr",t:"api",l:"start()",flow:1,seq:0},{f:"api",t:"h1",dash:1,flow:1,seq:1,k:"muted"},{f:"api",t:"h2",dash:1,flow:1,seq:1,k:"muted"},{f:"api",t:"h3",dash:1,flow:1,seq:1,k:"muted"}],
  code:`class Car {
  start() {
    this.pumpFuel();      // chi tiết bị giấu
    this.ignite();
  }
  private pumpFuel() {…}
  private ignite() {…}
}

new Car().start();        // người dùng chỉ cần biết thế này`},
 {t:"Phụ thuộc vào interface",
  p:["Màn hình Checkout chỉ biết tới <code>PaymentGateway.pay()</code>. Bên dưới có thể là MoMo, ZaloPay hay Stripe.","<b>Interface</b> chỉ khai báo “làm được gì”. <b>Abstract class</b> làm được như vậy và còn chứa sẵn được một phần code dùng chung."],
  key:"Code phụ thuộc vào cái gì (interface), không phụ thuộc vào làm thế nào (implementation).",
  n:[{i:"dr",l:"CheckoutScreen",x:130,y:220,w:170},{i:"api",l:"«PaymentGateway»",s:"pay(amount)",x:400,y:220,k:"violet",w:200},
     {i:"h1",l:"MomoPay",x:660,y:90,k:"accent",w:150},{i:"h2",l:"ZaloPay",x:660,y:220,k:"blue",w:150},{i:"h3",l:"StripePay",x:660,y:350,k:"green",w:150}],
  e:[{f:"dr",t:"api",l:"pay(99_000)",flow:1,k:"violet"},{f:"h1",t:"api",dash:1},{f:"h2",t:"api",dash:1},{f:"h3",t:"api",dash:1}],
  code:`interface PaymentGateway {
  pay(amount: number): Promise<boolean>;
}

class MomoPay implements PaymentGateway {
  async pay(amount: number) { /* gọi SDK MoMo */ return true; }
}

class CheckoutScreen {
  constructor(private gateway: PaymentGateway) {}
  onPayClick() { this.gateway.pay(99_000); }
}`}
 ]},

/* ---------- COMPOSITION ---------- */
{id:"composition", g:"OOP", t:"Composition > Inheritance",
 tag:"Lắp ghép hành vi từ những object nhỏ (has-a) thay vì kế thừa (is-a). Cách này linh hoạt hơn và dễ test hơn.",
 when:["Cần kết hợp nhiều khả năng theo nhiều cách","Muốn thay đổi hành vi lúc runtime"],
 avoid:["Quan hệ “is-a” thật sự rõ ràng và ổn định"],
 steps:[
 {t:"Kế thừa sinh ra quá nhiều lớp",
  p:["Robot có thể bay, bơi, bắn laser… Nếu dùng kế thừa, ta phải tạo FlyingRobot, SwimmingRobot, FlyingSwimmingRobot, FlyingLaserRobot…","Mỗi khả năng mới làm số lớp con tăng gấp đôi."],
  n:[{i:"rb",l:"Robot",x:400,y:70,k:"violet"},{i:"a",l:"FlyingRobot",x:150,y:200},{i:"b",l:"SwimmingRobot",x:400,y:200,w:170},{i:"c",l:"LaserRobot",x:650,y:200},
     {i:"d",l:"Flying+Swimming",x:220,y:350,k:"warn",w:180},{i:"e2",l:"Flying+Laser+Swim",x:580,y:350,k:"warn",w:200}],
  e:[{f:"a",t:"rb",dash:1},{f:"b",t:"rb",dash:1},{f:"c",t:"rb",dash:1},{f:"d",t:"a",dash:1,k:"warn"},{f:"e2",t:"c",dash:1,k:"warn"}],
  code:`class FlyingRobot extends Robot {}
class FlyingSwimmingRobot extends FlyingRobot {}  // 😵
class FlyingSwimmingLaserRobot extends …          // 2ⁿ lớp`},
 {t:"Lắp ráp từ các bộ phận",
  p:["<code>Robot</code> <b>có</b> (has-a) một bộ phận bay, một bộ phận bơi, một vũ khí. Mỗi bộ phận là một object nhỏ có interface riêng.","Muốn robot bay bằng cánh quạt thay vì động cơ phản lực? Chỉ cần đổi bộ phận, kể cả khi app đang chạy."],
  key:"Đây là nền tảng của Strategy, Decorator và Dependency Injection. Jetpack Compose, SwiftUI và Flutter đều được xây dựng theo hướng composition.",
  n:[{i:"rb",l:"Robot",s:"has-a: mover, weapon",x:210,y:220,k:"violet",w:220},
     {i:"a",l:"JetEngine",s:"«Mover»",x:600,y:80,k:"blue",w:160},{i:"b",l:"Propeller",s:"«Mover»",x:600,y:220,k:"blue",w:160},{i:"c",l:"LaserGun",s:"«Weapon»",x:600,y:360,k:"accent",w:160}],
  e:[{f:"rb",t:"a",l:"has-a",flow:1,k:"blue"},{f:"rb",t:"b",dash:1,l:"đổi được",k:"muted"},{f:"rb",t:"c",l:"has-a",flow:1,k:"accent"}],
  code:`interface Mover  { move(): void; }
interface Weapon { fire(): void; }

class Robot {
  constructor(public mover: Mover, public weapon?: Weapon) {}
  act() { this.mover.move(); this.weapon?.fire(); }
}

const r = new Robot(new JetEngine(), new LaserGun());
r.mover = new Propeller();   // đổi hành vi lúc runtime`}
 ]},

/* ===================== SOLID ===================== */
{id:"srp", g:"SOLID", t:"S · Single Responsibility",
 tag:"Mỗi class chỉ nên có một lý do để thay đổi.",
 when:["Class dài hơn vài trăm dòng","Một thay đổi nhỏ làm hỏng chỗ không liên quan"],
 avoid:["Chia quá vụn, mỗi class chỉ có một dòng"],
 steps:[
 {t:"God class làm mọi thứ",
  p:["<code>UserManager</code> vừa validate form, vừa gọi API, lưu database, format hiển thị và gửi email.","Đổi API, đổi giao diện hay đổi luật validate đều phải sửa cùng một file. Đó là 5 lý do để thay đổi."],
  n:[{i:"um",l:"UserManager",s:"2000 dòng 😱",x:400,y:220,k:"warn",w:190},
     {i:"r1",l:"validate()",x:140,y:80,k:"note"},{i:"r2",l:"callApi()",x:660,y:80,k:"note"},{i:"r3",l:"saveDb()",x:110,y:300,k:"note"},{i:"r4",l:"formatUI()",x:690,y:300,k:"note"},{i:"r5",l:"sendEmail()",x:400,y:400,k:"note"}],
  e:["r1","r2","r3","r4","r5"].map(t=>({f:t,t:"um",dash:1,k:"warn"})),
  code:`class UserManager {
  validate(form) {…}
  async callApi(user) {…}
  saveToDb(user) {…}
  formatForUI(user) {…}
  sendWelcomeEmail(user) {…}
  // … và còn nữa
}`},
 {t:"Tách theo trách nhiệm",
  p:["Mỗi trách nhiệm trở thành một class nhỏ với tên nói rõ nó làm gì. ViewModel chỉ còn nhiệm vụ <b>điều phối</b> các class đó.","Đổi API thì chỉ sửa <code>UserApi</code>, đổi luật validate thì chỉ sửa <code>UserValidator</code>."],
  key:"“Một lý do để thay đổi” nghĩa là một nhóm người hoặc một nhóm yêu cầu có thể đòi sửa class đó.",
  n:[{i:"um",l:"UserViewModel",s:"điều phối",x:160,y:220,k:"violet",w:180},
     {i:"r1",l:"UserValidator",x:590,y:45,k:"green",w:180},{i:"r2",l:"UserApi",x:590,y:132,k:"green",w:180},{i:"r3",l:"UserRepository",x:590,y:219,k:"green",w:180},{i:"r4",l:"UserFormatter",x:590,y:306,k:"green",w:180},{i:"r5",l:"EmailService",x:590,y:393,k:"green",w:180}],
  e:["r1","r2","r3","r4","r5"].map((t,i)=>({f:"um",t,flow:1,seq:i,k:"green"})),
  code:`class UserViewModel(
  private val validator: UserValidator,
  private val repo: UserRepository,
) : ViewModel() {
  fun register(form: Form) {
    if (!validator.isValid(form)) return
    viewModelScope.launch { repo.save(form.toUser()) }
  }
}`}
 ]},

{id:"ocp", g:"SOLID", t:"O · Open/Closed",
 tag:"Mở để mở rộng, đóng để sửa đổi: thêm tính năng bằng cách viết code mới, không sửa code cũ đang chạy.",
 when:["Thường xuyên thêm “loại” mới: phương thức thanh toán, khuyến mãi","Code cũ đã ổn định và có test"],
 avoid:["Trừu tượng hóa trước khi thật sự có biến thể"],
 steps:[
 {t:"Mỗi khuyến mãi mới là một lần sửa",
  p:["<code>DiscountService</code> có chuỗi <code>if</code> cho khách VIP, sinh viên, Black Friday… Mỗi chương trình mới, ta phải mở class ra và chèn thêm một nhánh.","Mỗi lần sửa như vậy đều có thể làm hỏng các khuyến mãi đang chạy."],
  n:[{i:"ds",l:"DiscountService",s:"calc(order)",x:210,y:220,k:"warn",w:200},
     {i:"a",l:"if VIP …",x:590,y:80,k:"muted"},{i:"b",l:"else if Student …",x:590,y:180,k:"muted",w:190},{i:"c",l:"else if BlackFriday …",x:590,y:280,k:"muted",w:220},{i:"d",l:"else if Tết … ✏️",x:590,y:380,k:"warn",w:190}],
  e:["a","b","c","d"].map(t=>({f:"ds",t,flow:1,k:"warn"})),
  code:`calc(order) {
  if (order.user.vip) return order.total * 0.9;
  else if (order.user.student) return order.total * 0.95;
  else if (isBlackFriday()) return order.total * 0.7;
  // mỗi chương trình mới = sửa hàm này ✏️
}`},
 {t:"Thêm luật mới = thêm class mới",
  p:["Định nghĩa interface <code>DiscountRule</code>. Mỗi chương trình khuyến mãi là một class implement interface đó.","<code>DiscountService</code> chỉ việc chạy qua danh sách luật. Chương trình Tết là một class mới, còn service <b>không phải sửa dòng nào</b>."],
  key:"Đa hình là công cụ chính để đạt được OCP. Strategy, Decorator và Observer đều phục vụ nguyên lý này.",
  n:[{i:"ds",l:"DiscountService",s:"rules.forEach(…)",x:170,y:220,k:"blue",w:200},{i:"if",l:"«DiscountRule»",s:"apply(order)",x:430,y:220,k:"violet",w:180},
     {i:"a",l:"VipRule",x:670,y:80,w:150},{i:"b",l:"StudentRule",x:670,y:180,w:150},{i:"c",l:"BlackFridayRule",x:670,y:280,w:160},{i:"d",l:"TetRule",s:"mới ✨",x:670,y:380,k:"green",w:150}],
  e:[{f:"ds",t:"if",flow:1,k:"blue"},{f:"a",t:"if",dash:1},{f:"b",t:"if",dash:1},{f:"c",t:"if",dash:1},{f:"d",t:"if",dash:1,k:"green"}],
  code:`interface DiscountRule {
  matches(o: Order): boolean;
  apply(o: Order): number;
}

class TetRule implements DiscountRule {      // chỉ thêm mới
  matches(o) { return isTet(); }
  apply(o)   { return o.total * 0.8; }
}

class DiscountService {
  constructor(private rules: DiscountRule[]) {}
  calc(o: Order) {
    const r = this.rules.find(r => r.matches(o));
    return r ? r.apply(o) : o.total;
  }
}`}
 ]},

{id:"lsp", g:"SOLID", t:"L · Liskov Substitution",
 tag:"Object của lớp con phải thay thế được lớp cha mà chương trình vẫn chạy đúng.",
 when:["Thiết kế cây kế thừa / interface","Review code có override làm thay đổi hành vi"],
 avoid:["Override chỉ để ném exception “không hỗ trợ”"],
 steps:[
 {t:"Hình vuông phá vỡ chữ nhật",
  p:["Về toán học, hình vuông là một hình chữ nhật, nên ta cho <code>Square extends Rectangle</code>. Nhưng khi <code>setWidth()</code>, Square phải sửa luôn chiều cao.","Hàm <code>resize()</code> đặt rộng 5, cao 4 và mong đợi diện tích 20. Truyền Square vào thì nhận về 16."],
  n:[{i:"fn",l:"resize(r: Rectangle)",s:"setW(5); setH(4) → mong đợi 20",x:240,y:220,k:"blue",w:290},
     {i:"rc",l:"Rectangle",s:"area = 20 ✓",x:620,y:100,k:"green",w:170},{i:"sq",l:"Square",s:"area = 16 ✕",x:620,y:340,k:"warn",w:170}],
  e:[{f:"fn",t:"rc",flow:1,k:"green"},{f:"fn",t:"sq",flow:1,k:"warn"},{f:"sq",t:"rc",l:"extends",dash:1,k:"muted"}],
  code:`class Square extends Rectangle {
  setWidth(w)  { this.w = w; this.h = w; }  // âm thầm đổi cả h
  setHeight(h) { this.w = h; this.h = h; }
}

function resize(r: Rectangle) {
  r.setWidth(5); r.setHeight(4);
  console.assert(r.area() === 20);  // ❌ Square trả về 16
}`},
 {t:"Thiết kế lại theo hành vi",
  p:["Vấn đề không nằm ở toán học mà ở <b>hành vi</b>: Square không giữ được “lời hứa” của Rectangle là đổi chiều rộng không làm đổi chiều cao.","Cách sửa: cả hai cùng implement <code>Shape</code> (chỉ có <code>area()</code>) và là object bất biến. Không còn kế thừa sai."],
  key:"Lớp con không được đòi hỏi nhiều hơn (precondition) hay hứa hẹn ít hơn (postcondition) so với lớp cha.",
  n:[{i:"fn",l:"printArea(s: Shape)",x:180,y:220,k:"blue",w:210},{i:"if",l:"«Shape»",s:"area()",x:440,y:220,k:"violet",w:150},
     {i:"rc",l:"Rectangle(w, h)",s:"bất biến",x:660,y:100,k:"green",w:180},{i:"sq",l:"Square(side)",s:"bất biến",x:660,y:340,k:"green",w:170}],
  e:[{f:"fn",t:"if",flow:1,k:"blue"},{f:"rc",t:"if",dash:1,k:"green"},{f:"sq",t:"if",dash:1,k:"green"}],
  code:`interface Shape { area(): number; }

class Rectangle implements Shape {
  constructor(readonly w: number, readonly h: number) {}
  area() { return this.w * this.h; }
}
class Square implements Shape {
  constructor(readonly side: number) {}
  area() { return this.side ** 2; }
}`},
 {t:"Trên mobile: List chỉ đọc", tag:"THỰC TẾ",
  p:["Kotlin tách <code>List</code> (chỉ đọc) và <code>MutableList</code>. Nếu <code>List</code> có sẵn <code>add()</code> mà bản chỉ đọc lại ném lỗi khi gọi, đó chính là vi phạm LSP.","Một dấu hiệu dễ nhận: lớp con override rồi <code>throw UnsupportedOperationException</code>."],
  n:[{i:"fn",l:"show(items: List)",x:180,y:220,k:"blue",w:200},{i:"if",l:"List",s:"get() · size",x:440,y:120,k:"violet",w:160},{i:"rc",l:"MutableList",s:"+ add() · remove()",x:440,y:330,k:"green",w:200}],
  e:[{f:"fn",t:"if",flow:1,k:"blue"},{f:"rc",t:"if",l:"extends",dash:1}],
  code:`fun show(items: List<Item>) { … }      // chỉ cần đọc

val data: MutableList<Item> = mutableListOf()
show(data)   // ✓ MutableList thay thế được List`}
 ]},

{id:"isp", g:"SOLID", t:"I · Interface Segregation",
 tag:"Không ép client phải phụ thuộc vào những phương thức mà nó không dùng.",
 when:["Interface có nhiều phương thức “không liên quan”","Class implement để trống hoặc ném lỗi"],
 avoid:["Mỗi interface chỉ có một phương thức một cách máy móc"],
 steps:[
 {t:"Interface béo phì",
  p:["Interface <code>Worker</code> có <code>work()</code>, <code>eat()</code>, <code>sleep()</code>. Con người thì ổn, nhưng <code>Robot</code> cũng bị ép phải cài <code>eat()</code> và <code>sleep()</code>.","Trên Android, <code>TextWatcher</code> bắt bạn viết đủ 3 hàm dù chỉ cần một."],
  n:[{i:"if",l:"«Worker»",s:"work() · eat() · sleep()",x:400,y:80,k:"warn",w:260},
     {i:"hm",l:"Human",s:"dùng cả 3 ✓",x:220,y:320,k:"green",w:170},{i:"rb",l:"Robot",s:"eat() { throw } ✕",x:580,y:320,k:"warn",w:200}],
  e:[{f:"hm",t:"if",dash:1},{f:"rb",t:"if",dash:1,k:"warn"}],
  code:`interface Worker { work(): void; eat(): void; sleep(): void; }

class Robot implements Worker {
  work()  { … }
  eat()   { throw new Error("Robot không ăn"); }   // 🚩
  sleep() { /* để trống */ }
}`},
 {t:"Chia nhỏ theo vai trò",
  p:["Tách thành các interface nhỏ: <code>Workable</code>, <code>Eatable</code>, <code>Sleepable</code>. Mỗi class chỉ implement những gì nó thật sự làm.","Client nào chỉ cần <code>work()</code> thì phụ thuộc vào <code>Workable</code>, và không bị ảnh hưởng khi <code>Eatable</code> thay đổi."],
  key:"Nhiều interface nhỏ, chuyên biệt tốt hơn một interface lớn, đa năng.",
  n:[{i:"w",l:"«Workable»",s:"work()",x:150,y:80,k:"violet",w:170},{i:"if",l:"«Eatable»",s:"eat()",x:400,y:80,k:"violet",w:160},{i:"s",l:"«Sleepable»",s:"sleep()",x:650,y:80,k:"violet",w:170},
     {i:"hm",l:"Human",x:270,y:320,k:"green",w:150},{i:"rb",l:"Robot",x:560,y:320,k:"green",w:150}],
  e:[{f:"hm",t:"w",dash:1},{f:"hm",t:"if",dash:1},{f:"hm",t:"s",dash:1},{f:"rb",t:"w",dash:1,k:"green"}],
  code:`interface Workable  { work(): void; }
interface Eatable   { eat(): void; }
interface Sleepable { sleep(): void; }

class Human implements Workable, Eatable, Sleepable { … }
class Robot implements Workable { work() { … } }

// Android KTX làm đúng tinh thần ISP:
editText.doAfterTextChanged { text -> … }   // chỉ 1 callback`}
 ]},

{id:"dip", g:"SOLID", t:"D · Dependency Inversion",
 tag:"Module cấp cao không phụ thuộc vào module cấp thấp; cả hai cùng phụ thuộc vào abstraction.",
 when:["Muốn unit test ViewModel / logic nghiệp vụ","Muốn đổi nguồn dữ liệu: API, cache, mock"],
 avoid:["Script nhỏ, prototype dùng một lần"],
 steps:[
 {t:"ViewModel tự tạo API",
  p:["<code>ProfileViewModel</code> tự gọi <code>new RetrofitUserApi()</code>. Logic nghiệp vụ (cấp cao) bị dính chặt vào chi tiết mạng (cấp thấp).","Không test được nếu thiếu mạng, và không đổi được sang cache hay Firebase mà không sửa ViewModel."],
  n:[{i:"vm",l:"ProfileViewModel",s:"cấp cao",x:170,y:220,k:"warn",w:190},{i:"api",l:"RetrofitUserApi",s:"cấp thấp",x:450,y:220,w:180},{i:"sv",l:"🌐 Server",x:690,y:220,k:"note"}],
  e:[{f:"vm",t:"api",l:"new RetrofitUserApi()",flow:1,seq:0,k:"warn"},{f:"api",t:"sv",flow:1,seq:1}],
  code:`class ProfileViewModel : ViewModel() {
  private val api = RetrofitUserApi()       // ❌ phụ thuộc cứng

  fun load(id: String) = viewModelScope.launch {
    user = api.getUser(id)
  }
}`},
 {t:"Đảo ngược phụ thuộc",
  p:["ViewModel chỉ phụ thuộc vào interface <code>UserRepository</code>. Các bản triển khai cụ thể cũng phụ thuộc vào interface đó, nên mũi tên phụ thuộc đã bị <b>đảo chiều</b>.","Khi chạy app thật thì dùng <code>RemoteUserRepository</code>, còn khi test thì dùng <code>FakeUserRepository</code>."],
  key:"Phụ thuộc vào abstraction, không phụ thuộc vào chi tiết cụ thể.",
  n:[{i:"vm",l:"ProfileViewModel",x:150,y:220,k:"green",w:190},{i:"if",l:"«UserRepository»",s:"getUser(id)",x:420,y:220,k:"violet",w:200},
     {i:"api",l:"RemoteUserRepository",x:650,y:100,w:220},{i:"fk",l:"FakeUserRepository",s:"dùng khi test",x:650,y:340,k:"gold",w:210}],
  e:[{f:"vm",t:"if",flow:1,k:"violet"},{f:"api",t:"if",dash:1},{f:"fk",t:"if",dash:1,k:"gold"}],
  code:`interface UserRepository { suspend fun getUser(id: String): User }

class RemoteUserRepository(private val api: UserApi) : UserRepository {
  override suspend fun getUser(id: String) = api.getUser(id)
}

class ProfileViewModel(
  private val repo: UserRepository          // ✓ chỉ biết interface
) : ViewModel()

// test
val vm = ProfileViewModel(FakeUserRepository())`},
 {t:"DI container lắp ráp mọi thứ", tag:"THỰC TẾ",
  p:["Ai sẽ tạo <code>RemoteUserRepository</code> và đưa vào ViewModel? Đó là việc của <b>Dependency Injection</b>: Hilt hay Koin trên Android, Swinject hoặc Factory trên iOS, GetIt hay Riverpod trên Flutter.","Bạn chỉ cần khai báo một lần “UserRepository thì dùng bản Remote”. Container sẽ tự lắp ráp ở mọi nơi cần đến."],
  key:"DIP là nguyên lý (nên phụ thuộc vào đâu). DI là kỹ thuật thực hiện nó (ai tạo và đưa phụ thuộc vào).",
  n:[{i:"di",l:"DI Container",s:"Hilt · Koin · GetIt",x:400,y:80,k:"gold",w:220},{i:"vm",l:"ProfileViewModel",x:170,y:320,k:"green",w:190},{i:"api",l:"RemoteUserRepository",x:630,y:320,w:220}],
  e:[{f:"di",t:"api",l:"tạo",flow:1,seq:0,k:"gold"},{f:"di",t:"vm",l:"inject",flow:1,seq:1,k:"gold"},{f:"vm",t:"api",l:"dùng qua interface",dash:1,k:"violet"}],
  code:`@Module @InstallIn(SingletonComponent::class)
abstract class RepoModule {
  @Binds abstract fun bindRepo(impl: RemoteUserRepository): UserRepository
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
  private val repo: UserRepository
) : ViewModel()`}
 ]}
];

const MOB_OOP = {
 "class-object":{t:0,why:"Mọi thứ trong app đều là object",a:"data class User, class ViewModel",i:"struct (giá trị) vs class (tham chiếu)",f:"class + factory fromJson"},
 "encapsulation":{t:0,why:"Giữ state an toàn trong ViewModel/Store",a:"private _state + public StateFlow",i:"private(set) var, @Published private(set)",f:"_counter private + getter, Bloc emit"},
 "inheritance":{t:0,why:"Framework buộc bạn kế thừa",a:"extends ViewModel, AppCompatActivity",i:"UIViewController subclass",f:"extends StatelessWidget / State"},
 "polymorphism":{t:0,why:"List nhiều loại item, sealed class",a:"sealed interface + when(item)",i:"protocol + enum có associated values",f:"Widget.build(), sealed class (Dart 3)"},
 "abstraction":{t:0,why:"Tách UI khỏi chi tiết data/SDK",a:"interface Repository, PaymentGateway",i:"protocol-oriented programming",f:"abstract class Repository"},
 "composition":{t:0,why:"UI hiện đại đều theo hướng composition",a:"Compose: ghép các @Composable nhỏ",i:"SwiftUI: ghép View, ViewModifier",f:"Widget lồng Widget"},
 "srp":{t:0,why:"Chống “Massive ViewController/Activity”",a:"Tách UseCase, Repository khỏi ViewModel",i:"Tránh Massive View Controller",f:"Tách Widget nhỏ, Bloc riêng"},
 "dip":{t:0,why:"Chìa khóa để unit test & Clean Architecture",a:"Hilt / Koin + interface Repository",i:"Protocol + Swinject / Factory",f:"GetIt / Riverpod + abstract Repository"},
 "ocp":{t:0,why:"Thêm tính năng không làm hỏng cái cũ",a:"Thêm ViewType mới cho list, PaymentMethod mới",i:"protocol extension, thêm conformance",f:"Thêm class implement abstract rule"},
 "isp":{t:0,why:"Callback/listener gọn gàng",a:"doAfterTextChanged thay TextWatcher",i:"Tách DataSource / Delegate nhỏ",f:"mixin nhỏ thay interface lớn"},
 "lsp":{t:0,why:"Tránh crash khi override sai",a:"List vs MutableList",i:"Collection vs MutableCollection",f:"UnmodifiableListView"}
};
const ROAD_OOP = ["class-object","encapsulation","inheritance","polymorphism","abstraction","composition","srp","dip","ocp","isp","lsp"];

/* ===================== MERGE DATA ===================== */
P.unshift(...P_OOP);
Object.assign(MOB, MOB_OOP);
const GROUP_KEYS = ["OOP","SOLID","Creational","Structural","Behavioral"];
const GROUPS = {
  OOP:{sh:"OOP cơ bản", vi:"Hướng đối tượng", en:"OOP", col:"#b9a5e6", d:"Bốn trụ cột của OOP và nguyên tắc ưu tiên composition. Đây là nền móng cho mọi thứ phía sau."},
  SOLID:{sh:"SOLID", vi:"Nguyên lý SOLID", en:"SOLID", col:"#a6d38b", d:"Năm nguyên lý giúp code dễ đọc, dễ mở rộng và dễ test."},
  Creational:{sh:"Khởi tạo", vi:"Pattern khởi tạo", en:"Creational", col:"#f0b07c", d:"Cách tạo đối tượng linh hoạt, tránh phụ thuộc cứng vào class cụ thể."},
  Structural:{sh:"Cấu trúc", vi:"Pattern cấu trúc", en:"Structural", col:"#8fbbe6", d:"Cách ghép class và object thành cấu trúc lớn hơn mà vẫn gọn gàng."},
  Behavioral:{sh:"Hành vi", vi:"Pattern hành vi", en:"Behavioral", col:"#ec9fb2", d:"Cách các object giao tiếp và phân chia trách nhiệm với nhau."}
};
const ORDER_ALL = [...ROAD_OOP.slice(0,6), "srp","ocp","lsp","isp","dip",
  "singleton","factory-method","abstract-factory","builder","prototype",
  "adapter","bridge","composite","decorator","facade","flyweight","proxy",
  "chain-of-responsibility","command","iterator","mediator","memento","observer","state","strategy","template-method","visitor","interpreter"];
P.sort((a,b)=>ORDER_ALL.indexOf(a.id)-ORDER_ALL.indexOf(b.id));
const BYID = Object.fromEntries(P.map(p=>[p.id,p]));
const ROAD = [...ROAD_OOP, "observer","state","singleton","builder","adapter","facade","strategy","factory-method",
  "decorator","composite","chain-of-responsibility","proxy","command","template-method","mediator","memento","flyweight","abstract-factory",
  "prototype","iterator","bridge","visitor","interpreter"];
const TIERS = {
  0:{n:"Nền tảng",d:"Học trước tiên. Không có OOP và SOLID thì đọc pattern sẽ chỉ là học thuộc lòng.",col:"#7c63d0",tint:"#b9a5e6"},
  1:{n:"Học ngay",d:"Gặp hằng ngày khi làm app. Nắm chắc 8 pattern này là đọc hiểu được hầu hết codebase mobile.",col:"#e8834d",tint:"#f0b07c"},
  2:{n:"Học tiếp",d:"Có sẵn trong framework và thư viện bạn đang dùng. Hiểu chúng giúp debug và thiết kế tốt hơn.",col:"#2f86ce",tint:"#8fbbe6"},
  3:{n:"Biết là đủ",d:"Ít khi tự viết trong app. Chỉ cần nhận ra khi gặp.",col:"#b0a698",tint:"#d8cfc2"}
};
const LEVEL = p => p.g==="OOP" ? "Cơ bản" : p.g==="SOLID" ? "Trung cấp" : ["Cơ bản","Cơ bản","Trung cấp","Nâng cao"][MOB[p.id].t];
const MINS = p => p.steps.length*3 + 2;


export { P, MOB, BYID, GROUPS, GROUP_KEYS, ORDER_ALL, ROAD, TIERS, LEVEL, MINS };
