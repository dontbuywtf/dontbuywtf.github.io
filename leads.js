// leads.js

const ENCODED = "S0VZXzEkPTUxMzIzOTA4MjUzNjMwNDE2";     // ← what they find in HTML comment
const DECODED = "51323908253630416";             // ← the secret value

function validateKey() {
    const input = document.getElementById('key-input').value.trim();
    const result = document.getElementById('result');

    if (input === ENCODED) {
        result.style.color = "orange";
        result.textContent = "That would be too easy, wrong key — try harder.";
    } else if (input === DECODED) {
        result.style.color = "green";
        result.innerHTML = 'Key accepted.<br><br>' +
                           'Send this key and wait for The Void instructions:<br>' +
                           '<strong>dontbuythis@proton.me</strong><br>' +
                           'Subject: Stage 1<br>' +
                           'Next clue within 24h if the key is valid.';
        document.getElementById('key-input').disabled = true;
        document.querySelector('button[onclick="validateKey()"]').disabled = true;
    } else {
        result.style.color = "red";
        result.textContent = "Incorrect key.";
    }
}
