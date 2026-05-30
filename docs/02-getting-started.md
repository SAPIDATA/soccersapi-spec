# Getting Started

Welcome to **Soccer’s API**! Follow these steps to create your account, activate your plan, and start making your first API calls.

---

## 1. Create Your Account
- **Login**: [admin.soccersapi.com/login](https://admin.soccersapi.com/login)  
- **Register**: [admin.soccersapi.com/register](https://admin.soccersapi.com/register)  

> Registration is free and only takes a minute.

---

## 2. Access Your Dashboard
Once registered, your **Free Plan is instantly available** — no credit card required.  
👉 [admin.soccersapi.com](https://admin.soccersapi.com)

The Free Plan includes **3 major leagues**:
- Austria Bundesliga  
- Australia A-League  
- Denmark Superligaen  

This lets you quickly start testing the API with real data.

---

## 3. Upgrade Anytime
Need more leagues or higher request limits?  
👉 [admin.soccersapi.com/subscriptions](https://admin.soccersapi.com/subscriptions)

All paid plans include:  
- **50% discount on the first billing period** (first month or first year)  
- **20% discount on yearly billing** compared to monthly  

👉 See full [Pricing Details](https://soccersapi.com/pricing)

---

## 4. Generate an API Token
Create and manage your API tokens:  
👉 [admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens)

Use your **username** and **token** in every request:  

## 5. Select Your Leagues

Free Plan leagues are already unlocked. For paid plans, choose your leagues here:  
👉 [admin.soccersapi.com/leagues](https://admin.soccersapi.com/leagues)

Full coverage list: [soccersapi.com/coverage](https://soccersapi.com/coverage)

---

## 6. Explore the Documentation

Full API reference and examples:  
👉 [docs.soccersapi.com](https://docs.soccersapi.com)

Key starting points:
- Introduction
- Global Parameters
- Recipes & Examples

---

## 7. Start Making Requests

With your token and Free Plan leagues, you can test right away.

### Example: Get Austria Bundesliga (Free Plan)
```bash
curl -L -g "https://api.soccersapi.com/v2.2/league/?user={{USERNAME}}&token={{TOKEN}}&id=1004"
