
async function generateRandomString(length) {
    const characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characterSet.length);
      result += characterSet.charAt(randomIndex);
    }
  
    return result;
}

async function generateHexString(length) {
    const characterSet = '0123456789ABCDEF';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characterSet.length);
      result += characterSet.charAt(randomIndex);
    }
  
    return result;
}

module.exports = {
    generateRandomString: generateRandomString,
    generateHexString: generateHexString,
}