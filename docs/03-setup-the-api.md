# Setup the API

> 💡 **Tip**  
> Follow these steps to get started quickly. If you encounter any issues, reach out to our support team at [support@soccersapi.com](mailto:support@soccersapi.com).

---

## 1. Register or Log In
- **Register**: [admin.soccersapi.com/register](https://admin.soccersapi.com/register)  
- **Login**: [admin.soccersapi.com/login](https://admin.soccersapi.com/login)  

Once registered, the **Free Plan** is automatically active (Austria Bundesliga, Australia A-League, Denmark Superligaen).

---

## 2. Access Your Dashboard
Go to your dashboard:  
👉 [admin.soccersapi.com](https://admin.soccersapi.com)

From here you can:
- View your current plan  
- Upgrade to higher plans if needed  
- Manage your tokens and leagues  

---

## 3. Generate an API Token
Create and manage tokens here:  
👉 [admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens)

- Each request requires both `user` (your username) and `token`  
- You can generate multiple tokens for different projects  

---

## 4. Select Your Leagues
Check and manage which leagues are active in your plan:  
👉 [admin.soccersapi.com/leagues](https://admin.soccersapi.com/leagues)  

- Free Plan leagues are pre-selected  
- Paid plans allow you to select from hundreds of leagues  
- Full coverage: [soccersapi.com/coverage](https://soccersapi.com/coverage)  

---

## 5. Start Making API Calls
Use your **username** and **token** in every request.  

Example:
```bash
curl -L -g "https://api.soccersapi.com/v2.2/countries/?user={{USERNAME}}&token={{TOKEN}}"
