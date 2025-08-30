

import puppeteer from "puppeteer-core";

(async () => {
  const browser = await puppeteer.connect({
    browserURL: "http://localhost:9222",
    defaultViewport: null,
  });

  const page = await browser.newPage();
  // 🟢 Lắng nghe tất cả request gửi ra
  setInterval(async () => {
    console.log("🟢 Refesh recaptchatoken");
    const button = await page.$('button.css-15509m4');
    await button.click();
  }, 60000);
  page.on("request", async (req) => {
    if(req.url() == 'https://api.peeranha.io/blockchain/sui-sign-sponsored-transaction'){
      const recapcha = req.headers()['recaptchatoken'];
      if(recapcha){
        console.log('recapcha',recapcha);
        const tx = await fetchSponsoredTransaction(recapcha);
        console.log('tx',tx);
      }
      
    }
    
  });


  await page.goto("https://sui.peera.ai/experts/3-0x0379c492da263f5fd745312b9829f3ef1304b720b4c40070af574b47ca691c0c/how-to-maximize-profit-holding-sui-sui-staking-vs-liquid-staking", { waitUntil: "networkidle2" });

  console.log("✅ Brave đã mở đúng profile + extension");
})();



async function fetchSponsoredTransaction(recaptchaToken) {
  const response = await fetch("https://api.peeranha.io/blockchain/sui-sign-sponsored-transaction", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "accept-language": "en-US,en;q=0.5",
      "authorization": "", // <-- Nếu có token thì cần thêm ở đây
      "content-type": "application/json",
      "origin": "https://sui.peera.ai",
      "priority": "u=1, i",
      "recaptchatoken":recaptchaToken,
      "referer": "https://sui.peera.ai/",
      "sec-ch-ua": '"Not;A=Brand";v="99", "Brave";v="139", "Chromium";v="139"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1",
      "user-agent": navigator.userAgent,
    },
    body: JSON.stringify({
      sender: "0xb4082d2f32c4ae5ac774cb266d7ffa5d80488fa257c40023e4ec5e4980e121bb",
      module: "postLib",
      action: "votePost",
      arguments: [
        "0x4e8e0af080120050de81412dba19d8f3da07bb1e94fcb8b65dcf2a7673c51d0a",
        "0x155d5bd0383fd47248a2738414d983b967036c3f00c8687be5a4c7b80d885b98",
        "0xeb65c2e13196e266bd1e94360988e5cea40b5cc0ebdc5a82d5b7968ede390402",
        "0x3623af8de002523a1587864081e51aff5b7e59eb78c63d933ead6ad583c0c4d2",
        "0x0379c492da263f5fd745312b9829f3ef1304b720b4c40070af574b47ca691c0c",
        true
      ]
    })
  });

  const result = await response.json();
  return result;
} 