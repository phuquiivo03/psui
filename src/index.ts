import {
  getFullnodeUrl,
  SuiClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import puppeteer, { Browser, Page, HTTPRequest } from "puppeteer-core";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
// Types
interface SponsoredTransactionResponse {
  signatureBytes: string;
}

interface TransactionResult {
  digest: string;
  effects: any;
}

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

(async (): Promise<void> => {
  try {
    const browser: Browser = await puppeteer.connect({
      browserURL: "http://localhost:9222",
      defaultViewport: null,
    });

    const page: Page = await browser.newPage();

    // 🟢 Lắng nghe tất cả request gửi ra
    setInterval(async (): Promise<void> => {
      try {
        console.log("🟢 Refresh recaptchatoken");
        const button = await page.$("button.css-15509m4");
        if (button) {
          await button.click();
        }
      } catch (error) {
        console.error("Error clicking button:", error);
      }
    }, 10000);

    page.on("request", async (req: HTTPRequest): Promise<void> => {
      if (
        req.url() ===
        "https://api.peeranha.io/blockchain/sui-sign-sponsored-transaction"
      ) {
        const recaptcha: string | undefined = req.headers()["recaptchatoken"];
        if (recaptcha) {
          console.log("recaptcha", recaptcha);
          try {
            const tx = await fetchSponsoredTransaction(recaptcha);
            console.log("tx", tx);
          } catch (error) {
            console.error("Error fetching sponsored transaction:", error);
          }
        }
      }
    });

    await page.goto(
      "https://sui.peera.ai/experts/3-0x0379c492da263f5fd745312b9829f3ef1304b720b4c40070af574b47ca691c0c/how-to-maximize-profit-holding-sui-sui-staking-vs-liquid-staking",
      { waitUntil: "networkidle2" }
    );

    console.log("✅ Brave đã mở đúng profile + extension");
  } catch (error) {
    console.error("Error in main function:", error);
  }
})();

async function fetchSponsoredTransaction(
  recaptchaToken: string
): Promise<SuiTransactionBlockResponse> {
  try {
    const decoded = decodeSuiPrivateKey(
      "suiprivkey1qrugyg6y4v7q5acq468pgjkp04s2ftuku22tlsrhcgqharh7rv22yyc0su0"
    );
    const keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);

    const txb = new Transaction();
    txb.moveCall({
      target: `0xafa3e6b3070c5c5683ea78ca5529758dbf46ddeaca8d4045c6185c48577361ab::postLib::voteReply`,
      arguments: [
        txb.object(
          "0x4e8e0af080120050de81412dba19d8f3da07bb1e94fcb8b65dcf2a7673c51d0a"
        ),
        txb.object(
          "0x155d5bd0383fd47248a2738414d983b967036c3f00c8687be5a4c7b80d885b98"
        ),
        txb.object(
          "0xeb65c2e13196e266bd1e94360988e5cea40b5cc0ebdc5a82d5b7968ede390402"
        ),
        txb.object(
          "0xe10eaeb92d04ab572b8b5eeadf1410d527ceaaab5a13dd8ab250873fe07255ea"
        ),
        txb.object(
          "0x0379c492da263f5fd745312b9829f3ef1304b720b4c40070af574b47ca691c0c"
        ),
        txb.pure.u8(8),
        txb.pure.bool(true),
      ],
    });

    const { bytes, signature } = await txb.sign({ client, signer: keypair });

    const response = await fetch(
      "https://api.peeranha.io/blockchain/sui-sign-sponsored-transaction",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "accept-language": "en-US,en;q=0.5",
          authorization: "", // <-- Nếu có token thì cần thêm ở đây
          "content-type": "application/json",
          origin: "https://sui.peera.ai",
          priority: "u=1, i",
          recaptchatoken: recaptchaToken,
          referer: "https://sui.peera.ai/",
          "sec-ch-ua":
            '"Not;A=Brand";v="99", "Brave";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "sec-gpc": "1",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          sender:
            "0x88f9ff30386b0d612cb7b05aeb973f327b60f4d32211ec6ab916bed8efc72ffc",
          module: "postLib",
          action: "votePost",
          arguments: [
            "0x4e8e0af080120050de81412dba19d8f3da07bb1e94fcb8b65dcf2a7673c51d0a",
            "0x155d5bd0383fd47248a2738414d983b967036c3f00c8687be5a4c7b80d885b98",
            "0xeb65c2e13196e266bd1e94360988e5cea40b5cc0ebdc5a82d5b7968ede390402",
            "0xe10eaeb92d04ab572b8b5eeadf1410d527ceaaab5a13dd8ab250873fe07255ea",
            "0x0379c492da263f5fd745312b9829f3ef1304b720b4c40070af574b47ca691c0c",
            true,
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tx: SponsoredTransactionResponse = await response.json();

    console.log("Success fetch sponsored transaction - start push onchain", tx);
    const result: SuiTransactionBlockResponse =
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: [signature, tx.signatureBytes],
        options: {
          showEffects: true,
        },
      });

    return result;
  } catch (error) {
    console.error("Error in fetchSponsoredTransaction:", error);
    throw error;
  }
}
