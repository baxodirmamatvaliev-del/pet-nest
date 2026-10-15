# PetNest backend

NestJS, GraphQL/Apollo va MongoDB asosidagi backend. API `apps/pat-nest-api`, rejalashtirilgan reyting vazifalari esa `apps/pet-batch` ichida joylashgan.

API foydalanuvchilar, hayvonlar, mahsulotlar, savat, buyurtma, to'lov holatlari, izohlar, obunalar, yordam so'rovlari va bildirishnomalarni boshqaradi. Live chat nestar loyihasidagi oddiy WebSocket oqimidan foydalanadi.

## Ishga tushirish

```bash
npm ci
cp .env.example .env
```

`.env` ichida MongoDB manzillari, `SECRET_TOKEN` va frontend uchun `CLIENT_URLS` qiymatlarini sozlang. API porti `PORT_API`, batch porti `PORT_BATCH` orqali belgilanadi.

```bash
npm run start:dev
npm run start:dev:batch
```

GraphQL: `/graphql`. API va MongoDB tayyorligini tekshirish: `/health`.

## Tekshiruvlar

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run build:batch
```

`npm run lint` fayllarni o'zgartirmaydi. Avtomatik tuzatishlar uchun `npm run lint:fix` ishlatiladi.

Unit testlar refresh sessiyalari, rasm yuklash validatsiyasi, savat narxi/stoki, mahsulot reviewlari va takroriy buyurtma tekshiruvlarini qamrab oladi. E2e testlar barcha API/batch modullarini yuklab, HTTP, GraphQL, tokensiz kirishni rad etish va cron vazifalari ro'yxatini tekshiradi. Testlarda MongoDB ulanishi ajratilgan provider bilan almashtiriladi: haqiqiy bazaga so'rov yoki yozuv yuborilmaydi. Shu sababli ular MongoDB tranzaksiyalari, to'liq xarid oqimi va tashqi xizmatlar sinovini almashtirmaydi.

## Qo'shimcha ma'lumot

- [Kodni o'qish va review qilish](docs/CODE_GUIDE.md)
- [Live chat](docs/LIVE_CHAT.md)
- [Refresh token sessiyalari](docs/REFRESH_TOKENS.md)
- [Deployment](DEPLOYMENT.md)
