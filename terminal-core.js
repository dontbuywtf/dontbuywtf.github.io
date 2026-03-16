/**
 * $DONTBUY_SYSTEM CORE LOGIC
 * PROTECTED ASSET
 */

// Encoded Values:
// p: 333 (Password)
// k: VOID-777-ALPHA (Secret Key)
// m: dontbuythis@proton.me (Contact)
const _0xDATA = {
    p: "MzMz", 
    k: "Vk9JRC03NzctQUxQSEE=",
    m: "ZG9udGJ1eXRoaXNAcHJvdG9uLm1l"
};

const output = document.getElementById('terminal');
const input = document.getElementById('cmd');
const promptSpan = document.getElementById('prompt');

let currentDir = 'root';
let isPrinting = false;

const fileSystem = {
    'root': { 
        dirs: ['logs', 'vault', 'comms'], // Added 'comms' folder
        files: { 
            'manifesto.txt': "THE VOID IS THE ONLY PERMANENT RECORD.",
            'readme.txt': "TYPE 'HELP' TO BEGIN SYSTEM DIAGNOSTICS.",
            'version.sys': "BUILD 2.0.4 - STABLE"
        } 
    },
    'logs': { 
        dirs: [], 
        files: { 
            'session_01.log': "2026-03-16: SNAPSHOT SUCCESSFUL.",
            'session_02.log': "2026-03-17: 333 NEW ENTRIES DETECTED.",
            'error.log': "WARNING: NON-COMPLIANCE DETECTED IN SECTOR 7."
        } 
    },
    'vault': { 
        dirs: ['restricted'], 
        files: { 
            'security_hint.txt': "THE TOTAL SUPPLY IS THE KEY.",
            'access_log.txt': "LAST ACCESS: [REDACTED]"
        } 
    },
    'restricted': {
        dirs: [],
        files: { 
            'void_signal.enc': "ENCRYPTED. USE 'DECRYPT [KEY]'.",
            'frequency.txt': "0.333MHz - OSCILLATION STABLE."
        }
    },
    'comms': {
        dirs: [],
        files: {
            'void_mail.txt': "dontbuythis@proton.me",
            'broadcast.txt': "THE SIGNAL GROWS STRONGER."
        }
    }
};

async function printLines(lines) {
    isPrinting = true;
    input.disabled = true;
    for (let line of lines) {
        const div = document.createElement('div');
        if (line.cls) div.className = line.cls;
        div.textContent = line.text;
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
        await new Promise(r => setTimeout(r, 10));
    }
    isPrinting = false;
    input.disabled = false;
    input.focus();
}

input.addEventListener('keydown', async (e) => {
    // --- TAB AUTOCOMPLETE LOGIC ---
    if (e.key === 'Tab') {
        e.preventDefault(); // Stop the focus from leaving the input
        
        const val = input.value.trim();
        const parts = val.split(' ');
        const currentInput = parts[parts.length - 1].toLowerCase();
        
        if (!currentInput) return;

        const fs = fileSystem[currentDir];
        // Combine dirs and files into one searchable list
        const pool = fs.dirs.concat(Object.keys(fs.files));
        
        // Find matches
        const matches = pool.filter(item => item.toLowerCase().startsWith(currentInput));

        if (matches.length === 1) {
            // One match found: Auto-fill it
            parts[parts.length - 1] = matches[0];
            input.value = parts.join(' ');
        } else if (matches.length > 1) {
            // Multiple matches: Print them so the user knows options
            const historyLine = document.createElement('div');
            historyLine.className = 'cmd-line';
            historyLine.textContent = `> ${matches.join('   ')}`;
            output.appendChild(historyLine);
            output.scrollTop = output.scrollHeight;
        }
        return;
    }

    // --- ENTER KEY LOGIC (Existing) ---
    if (e.key === 'Enter' && !isPrinting) {
        const val = input.value.trim();
        if (!val) return;
        const [cmd, ...args] = val.split(' ');
        const arg = args.join(' ');

        const h = document.createElement('div');
        h.className = 'cmd-line';
        h.textContent = `${promptSpan.textContent} ${val}`;
        output.appendChild(h);
        
        input.value = '';
        await handleCommand(cmd.toLowerCase(), arg);
    }
});

async function handleCommand(cmd, arg) {
    const fs = fileSystem[currentDir];
    switch(cmd) {
        case 'help':
            await printLines([
                {text: "SYSTEM COMMANDS:", cls: "success"},
                {text: "  LS          - List contents"},
                {text: "  CD [DIR]    - Change directory (use 'CD ..' for back)"},
                {text: "  CAT [FILE]  - Read file contents"},
                {text: "  DECRYPT [K] - Unlock encrypted signals"},
                {text: "  CLEAR       - Purge screen"}
            ]);
            break;
        case 'ls':
            let items = fs.dirs.map(d => `[${d.toUpperCase()}]`).concat(Object.keys(fs.files));
            await printLines([{text: items.length ? items.join('   ') : "Empty."}]);
            break;
        case 'cd':
            if (arg === '..') {
                currentDir = 'root';
            } else if (fs.dirs.includes(arg)) {
                currentDir = arg;
            } else {
                await printLines([{text: "ERROR: PATH_NOT_FOUND", cls: "error"}]);
            }
            promptSpan.textContent = `${currentDir}>`;
            break;
        case 'cat':
            if (fs.files[arg]) await printLines([{text: fs.files[arg]}]);
            else await printLines([{text: "ERROR: FILE_NOT_FOUND", cls: "error"}]);
            break;
        case 'decrypt':
            if (window.btoa(arg) === _0xDATA.p) {
                await printLines([
                    {text: "VERIFYING HASH...", cls: "success"},
                    {text: "SIGNAL RECOVERED: " + window.atob(_0xDATA.k)},
                    {text: "REWARD CHANNEL: " + window.atob(_0xDATA.m)}
                ]);
            } else {
                await printLines([{text: "DECRYPTION FAILED. UNAUTHORIZED HASH.", cls: "error"}]);
            }
            break;
        case 'clear':
            output.innerHTML = '';
            break;
        default:
            await printLines([{text: "COMMAND_NOT_RECOGNIZED", cls: "error"}]);
    }
}

window.onload = () => {
    printLines([
        {text: "*** $DONTBUY NODE ACCESS ***", cls: "success"},
        {text: "STATUS: ENCRYPTED CONNECTION ESTABLISHED."},
        {text: "TYPE 'HELP' TO START."},
        {text: " "}
    ]);
};

document.addEventListener('click', () => { if(!isPrinting) input.focus(); });
