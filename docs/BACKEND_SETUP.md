# Production backend setup (Laravel + MySQL)

The React/Capacitor app must **never connect directly to MySQL/RDS**. The correct production flow is:

React/Capacitor app -> HTTPS Laravel API -> MySQL database

## Recommended tables

- users: id, name, phone, email, password, role
- categories: id, slug, name_ar, name_en, image, active
- sellers: id, user_id, name_ar, name_en, category_id, image, rating, status
- products: id, seller_id, category_id, name_ar, name_en, description_ar, description_en, image, price, stock, featured, active
- favorites: id, user_id, product_id
- addresses: id, user_id, city, address, lat, lng
- orders: id, user_id, number, status, subtotal, delivery_fee, total, payment_method, payment_status, delivery_address_json
- order_items: id, order_id, product_id, seller_id, quantity, unit_price, total
- seller_applications: id, user_id, store_name, phone, category_id, status, notes
- sliders: id, title_ar, title_en, text_ar, text_en, cta_ar, cta_en, image, tone, sort_order, active
- store_settings: id, key, value

## API routes expected by this React project

Public/customer:
- GET /api/v1/bootstrap
- GET /api/v1/products
- POST /api/v1/orders
- GET /api/v1/orders
- POST /api/v1/seller-applications

Authentication (recommended Laravel Sanctum):
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/me

Admin:
- GET /api/v1/admin/dashboard
- POST /api/v1/admin/products
- PATCH /api/v1/admin/products/{id}
- DELETE /api/v1/admin/products/{id}
- CRUD /api/v1/admin/categories
- CRUD /api/v1/admin/sellers
- CRUD /api/v1/admin/sliders
- GET /api/v1/admin/orders
- PATCH /api/v1/admin/orders/{id}/status
- GET /api/v1/admin/seller-applications
- PATCH /api/v1/admin/seller-applications/{id}

## React environment

Copy `.env.example` to `.env` and switch to:

VITE_API_MODE=api
VITE_API_BASE_URL=https://api.your-domain.com

Then build again:

npm run build
npx cap sync android

## Laravel database example

In the Laravel server `.env`:

DB_CONNECTION=mysql
DB_HOST=<RDS endpoint>
DB_PORT=3306
DB_DATABASE=all575
DB_USERNAME=<app database user>
DB_PASSWORD=<strong password>

Do not put these DB credentials in React, Android resources, or the APK.
