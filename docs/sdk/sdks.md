# Thotsakan Mail Engine - Multi-Language SDK Snippets (7 Languages)

## 1. C# / .NET 8 (`System.Net.Http.Json`)
```csharp
using System.Net.Http.Json;

public class MailSender
{
    private static readonly HttpClient client = new HttpClient();

    public static async Task SendOtpAsync(string recipient, string code, string apiKey)
    {
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var payload = new
        {
            to = recipient,
            subject = $"Your OTP Code: {code}",
            html = $"<p>Your one-time password is <b>{code}</b></p>",
            priority = "high",
            async = false
        };

        var response = await client.PostAsJsonAsync("http://localhost:3000/v1/emails/send", payload);
        response.EnsureSuccessStatusCode();
    }
}
```

---

## 2. Java 17+ (`java.net.http.HttpClient`)
```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ThotsakanClient {
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void sendEmail(String to, String subject, String html, String apiKey) throws Exception {
        String json = """
            {
                "to": "%s",
                "subject": "%s",
                "html": "%s",
                "priority": "normal",
                "async": true
            }
        """.formatted(to, subject, html);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/v1/emails/send"))
            .header("Content-Type", "application/json")
            .header("X-API-Key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
```

---

## 3. TypeScript / Node.js
```typescript
export async function sendEmail(to: string, subject: string, html: string, apiKey: string) {
  const res = await fetch('http://localhost:3000/v1/emails/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ to, subject, html, priority: 'normal', async: true }),
  });
  return await res.json();
}
```

---

## 4. Python 3 (`requests` or `httpx`)
```python
import requests

def send_email(to_email: str, subject: str, html_body: str, api_key: str):
    url = "http://localhost:3000/v1/emails/send"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }
    payload = {
        "to": to_email,
        "subject": subject,
        "html": html_body,
        "priority": "normal",
        "async": True
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

---

## 5. PHP / Laravel
```php
<?php
use Illuminate\Support\Facades\Http;

function sendThotsakanMail(string $to, string $subject, string $html, string $apiKey) {
    return Http::withHeaders([
        'X-API-Key' => $apiKey,
    ])->post('http://localhost:3000/v1/emails/send', [
        'to' => $to,
        'subject' => $subject,
        'html' => $html,
        'priority' => 'normal',
        'async' => true,
    ])->json();
}
```

---

## 6. Go (`net/http`)
```go
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type EmailPayload struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	HTML     string `json:"html"`
	Priority string `json:"priority"`
	Async    bool   `json:"async"`
}

func SendEmail(to, subject, html, apiKey string) error {
	payload := EmailPayload{
		To:       to,
		Subject:  subject,
		HTML:     html,
		Priority: "normal",
		Async:    true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "http://localhost:3000/v1/emails/send", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", apiKey)

	client := &http.Client{}
	_, err := client.Do(req)
	return err
}
```

---

## 7. cURL / Shell
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "developer@example.com",
    "subject": "System Deployment Completed",
    "html": "<h3>Release v1.0 is Live!</h3>",
    "priority": "normal",
    "async": true
  }'
```
