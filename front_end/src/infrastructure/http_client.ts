export class HttpClient {

  async requestAsync({ url, method, headers, body, }) {
    const fetchOptions = { method, headers, body };
    const fetchResponse = await fetch(url, fetchOptions);

    return {
      status: fetchResponse.status,
      headers: Object.fromEntries(fetchResponse.headers.entries()),
      body: await fetchResponse.text(),
    };
  }

}