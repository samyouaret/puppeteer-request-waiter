import * as http from "http";
import * as puppeteer from 'puppeteer'
import ResponseWaiter from '../src/ResponseWaiter'

const PORT: number = 5000;
const URL: string = `http://localhost:${PORT}`;

let server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    console.log('the url ', req.url);
    if (req.url == '/test-calls') {
        console.log("test call received");
        setTimeout(() => {
            res.end("success call");
        }, 200);
    } else if (req.url == '/') {
        console.log("main page requests .....");

        res.end(`
        <html>
    <script>
    window.addEventListener('DOMContentLoaded', (event) => {
    for (let i = 0; i < 10; i++) {
        fetch('${URL}/test-calls');
    }
    });
  </script>
  </html>`);
    }
});

beforeEach((done) => {
    server.listen(PORT, () => {
        console.log("start listening");
        done();
    });
})


afterEach((done) => {
    server.close(() => {
        console.log("closing the server");
        done();
    });
})

it('should wait for all requests', async () => {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();
    let responseWaiter = new ResponseWaiter(page, {
        timeout: 100
    });
    responseWaiter.listen();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await responseWaiter.waitForResponsesToFinish();
    expect(responseWaiter.getRequestsCount()).toBe(0);
    responseWaiter.stopListening();
    await browser.close();
});