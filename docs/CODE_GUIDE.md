# Kodni o'qish va review qilish tartibi

## Asosiy tuzilma

| Joy | Vazifasi |
| --- | --- |
| `apps/pat-nest-api/src/main.ts` | Validation, CORS, upload middleware va WebSocket adapterni ulaydi. |
| `app.module.ts` | GraphQL, umumiy throttling, baza va biznes modullarini birlashtiradi. |
| `components/*/*.module.ts` | Shu funksiya uchun model va servis bog'liqliklarini ro'yxatdan o'tkazadi. |
| `components/*/*.resolver.ts` | GraphQL kontrakti, argumentlar, guardlar va servis chaqiruvlari. |
| `components/*/*.service.ts` | Biznes qoidalari, MongoDB so'rovlari va tranzaksiyalar. |
| `libs/dto` | GraphQL input/output turlari va input validatsiyasi. |
| `schemas` | MongoDB maydonlari, indekslari va standart qiymatlari. |
| `libs/types/config.ts` | Umumiy sort ro'yxatlari, ObjectId konvertatsiyasi va aggregation lookuplari. |
| `libs/utils/error.util.ts` | Noma'lum xatoni logga tayyorlash va duplicate-key xatosini aniqlash. |
| `socket` | Umumiy live chat va shaxsiy bildirishnomalar. |
| `apps/pet-batch/src` | Reytinglarni jadval asosida qayta hisoblash. |

## Har bir funksiya uchun review yo'li

Avval resolverdagi query/mutation va guardni, keyin input DTOdagi cheklovlarni o'qing. Servisdagi public metod oqimni ko'rsatadi; pastdagi private metodlar tekshiruv yoki saqlash bosqichlarini bajaradi. Tokensiz ham ishlaydigan querylar `OptionalAuthGuard`dan, login talab qiladiganlari `AuthGuard`dan, rol talab qiladiganlari esa `RolesGuard`dan foydalanadi.

Oxirida schema indekslari va ushbu oqim testlarini tekshiring.

GraphQL nomlari, DTO maydonlari va enum qiymatlari frontend bilan kontrakt hisoblanadi. Ularni ichki o'zgaruvchi nomlari bilan adashtirmang.

## Muhim oqimlar

- **Auth:** `MemberResolver` → `AuthService`. Refresh: cookie → sessiya va hash → faol foydalanuvchi → atomik token almashtirish → cookie. Sessiyaning dastlabki tugash sanasi saqlanadi.
- **Savat:** `CartResolver` → `CartService`. Variant/stok tekshiruvi saqlashdan oldin bajariladi. Sotuvda yo'q mahsulot ko'rinadi, lekin jami narxga qo'shilmaydi.
- **Buyurtma:** `OrderResolver` → `OrderService`. Savat nusxasi bo'yicha takroriy buyurtma tekshiriladi; stok va buyurtma bitta tranzaksiyada yoziladi. Bekor qilish stokni qaytaradi.
- **To'lov:** `PaymentResolver` → `PaymentService`. Tasdiqlash to'lov, buyurtma holati va sotilgan mahsulot sonini bitta tranzaksiyada yangilaydi.
- **Izoh/review:** `CommentResolver` → `CommentService`. Avval maqsad/rating tekshiriladi, keyin izoh saqlanadi, statistika yangilanadi va mahsulot egasiga bildirishnoma yuboriladi.
- **Pet/product/member:** resolver → tegishli servis → like/view servislari. Ro'yxatlar MongoDB aggregation orqali pagination va qo'shimcha foydalanuvchi ma'lumotlarini oladi.
- **Follow/inquiry:** servis yozuvni saqlaydi va qabul qiluvchiga bildirishnoma yuboradi. Bildirishnoma xatosi asosiy saqlangan natijani bekor qilmaydi.
- **Chat:** `WsAdapter` → `SocketGateway`. `info`, `getMessages`, `message`; Guest rejimi va xotirada oxirgi 5 ta xabar. Batafsil: [LIVE_CHAT.md](LIVE_CHAT.md).
- **Bildirishnoma:** `NotificationService` → `NotificationGateway` → foydalanuvchi IDsi nomidagi Socket.IO xona. `/socket.io/` va chat `/` yo'llari bitta portdan foydalanadi.
- **Batch:** `PatBatchController` cronlari → `PatBatchService`. Avval rank nolga tushiriladi, keyin pet, agent va product reytinglari hisoblanadi.

## Tekshirish

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run build:batch
```

E2e testlar modullarni yuklaydi, lekin haqiqiy MongoDBga ulanmaydi. Tranzaksiyalar uchun alohida test bazasi bilan tekshiruv kerak.
