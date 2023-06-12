import { HttpClient } from "./http_client.js";

export class BackEndClient {
  private _httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this._httpClient = httpClient;
  }

  async sayAsync(message: string): Promise<string> {
    await this._httpClient.requestAsync({
      url: "http://localhost:5020/say",
      method: "post",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message }),
    });

    return "tbd";
  }
}