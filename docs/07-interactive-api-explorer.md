# Interactive API Explorer

You can run API calls directly inside our [API Documentation](https://docs.soccersapi.com/) using the built-in **Interactive API Explorer**.  
This allows you to test endpoints in real time without leaving the docs.

---

## 1. Open an Endpoint Page
Navigate to the endpoint you want to test (for example, **Get Countries**).  

![Screenshot 2025-09-28 at 16.46.59.png](https://api.apidog.com/api/v1/projects/479149/resources/362655/image-preview)

---

## 2. Click **Try It Out**
At the top of the request panel, click the **Try It Out** button.  

![Screenshot 2025-09-28 at 16.49.15.png](https://api.apidog.com/api/v1/projects/479149/resources/362656/image-preview)

---

## 3. Select the Environment
Choose the default environment, which is already preloaded with:  
- `{{BASE_URL}}` → `https://api.soccersapi.com`  
- `{{USERNAME}}` → your account username  
- `{{TOKEN}}` → your API token  


![Screenshot 2025-09-28 at 16.55.26.png](https://api.apidog.com/api/v1/projects/479149/resources/362667/image-preview)

---

## 4. Send the Request
Click **Send** to launch the request.  
The **Response panel** will show:  
- Status code (e.g., 200 OK, 401 Unauthorized)  
- Response time  
- Full JSON payload  


![Screenshot 2025-09-28 at 16.53.41.png](https://api.apidog.com/api/v1/projects/479149/resources/362663/image-preview)

---

## 5. Example: Test Countries Endpoint
```bash
curl -L -g "https://api.soccersapi.com/v2.2/countries/?user={{USERNAME}}&token={{TOKEN}}"
