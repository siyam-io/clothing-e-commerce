# E-Commerce Production Load & Stress Testing (k6)

This load-testing suite tests high-concurrency real-user traffic using **dynamic data extraction directly from your database** (products, sizes, stock, categories, subcategories, reviews, banners, layouts, settings, and orders).

---

## 🚀 Quick Execution Commands

In PowerShell from the project root:

### 1. Huge Random Activity Test (Staged 50 -> 200 -> 500 Concurrent Users)
Simulates massive, 100% randomized user activity: random products, random sizes, COD orders, random page hopping, reviews, search, and banners.
```powershell
.\load-tests\run-load-test.ps1 -Scenario huge
```

### 2. Custom Random Activity (Specify your own VUs & Duration)
```powershell
# E.g. 100 Users for 45 seconds:
.\load-tests\run-load-test.ps1 -Scenario random -VUs 100 -Duration 45s

# E.g. 500 Users for 2 minutes:
.\load-tests\run-load-test.ps1 -Scenario random -VUs 500 -Duration 2m
```

### 3. Quick Verification (100 Real Users, 30s)
```powershell
.\load-tests\run-load-test.ps1 -Scenario quick
```

### 4. Smoke Test (5 Users, Quick Check)
```powershell
.\load-tests\run-load-test.ps1 -Scenario smoke
```

### 5. High Load Test (1,000 Real Users, 1 min)
```powershell
.\load-tests\run-load-test.ps1 -Scenario 1k
```

### 6. Stress Test (5,000 Real Users, 2 mins)
```powershell
.\load-tests\run-load-test.ps1 -Scenario 5k
```

### 7. Peak Flash-Sale Staged Test (Up to 10,000 Concurrent Real Users)
```powershell
.\load-tests\run-load-test.ps1 -Scenario 10k
```

---

## 🎯 Realistic Real-Data Actions Simulating 100% Real Traffic

| Persona Action | % Traffic | Description |
|---|---|---|
| **Random Product & Random Size Purchase** | 30% | Randomly picks ANY product across all 250+ products in the catalog, randomly selects an available size (S, M, L, XL, etc.), generates authentic Bangladeshi customer data (Dhaka, Chattogram, Sylhet, etc.), places real COD order, logs `⚡ [LIVE-ORDER]`, and immediately fetches the order receipt. |
| **Random Catalog Page Hopping** | 25% | Randomly hops across all catalog pages (`?page=1..N`), random limits (8, 12, 16, 24), random sorting (`-createdAt`, `price`, `-price`, `featured`, `rating`), random category filters, and dynamic price ranges. |
| **Product Deep Dive & Reviews** | 20% | Pulls product details by slug (`/api/products/details/:slug`) and fetches customer reviews (`/api/reviews/product/:id`). |
| **Dynamic Store Search** | 15% | Searches products using dynamic keywords (`shirt`, `pant`, `jeans`, `cotton`, `denim`, `jacket`, etc.) or random words from product titles with pagination. |
| **Promotions & Store Information** | 10% | Fetches modular home layout (`/api/home-layouts/active`), active banner campaigns (`/api/banner-campaigns/active`), flash sales (`/api/flash-sales/active`), and store settings (`/api/settings`). |

---

## ⚡ Live Real-Time Console Logging

Whenever a virtual user places an order, you will see real-time updates in your terminal:
```text
⚡ [LIVE-ORDER] #49A02C46 | Customer: Hasan Mahmud | Product: "Women's Cotton Blouse 11" | Size: S | Qty: 2
⚡ [LIVE-ORDER] #49A02C4F | Customer: Shamim Reza | Product: "Boys' Polo Shirt 10" | Size: 6-7Y | Qty: 1
⚡ [LIVE-ORDER] #49A02C3D | Customer: Sayedur Rahman | Product: "Women's Jogger Pants 22" | Size: L | Qty: 2
⚡ [LIVE-ORDER] #49A02D0D | Customer: Rubina Parveen | Product: "Men's Denim Shorts 18" | Size: XXL | Qty: 1
```
