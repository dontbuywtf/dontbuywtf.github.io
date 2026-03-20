const output = document.getElementById('terminal');
const input = document.getElementById('cmd');
const promptSpan = document.getElementById('prompt');
const RPC_NODE = "https://xrplcluster.com";

let isPrinting = false;

const HELP_LIB = {
    "lookup": [
        {text: "--- COMMAND: LOOKUP ---", cls: "info"},
        {text: "USAGE:  LOOKUP [R-ADDRESS]"},
        {text: "ACTION: Scans the live XRPL for account data."},
        {text: "OUTPUT: Balance, USD Value, Top Assets, and Last 10 TXs."},
        {text: " "}
    ],
    "verify": [
        {text: "--- COMMAND: VERIFY ---", cls: "info"},
        {text: "USAGE:  VERIFY [TX-HASH]"},
        {text: "ACTION: Conducts deep forensics on a transaction."},
        {text: "OUTPUT: Participants, Memos, Fees, and Ledger impact."},
        {text: " "}
    ]
};

// --- HELPERS ---

function parseCurrency(code) {
    if (!code) return "UNKNOWN";
    
    // 1. Check for AMM LP Tokens (Always 40 chars starting with 03)
    if (code.length === 40 && code.startsWith("03")) {
        return "LP-TOKEN"; 
    }

    // 2. Handle Standard 3-character codes (USD, XRP, etc.)
    if (code.length !== 40) return code;

    // 3. Handle 160-bit Hex codes (DONTBUY, RLUSD, etc.)
    try {
        let decoded = "";
        for (let i = 0; i < code.length; i += 2) {
            const charCode = parseInt(code.substr(i, 2), 16);
            if (charCode >= 32 && charCode <= 126) {
                decoded += String.fromCharCode(charCode);
            }
        }
        const cleanName = decoded.trim();
        return (cleanName && cleanName.toLowerCase() !== "xrp") ? cleanName : "TOKEN";
    } catch (e) {
        return "TOKEN";
    }
}

async function getXRPPrice() {
    try {
        const res = await fetch("https://api.coingecko.com/api/v1/simple/price?ids=ripple&vs_currencies=usd");
        const data = await res.json();
        return data.ripple.usd;
    } catch (e) { return null; }
}

async function printLines(lines) {
    isPrinting = true;
    input.disabled = true;
    for (let line of lines) {
        const div = document.createElement('div');
        if (line.cls) div.className = line.cls;
        div.textContent = line.text;
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
        await new Promise(r => setTimeout(r, 15));
    }
    isPrinting = false;
    input.disabled = false;
    input.focus();
}

async function fetchRPC(method, params) {
    try {
        const res = await fetch(RPC_NODE, {
            method: "POST",
            body: JSON.stringify({ method, params: [params] })
        });
        return await res.json();
    } catch (e) { return { error: true }; }
}

// --- CORE COMMAND LOGIC ---

async function handleCommand(val) {
    const parts = val.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch(cmd) {
        case 'help':
            if (arg) {
                const topic = arg.toLowerCase();
                if (HELP_LIB[topic]) {
                    await printLines(HELP_LIB[topic]);
                } else {
                    await printLines([{text: `ERROR: TOPIC '${topic}' NOT FOUND IN MANUAL.`, cls: "error"}]);
                }
            } else {
                await printLines([
                    {text: "--- $DONTBUY COMMAND MANUAL ---", cls: "success"},
                    {text: "LOOKUP [ADDR]  - Scan live wallet balance"},
                    {text: "VERIFY [HASH]  - Validate transaction data"},
                    {text: "HELP [TOPIC]   - Detailed info (Ex: HELP LOOKUP)"},
                    {text: "CLEAR          - Purge terminal display"},
                    {text: " "}
                ]);
            }
            break;

        case 'lookup':
            if (!arg) { await printLines([{text: "ERROR: PROVIDE ADDRESS", cls: "error"}]); break; }
            await printLines([{text: `INITIATING FULL SYSTEM TRACE: ${arg.substring(0,12)}...`, cls: "info"}]);

            const [acc, lines, usdPrice] = await Promise.all([
                fetchRPC("account_info", { account: arg, ledger_index: "validated" }),
                fetchRPC("account_lines", { account: arg }),
                getXRPPrice()
            ]);

            if (!acc.result?.account_data) {
                await printLines([{text: "ERROR: ACCOUNT_NOT_FOUND", cls: "error"}]);
                break;
            }

            const [activationHistory, recentHistory] = await Promise.all([
                fetchRPC("account_tx", { account: arg, ledger_index_min: -1, forward: true, limit: 1 }), 
                fetchRPC("account_tx", { 
                    account: arg, 
                    ledger_index_min: -1, 
                    ledger_index_max: -1, 
                    forward: false, 
                    limit: 10 
                })
            ]);

            const d = acc.result.account_data;
            const xrpBal = d.Balance / 1000000;
            
            let tokenLines = [];
            if (lines.result?.lines) {
                const top5 = lines.result.lines
                    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
                    .slice(0, 5);
                tokenLines = top5.map(t => ({
                    text: `${parseCurrency(t.currency).padEnd(12)} | ${parseFloat(t.balance).toFixed(6)}`
                }));
            }

            const firstTx = activationHistory.result?.transactions?.[0]?.tx;
            const txs = recentHistory.result?.transactions || [];
            let activationDate = "UNKNOWN", activatedBy = "GENESIS_BLOCK";
            if (firstTx) {
                activationDate = new Date((firstTx.date + 946684800) * 1000).toUTCString();
                activatedBy = firstTx.Account;
            }

            let outputLines = [
                {text: "--- CORE ORIGIN REPORT ---", cls: "success"},
                {text: `ACTIVATED: ${activationDate}`},
                {text: `PARENT:    ${activatedBy}`},
                {text: " "},
                {text: "--- ASSET SUMMARY ---", cls: "success"},
                {text: `XRP:       ${xrpBal.toFixed(6)} XRP`},
                {text: `SEQUENCE:  ${d.Sequence}`},
                {text: `PREV_TX:   ${String(d.PreviousTxnID)}`},
                {text: " "}
            ];

            if (tokenLines.length > 0) {
                outputLines.push({text: "TOP ASSETS:  CURRENCY     | BALANCE (6 DP)", cls: "info"});
                tokenLines.forEach(tl => outputLines.push(tl));
                outputLines.push({text: " "});
            }

            outputLines.push(
                {text: "--- RECENT ACTIVITY (LAST 10) ---", cls: "success"},
                {text: "DIR | TYPE       | AMOUNT             | HASH", cls: "info"}
            );

           txs.forEach((item, index) => {
                const tx = item.tx;
                const isOut = tx.Account === arg;
                const isTrust = tx.TransactionType === "TrustSet";
                
                if (tx.Amount && typeof tx.Amount === "string" && parseFloat(tx.Amount) >= 1000000000000000) return; 
                if (tx.hash === "9361A439ADA8FD32B94B1F49C981A6578484E207FFEDE66A9ABA999905B53371") return;
                if (isTrust && tx.LimitAmount && parseFloat(tx.LimitAmount.value) === 0) return;

                let dir = isOut ? "OUT" : "IN ";
                if (isTrust) dir = "SET";
                
                let amt = "0.000000";
                if (tx.Amount) {
                    if (typeof tx.Amount === "string") {
                        amt = (tx.Amount / 1000000).toFixed(6) + " XRP";
                    } else {
                        amt = `${parseFloat(tx.Amount.value).toFixed(6)} ${parseCurrency(tx.Amount.currency)}`;
                    }
                } else if (tx.LimitAmount) {
                    amt = `${parseFloat(tx.LimitAmount.value).toFixed(6)} ${parseCurrency(tx.LimitAmount.currency)}`;
                } else if (tx.TakerGets) { 
                    amt = "DEX_OFFER"; 
                }
                
                outputLines.push({
                    text: `${dir} | ${tx.TransactionType.substring(0, 10).padEnd(10)} | ${amt.padEnd(18)} | ${tx.hash}`,
                    cls: isTrust ? "info" : (isOut ? "error" : "success")
                });

                if (index < txs.length - 1) {
                    outputLines.push({
                        text: "------------------------------------------------------------", 
                        cls: "dim"
                    });
                }
            });

            outputLines.push({text: " ", cls: ""}, {text: "SYSTEM_SCAN: COMPLETE", cls: "info"});
            await printLines(outputLines);
            break;

        case 'verify':
            if (!arg) { await printLines([{text: "ERROR: PROVIDE HASH", cls: "error"}]); break; }
            await printLines([{text: `DEEP-SCANNING HASH: ${arg.substring(0,12)}...`, cls: "info"}]);
            const txData = await fetchRPC("tx", { transaction: arg });
            
            if (txData.result && !txData.error) {
                const t = txData.result;
                const meta = t.meta;
                const date = new Date((t.date + 946684800) * 1000).toUTCString();
                
                let desc = `${t.Account} initiated a ${t.TransactionType}.`;
                if (t.TransactionType === "OfferCreate") {
                    const pay = typeof t.TakerGets === "string" ? `${(t.TakerGets/1000000).toFixed(6)} XRP` : `${parseFloat(t.TakerGets.value).toFixed(6)} ${parseCurrency(t.TakerGets.currency)}`;
                    const recv = typeof t.TakerPays === "string" ? `${(t.TakerPays/1000000).toFixed(6)} XRP` : `${parseFloat(t.TakerPays.value).toFixed(6)} ${parseCurrency(t.TakerPays.currency)}`;
                    desc = `${t.Account} offered ${pay} to receive ${recv}.`;
                } else if (t.TransactionType === "TrustSet") {
                    const limit = `${parseFloat(t.LimitAmount.value).toFixed(6)} ${parseCurrency(t.LimitAmount.currency)}`;
                    desc = `${t.Account} set a trustline limit of ${limit} for issuer ${t.LimitAmount.issuer}.`;
                } else if (t.Amount) {
                    const amtVal = typeof t.Amount === "string" ? `${(t.Amount/1000000).toFixed(6)} XRP` : `${parseFloat(t.Amount.value).toFixed(6)} ${parseCurrency(t.Amount.currency)}`;
                    desc = `${t.Account} sent ${amtVal} to ${t.Destination}.`;
                }

                let memo = "NONE";
                if (t.Memos && t.Memos[0]?.Memo?.MemoData) {
                    try {
                        const hex = t.Memos[0].Memo.MemoData;
                        let str = "";
                        for (let i = 0; i < hex.length; i += 2) {
                            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                        }
                        memo = decodeURIComponent(escape(str)); 
                    } catch(e) { memo = "HEX_ENCODED_DATA"; }
                }

                const affectedNodes = meta.AffectedNodes ? meta.AffectedNodes.length : 0;
                const created = meta.AffectedNodes.filter(n => n.CreatedNode).length;
                const modified = meta.AffectedNodes.filter(n => n.ModifiedNode).length;
                const deleted = meta.AffectedNodes.filter(n => n.DeletedNode).length;
                
                await printLines([
                    {text: "--- TRANSACTION MANIFEST ---", cls: "success"},
                    {text: `STATUS:    ${meta.TransactionResult === "tesSUCCESS" ? "SUCCESS" : "FAILED"}`},
                    {text: `VALIDATED: ${date}`},
                    {text: `LEDGER:    ${t.ledger_index}`},
                    {text: " "},
                    {text: "--- DESCRIPTION ---", cls: "success"},
                    {text: `ACTION:    ${desc}`},
                    {text: `COST:      ${(t.Fee / 1000000).toFixed(6)} XRP (BURNED)`},
                    {text: `MEMO:      "${memo}"`},
                    {text: " "},
                    {text: "--- NETWORK IMPACT ---", cls: "success"},
                    {text: `NODES:     ${affectedNodes} Affected (${created}+ ${modified}~ ${deleted}-)`},
                    {text: `OWNER:     ${t.Account}`},
                    {text: " "},
                    {text: "SYSTEM_SCAN: COMPLETE", cls: "info"}
                ]);
            } else { await printLines([{text: "ERROR: HASH_NOT_FOUND", cls: "error"}]); }
            break;

        case 'clear':
            output.innerHTML = '';
            break;
    } 
} 

// --- EVENT LISTENERS ---

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !isPrinting) {
        const val = input.value.trim();
        if (!val) return;
        const h = document.createElement('div');
        h.className = 'cmd-line';
        h.textContent = `EXPLORER> ${val}`;
        output.appendChild(h);
        input.value = '';
        await handleCommand(val);
    }
});

window.onload = () => {
    printLines([
        {text: "*** $DONTBUY LIVENET EXPLORER ***", cls: "success"},
        {text: "CONNECTION: ESTABLISHED TO XRPL_MAINNET"},
        {text: "TYPE 'HELP' TO DISPLAY THE LIST OF COMMANDS."},
        {text: " "}
    ]);
};