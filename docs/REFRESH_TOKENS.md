# Refresh token: backend qo‘llanmasi

## Muddatlar

- Yangi access token: 10 daqiqa (`auth.module.ts`).
- Refresh sessiya: login/signup vaqtidan 15 kun.
- Rotation refresh tokenni almashtiradi, `expiresAt` sanasini uzaytirmaydi.
- Har login alohida sessiya yaratadi. Logout cookie ko‘rsatgan sessiyani bekor qiladi.
- Avval berilgan 30 kunlik access tokenlar o‘z `exp` muddatigacha amal qiladi. Konfiguratsiyani o‘zgartirish ularni qisqartirmaydi.

## So‘rovlar

Login/signup GraphQL javoblari saqlangan. Qo‘shimcha ravishda javobda
`Set-Cookie: pet_refresh=...; HttpOnly; SameSite=Lax; Path=/graphql` yuboriladi.
Productionda `Secure` ham qo‘shiladi. Refresh token JSON/GraphQL javobida berilmaydi.

```graphql
mutation RefreshSession {
  refreshToken {
    accessToken
    member { _id memberNick memberType }
  }
}

mutation EndSession {
  logout
}
```

Refresh va logout uchun access token talab qilinmaydi: muddati tugagan access token bilan ham sessiyani yangilash mumkin. Refresh cookie va ishonchli `Origin` talab qilinadi. Login/signup ham ishonchli `Origin` talab qiladi (login CSRF himoyasi).

Misol: 1-oktabr 10:00 da login -> refresh sessiya 16-oktabr 10:00 da tugaydi.
1-oktabr 10:10 da refresh -> yangi access token 10:20 gacha ishlaydi,
refresh sessiya esa hanuz 16-oktabr 10:00 da tugaydi.

## Bazadagi ma’lumotlar

`refreshSessions`: `_id`, `memberId`, `tokenHash`, `usedTokenHashes`,
`expiresAt`, `revokedAt`, timestamps.

Token `<sessionId>.<32-byte random secret>` shaklida. SHA-256 hash saqlanadi;
token tasodifiy va yetarlicha uzun bo‘lgani sababli parollardagi kabi bcrypt kerak emas.
MongoDB TTL indeksi eskirgan sessiyalarni tozalaydi. TTL kechikishi mumkin;
shuning uchun har refresh so‘rovida `expiresAt > now` ham tekshiriladi.

Rotation atomik compare-and-swap bilan bajariladi. Eski token qayta ishlatilsa,
shu sessiya bekor qilinadi. Frontend bir paytda faqat bitta refresh so‘rovini
bajarishi kerak, shu jumladan bir nechta tab orasida ham muvofiqlashtirish kerak.
Logout yangi access token olishni to‘xtatadi; oldingi access token qolgan
10 daqiqalik muddati davomida ishlashi mumkin.

## Konfiguratsiya va keyingi bosqich

`CLIENT_URLS` brauzer frontend originlarini aniq ko‘rsatishi kerak, masalan
`http://localhost:3000`. Productionda HTTPS va `NODE_ENV=production` zarur.
Cookie hozir `SameSite=Lax`: frontend/API bir site ostida bo‘lishi kerak
(masalan app.example.com va api.example.com). Turli site domenlari uchun
cookie va CSRF siyosatini alohida moslash kerak.

Postman/GraphQL client ishlatganda ham ruxsat etilgan `Origin` header va cookie jar yuboring.

Frontend bu bosqichda o‘zgartirilmagan. Keyingi bosqichda Apollo/fetch uchun
`credentials: 'include'`, xotirada access token, ishga tushganda refresh,
authentication xatosida bitta refresh va so‘rovni bir marta takrorlash,
logout mutation va tablar orasida refresh muvofiqlashtirish qo‘shiladi.
Faqat frontendda localStorage tozalash backend sessiyani bekor qilmaydi.

## Tekshiruv

`tsc --noEmit --incremental false -p apps/pat-nest-api/tsconfig.app.json`
va Jest testlari. Testlar hash saqlash, 15 kunlik muddat, rotation,
replay, yaroqsiz sessiya, bloklangan/o‘chirilgan member, parallel refresh,
origin va logout holatlarini tekshiradi. Jonli MongoDB/brauzer integratsiyasi
frontend ulangandan keyin alohida tekshirilishi kerak.
