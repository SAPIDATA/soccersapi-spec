# Getting Started

Welcome to **Soccer’s API**! Follow these steps to create your account, activate your plan, and start making your first API calls.

---

## 1. Create Your Account
- **Login**: [admin.soccersapi.com/login](https://admin.soccersapi.com/login)  
- **Register**: [admin.soccersapi.com/register](https://admin.soccersapi.com/register)  

> Registration is free and only takes a minute.

---

## 2. Access Your Dashboard
Once registered, open the dashboard to see the trial or plan currently assigned
to the account. Trial terms and included leagues can change; the dashboard is
the source of truth.
👉 [admin.soccersapi.com](https://admin.soccersapi.com)

Use one of the leagues shown as active in the dashboard for the first test call.

---

## 3. Upgrade Anytime
Need more leagues or higher request limits?  
👉 [admin.soccersapi.com/subscriptions](https://admin.soccersapi.com/subscriptions)

Current pricing, discounts, billing periods and request tiers are listed on the
[Pricing page](https://soccersapi.com/pricing).

---

## 4. Generate an API Token
Create and manage your API tokens:  
👉 [admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens)

Use your **username** and **token** in every request:  

## 5. Select Your Leagues

View and manage the leagues enabled for the account here:
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

With a token and a league enabled in the dashboard, you can make a test request.

### Example: Get a league by ID
```bash
curl -L -g "https://api.soccersapi.com/v2.2/leagues/?user={{USERNAME}}&token={{TOKEN}}&t=info&id=1005"
```

Replace `1005` with an enabled league ID from the account if necessary.

Every v2.2 resource uses an operation selector such as `t=info`, `t=list` or
`t=live`. Check the endpoint reference for the accepted value and any
operation-specific parameters.
