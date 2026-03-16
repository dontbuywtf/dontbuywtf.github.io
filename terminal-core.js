/**
 * $DONTBUY_SYSTEM CORE LOGIC
 * PROTECTED ASSET
 */

// Encoded Values:
// l: SIGNAL (Login Key)
// p: 333 (Password)
// k: VOID-777-ALPHA (Secret Key)
// m: dontbuythis@proton.me (Contact)
const _0xDATA = {
    l: "U0lHTkFM", 
    p: "MzMz", 
    k: "Vk9JRC03NzctQUxQSEE=",
    m: "ZG9udGJ1eXRoaXNAcHJvdG9uLm1l"
};

const output = document.getElementById('terminal');
const input = document.getElementById('cmd');
const promptSpan = document.getElementById('prompt');

let currentDir = 'root';
let isPrinting = false;
let isAuthenticated = false; // System state: locked

const fileSystem = {
    'root': { 
        dirs: ['files', 'logs', 'temp' 'vault', 'comms'],
        files: { 
            'manifesto.txt': "THE VOID IS THE ONLY PERMANENT RECORD.",
            'readme.txt': "TYPE 'HELP' TO BEGIN SYSTEM DIAGNOSTICS.",
            'version.sys': "BUILD 2.0.4 - STABLE"
        } 
    },
    'files': { 
        dirs: ['Common files', 'Wallets', 'Snapshots'], 
        files: { 
            'session_01.log': "2026-03-16: SNAPSHOT SUCCESSFUL.",
            'session_02.log': "2026-03-17: 333 NEW ENTRIES DETECTED.",
            'error.log': "WARNING: NON-COMPLIANCE DETECTED IN SECTOR 7."
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
        e.preventDefault();
        
        // Disable autocomplete if not logged in
        if (!isAuthenticated) return;

        const val = input.value.trim();
        const parts = val.split(' ');
        const currentInput = parts[parts.length - 1].toLowerCase();
        
        if (!currentInput) return;

        const fs = fileSystem[currentDir];
        const pool = fs.dirs.concat(Object.keys(fs.files));
        const matches = pool.filter(item => item.toLowerCase().startsWith(currentInput));

        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            input.value = parts.join(' ');
        } else if (matches.length > 1) {
            const historyLine = document.createElement('div');
            historyLine.className = 'cmd-line';
            historyLine.textContent = `> ${matches.join('   ')}`;
            output.appendChild(historyLine);
            output.scrollTop = output.scrollHeight;
        }
        return;
    }

    // --- ENTER KEY LOGIC ---
    if (e.key === 'Enter' && !isPrinting) {
        const val = input.value.trim();
        if (!val) return;
        
        // Log the command to terminal
        const h = document.createElement('div');
        h.className = 'cmd-line';
        // For login, we hide the password in the history for safety
        h.textContent = isAuthenticated ? `${promptSpan.textContent} ${val}` : `${promptSpan.textContent} ********`;
        output.appendChild(h);
        
        const [cmd, ...args] = val.split(' ');
        const arg = args.join(' ');

        input.value = '';
        await handleCommand(cmd.toLowerCase(), arg);
    }
});

async function handleCommand(cmd, arg) {
    // --- LOGIN GATE LOGIC ---
    if (!isAuthenticated) {
        if (window.btoa(cmd.toUpperCase()) === _0xDATA.l) {
            isAuthenticated = true;
            promptSpan.textContent = "root>";
            await printLines([
                {text: "ACCESS GRANTED.", cls: "success"},
                {text: "AUTHENTICATION SUCCESSFUL. WELCOME, AUTHORIZED ENTITY."},
                {text: "TYPE 'HELP' TO SEE AVAILABLE SYSTEM COMMANDS."},
                {text: " "}
            ]);
        } else {
            await printLines([{text: "INVALID ACCESS KEY. ATTEMPT LOGGED.", cls: "error"}]);
            promptSpan.textContent = "LOGIN>";
        }
        return;
    }

    // --- MAIN SYSTEM LOGIC (Authenticated Only) ---
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
    promptSpan.textContent = "LOGIN>"; 
    printLines([
        {text: "*** $DONTBUY NODE ACCESS ***", cls: "success"},
        {text: "STATION ID: VOID_NODE_01"},
        {text: "SYSTEM IS LOCKED. ENTER ACCESS KEY:"},
        {text: " "}
    ]);
};

document.addEventListener('click', () => { if(!isPrinting) input.focus(); });
