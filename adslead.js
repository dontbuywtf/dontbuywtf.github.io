function validateKey() {
    const input = document.getElementById('key-input').value.trim();
    const result = document.getElementById('result');
    
    
    const CORRECT_ENCODED = "VVNFUl9LRVlfMToNCjUxMzIzOTA4MjUzNjMwNDE2";          
    const CORRECT_DECODED = "51323908253630416";                

    if (input === CORRECT_ENCODED) {
      result.style.color = "orange";
      result.textContent = "This would be too easy — try harder.";
    } else if (input === CORRECT_DECODED) {
      result.style.color = "green";
      result.innerHTML = 'Key accepted.<br><br>' +
                         'Send this key + your XRPL wallet address to:<br>' +
                         '<strong>dontbuythis@proton.me</strong><br>' +
                         'Subject: Stage 1<br>' +
                         'Next clue within 24h if valid.';
     
      document.getElementById('key-input').disabled = true;
    } else {
      result.style.color = "red";
      result.textContent = "Incorrect.";
    }
  }
