# Carsharing — опис сайту для редизайну (контекст для Claude Design)

Веб-застосунок для оренди авто (carsharing). Стек: **React 19 + Vite**, маршрутизація **react-router-dom 7**, поточна верстка на **Bootstrap 5**, карти — **Leaflet / react-leaflet**, сповіщення — **react-toastify**. Мова інтерфейсу — змішана: підписи здебільшого англійською, повідомлення/підказки — українською.

Авторизація — через JWT (зберігається в localStorage). Є дві ролі: **USER** (звичайний клієнт) та **ADMIN**. Частина сторінок та елементів видима лише адміну.

---

## Глобальна структура / навігація

**Верхнє меню (navbar)** — темне, фіксоване зверху, видиме на всіх сторінках для авторизованого користувача:
- Зліва бренд-логотип: **«Carsharing»** (веде на головну).
- Пункти меню: **Cars** (головна, `/`), **My Rentals** (`/rentals`), **Profile** (`/profile`).
- Лише для адміна додатково: **Admin Licenses** (`/admin/licenses`), **Admin Rentals** (`/admin/rentals`).
- Справа кнопка **Logout**.
- На мобільних меню згортається в «бургер».

Контент кожної сторінки рендериться у центральному контейнері під navbar.

**Маршрути:**
| Шлях | Сторінка | Доступ |
|------|----------|--------|
| `/login` | Логін | публічний |
| `/register` | Реєстрація | публічний |
| `/` | Список авто (Cars) | авторизований |
| `/rentals` | Мої оренди | авторизований |
| `/profile` | Профіль | авторизований |
| `/admin/licenses` | Модерація посвідчень | лише ADMIN |
| `/admin/rentals` | Усі оренди | лише ADMIN |

Неавторизованих редіректить на `/login`; не-адмінів з адмін-сторінок — на головну.

---

## 1. Сторінка входу — Login (`/login`)

Проста центрована картка з формою.
- Заголовок: **Login**.
- Поля: **Email**, **Password**.
- Кнопка на всю ширину: **Sign in**.
- Під формою: «No account?» + посилання **Register**.
- При помилці — червоний алерт «Невірний email або пароль».

## 2. Сторінка реєстрації — Register (`/register`)

Центрована картка з формою (трохи ширша за логін).
- Заголовок: **Register**.
- Поля: **Full name**, **Email**, **Phone** (плейсхолдер `+380991112233`), **Referral code** (необов'язкове, з підказкою «Якщо маєте код запрошення, введіть його тут»), **Password**, **Confirm password**.
- Кнопка на всю ширину: **Create account**.
- Під формою: «Already have an account?» + посилання **Login**.
- Валідація: паролі мають співпадати; помилки виводяться червоним алертом, успіх — зеленим. Після реєстрації автоматичний вхід і перехід на головну.

## 3. Головна — список авто (Cars, `/`)

Найбільша і ключова сторінка. Каталог авто з фільтрами та двома режимами перегляду.

**Шапка сторінки:**
- Заголовок **Available cars**.
- Зелений бейдж **«Бонуси: {N}»** (баланс бонусів користувача).
- Лише для адміна — кнопка **Add car**.

**Панель пошуку та фільтрів (картка):**
- Велике поле **Search** (пошук по бренду, моделі, номеру, кольору, адресі).
- Кнопка **⚙️ Filters** (відкриває модальне вікно фільтрів).
- Рядок «Знайдено авто: X / Y».
- Перемикач режиму перегляду: **Cards** / **Map**.

**Режим Cards** — сітка карток авто (по 2–3 в ряд). Кожна картка:
- Фото авто зверху (або заглушка «No Image»).
- Назва: **Brand + Model**.
- Поля: **Address**, **Hourly** (грн), **Daily** (грн), **Monthly** (грн).
- **Status** — `AVAILABLE` (зелений) або інший (червоний).
- Лише для адміна — кнопка **Edit car**.
- Кнопка **Rent** (синя, якщо доступне) або **Not available** (сіра, неактивна).

**Режим Map** — інтерактивна карта Leaflet (центр — Харків або геолокація користувача). Маркери авто; при кліку — попап з фото, назвою, адресою, цінами, статусом і кнопкою **Rent**. Лічильник «Авто на мапі: X / Y».

**Модальне вікно оренди (Rent)** — відкривається при кліку Rent:
- Заголовок «Rent Brand Model» + адреса.
- Поля: **Tariff** (HOUR / DAY / MONTH), **Start time**, **End time** (datetime).
- Блок розрахунку: **Base price**, **Your bonus balance**, **Max usable bonus**, а праворуч у виділеній картці — велика зелена сума **Final price**.
- **Bonus to use** — повзунок (slider) + числове поле для списання бонусів, з відображенням «Обрано бонусів».
- Кнопки **Cancel** / **Confirm rental**.

**Модальне вікно фільтрів (Filters):**
- Мультиселекти (випадні списки з чекбоксами): **Brand**, **Model**, **Color**, **City**.
- **Status** (ALL / AVAILABLE; для адміна ще RENTED / SERVICE / INACTIVE).
- **Price tariff** (Hourly / Daily / Monthly).
- **Year range** — два повзунки (From / To).
- **Price range** — два повзунки (From / To).
- Лічильник знайдених авто + кнопки **Reset** / **Apply**.

**Модальне вікно авто (Add/Edit car, лише адмін):**
- Поля: **Brand**, **Model**, **Year**, **Color**, **Status**, **Registration number**.
- **LocationPicker** — вибір місцезнаходження на мапі + адреса (геокодинг).
- Ціни: **Price per hour / day / month**.
- Блок **Car image**: завантаження фото, чекбокс «Make this image main».
- В режимі Edit — галерея вже доданих фото з кнопками **Set main** / **Delete** (з підтвердженням).
- Кнопки **Cancel** / **Save**.

## 4. Мої оренди — My Rentals (`/rentals`)

Сторінка про оренди поточного користувача, поділена на блоки.

**Active Rental** — картка поточної активної оренди (якщо є):
- Назва авто, **Registration**, **Tariff**, **Start**, **End**, **Total** (грн).
- Кнопки фотофіксації: **Before photos (n/6)** та **After photos (n/6)** — завантаження фото до і після оренди (макс. 6).
- Інформаційні алерти: треба завантажити фото «до» перед початком; «після» — перед завершенням.
- Кнопка **Scan NFC / Unlock car** (розблокування авто; доступна лише після фото «до»).
- Кнопка **Finish Rental** (червона; доступна лише після фото «після»).
- Якщо активної оренди немає — сірий алерт «Активної оренди немає».

**Payment Required** — блок (картка з жовтою рамкою), якщо є оренди зі статусом `BOOKED`, що очікують оплати. Таблиця: ID, Car, Tariff, Period, Total price, Bonus used, Status + кнопки оплати **Pay with LiqPay** (зелена) та **Mock pay** (для dev).

**Rental History** — таблиця завершених/оплачених оренд: ID, Car, Tariff, Start, End, Total, Status. Якщо порожньо — «Оренд поки немає».

**Модалка фото оренди** — завантаження/перегляд фото типу BEFORE/AFTER.

## 5. Профіль — Profile (`/profile`)

Дві картки в ряд.

**Ліва картка — Profile:**
- Заголовок + кнопка **Edit** (у режимі редагування — **Save** / **Cancel**).
- Дані: **Name**, **Email**, **Phone** (у режимі Edit — редаговані поля з валідацією).
- **Status** користувача.
- **Referral code** + кнопка **Copy** (копіює в буфер).
- **Bonus balance**.

**Права картка — Driver License (водійське посвідчення):**
- Якщо завантажене: **Document number**, **Status** (та **Reject reason**, якщо відхилене), зображення посвідчення.
- Якщо немає або не APPROVED — форма завантаження: **Document number**, **Issue date**, **Expiry date**, **License image** (файл), кнопка **Upload license**.

## 6. Адмін — модерація посвідчень (Admin Licenses, `/admin/licenses`)

Лише для адміна.
- Заголовок **Pending Driver Licenses** + кнопка **Refresh** (зі спінером).
- Таблиця посвідчень на перевірку: **ID**, **Document Number**, **Document Photo** (мініатюра), **Status**, **Reject reason**, **Actions**.
- Дії на рядок: **Approve** (зелена) / **Reject** (червона). Reject відкриває модалку з полем причини відхилення.
- Якщо немає — «Немає посвідчень на перевірку».

## 7. Адмін — усі оренди (Admin Rentals, `/admin/rentals`)

Лише для адміна.
- Заголовок **Admin Rentals** + підзаголовок «Перегляд активних та історичних оренд користувачів» + кнопка **Refresh**.
- Перемикач: **Active rentals** / **All rentals** + лічильник «Знайдено оренд».
- Широка таблиця: **ID**, **User** (ім'я + ID), **Contacts** (email/телефон з посиланнями), **Car** (бренд+модель, держномер), **Tariff**, **Period** (Start/End), **Total**, **Bonus**, **Before photos** / **After photos** (кнопки з лічильником, відкривають модалку фото), **Status**.
- Статуси з кольоровими бейджами: ACTIVE (зелений), FINISHED (сірий), CANCELED (червоний), BOOKED (синій), EXPIRED (жовтий, з приміткою про автозавершення).

---

## Поточна візуальна мова (що змінюємо)

- Стандартний вигляд Bootstrap 5: системний шрифт, типові сині кнопки `btn-primary`, картки з легкою тінню (`shadow-sm`), темний navbar.
- Кастомні модалки з власним бекдропом (розмиття фону, заокруглені кути 16px).
- У `index.css` вже закладено набір CSS-змінних і підтримка темної теми: акцентний колір — **фіолетовий** (`--accent: #aa3bff`, у dark — `#c084fc`), нейтральний текст/фон, м'які тіні. Зараз ці змінні майже не застосовані до компонентів — лише до заголовків.
- Валюта скрізь — **грн**.

### Ідеї для редизайну (для контексту дизайнера)
- Єдина сучасна дизайн-система поверх (або замість) Bootstrap: акцент на фіолетовій палітрі, що вже є в `:root`.
- Картки авто — більш «продуктовий» вигляд (виразніше фото, ціна як головний акцент, бейдж статусу).
- Покращити hero/головну, модалки оренди (крок-за-кроком), стан порожніх списків.
- Узгодити мову інтерфейсу (зараз мікс EN/UA).
- Повноцінна підтримка світлої/темної теми.

---

## Моделі даних (що реально приходить з бекенду)

Ці структури визначають, які поля показуються на сторінках. Усі ціни — `BigDecimal` (грн), дати — ISO `datetime`.

### Авто — картка в каталозі (`CarCardResponse`)
```
id, brand, model, year, registrationNumber, color,
fuelType, transmission,
city, address, latitude, longitude,
pricePerHour, pricePerDay, pricePerMonth,
status, imageUrl
```
`status` (enum **CarStatus**): `AVAILABLE` · `RESERVED` · `RENTED` · `SERVICE` · `INACTIVE`.
`fuelType` (enum **FuelType**): `PETROL` · `DIESEL` · `ELECTRIC` · `HYBRID` · `GAS`.
`transmission` (enum **Transmission**): `MANUAL` · `AUTOMATIC`.

### Авто — деталі (`CarDetailsResponse`)
```
id, brand, model, year, color,
fuelType, transmission,
pricePerHour, pricePerDay, pricePerMonth,
address, latitude, longitude,
images[]  // список URL фото
```

### Фото авто (`CarImageResponse`)
```
id, carId, imageUrl, imagePublicId, isMain
```

### Оренда користувача (`RentalResponse`)
```
id, carId, carBrand, carModel, carRegistrationNumber,
tariffType, startTime, endTime,
totalPrice, bonusUsed, discountAmount,
status
```
`tariffType` (enum **TariffType**): `HOUR` · `DAY` · `MONTH`.
`status` (enum **RentalStatus**): `BOOKED` (очікує оплати) · `ACTIVE` (активна) · `FINISHED` (завершена) · `CANCELED` (скасована) · `EXPIRED` (час вийшов, очікує перевірки адміном).

### Розрахунок оренди — прев'ю (`RentalPreviewResponse`)
```
basePrice            // базова ціна за обраний період
availableBonusBalance // доступний баланс бонусів
maxBonusUsage        // скільки бонусів можна списати
finalPrice           // підсумкова ціна
```

### Оренда в адмінці (`AdminRentalResponse`)
```
id,
userId, userFullName, userEmail, userPhone,
carId, carBrand, carModel, carRegistrationNumber,
tariffType, startTime, endTime,
totalPrice, bonusUsed, discountAmount,
status,
beforePhotoCount, afterPhotoCount   // к-ть фото до/після
```

### Фото оренди (`RentalPhotoResponse`)
```
id, rentalId, photoType, imageUrl, uploadedAt
```
`photoType` (enum **RentalPhotoType**): `BEFORE` · `AFTER` (макс. 6 фото кожного типу на оренду).

### Профіль користувача (`UserProfileResponse`)
```
id, fullName, email, phone, role, status, referralCode
```
`role` (enum **Role**): `USER` · `ADMIN`.
`status` (enum **UserStatus**): `ACTIVE` · `BLOCKED` · `PENDING`.

### Баланс бонусів (`BonusBalanceResponse`)
```
balance   // число (грн-еквівалент бонусів)
```

### Водійське посвідчення (`LicenseResponse`)
```
id, documentNumber, status, rejectionReason, imageUrl, createdAt
```
`status` (enum **LicenseStatus**): `PENDING` (на перевірці) · `APPROVED` (підтверджене) · `REJECTED` (відхилене, з `rejectionReason`).

### Платіж (`Payment` / LiqPay)
Статуси платежу (enum **PaymentStatus**) та провайдер (enum **PaymentProvider**: LiqPay / mock). Оплата ініціюється для оренди зі статусом `BOOKED`; після успіху оренда стає `ACTIVE`.

### Реферальна система
Кожен користувач має `referralCode`. При реєстрації можна ввести чужий код — обидва отримують бонуси (відображаються як `balance` бонусів).

