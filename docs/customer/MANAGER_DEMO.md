# Customer dashboard — manager demonstration

Use an isolated development database and a test account. Pull both `v2` repositories and run `php artisan migrate` and `php artisan optimize:clear` in the API. Start the API, scheduler and Vite as described in CUSTOMER_TEST_GUIDE.md. Local `OTP_DRIVER=log` and `PAYMENT_DRIVER=fake` are for demonstration only; never process a real card through the fake provider.

1. Open the app. Show loading logo → automatic welcome slides → shopping.
2. Sign in and open Account → Customer dashboard (or the side menu). A new account correctly shows zero orders, not sample customer figures.
3. Show the shopping steps and account links: categories/filters, cart, address, checkout, tracking/reviews, support, saved products, company billing and quote/privacy requests.
4. Add real catalog items to the cart, complete an address, choose a slot and place an online order. Leave payment pending first. Return to the dashboard and click Awaiting online payment; it opens the filtered order and its payment continuation.
5. Complete the simulated payment. Refresh the dashboard. The paid total changes once; double submission must not create a second order. Show order details and the separate payment/delivery states.
6. Place a second order with cash on delivery. It is confirmed and in progress, but does not increase paid spending until cash is actually collected and recorded.
7. Backstage, use the existing development `orders:advance` commands in order to show preparing → ready → on the way → delivered. Explain that this simulates courier operations; no live courier location is claimed. Refresh the dashboard to show completed orders.
8. From a delivered order, submit a product review and an item return/support request. Show its reference, messages and status. Support resolution does not prove a refund.
9. Open Spending from the dashboard. Choose dates, category/seller/status and compare paid/refunded/net figures. The report explicitly includes whole matching orders. Browser CSV uses the same filters.
10. Demonstrate company billing and quotation requests, then saved products and account settings. Switch AR/EN/FR and light/dark.
11. Show ROADMAP_REVIEW.md to distinguish the implemented customer flow from remaining gateway, delivery, invoice, export and operational work. Do not present local helpers as production services.

Dashboard summary is all-time and refreshes every 30 seconds while active; Refresh summary requests a fresh view immediately. Order date filters use Saudi calendar days. All dashboard/report records belong only to the signed-in customer.
