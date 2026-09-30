import { readFileSync, writeFileSync } from 'fs';

const pincodeTranslations = {
  "Pincode": { en: "Pincode", hi: "पिनकोड", mr: "पिनकोड", kn: "ಪಿನ್‌ಕೋಡ್" },
  "Your Pincode": { en: "Your Pincode", hi: "आपका पिनकोड", mr: "तुमचा पिनकोड", kn: "ನಿಮ್ಮ ಪಿನ್‌ಕೋಡ್" },
  "Sort by Nearest": { en: "Sort by Nearest", hi: "निकटतम अनुसार क्रमबद्ध करें", mr: "सर्वात जवळच्यानुसार क्रमवारी लावा", kn: "ಹತ್ತಿರದ ಮೂಲಕ ವಿಂಗಡಿಸಿ" },
  "Nearest Provider": { en: "Nearest Provider", hi: "निकटतम प्रदाता", mr: "सर्वात जवळचा पुरवठादार", kn: "ಹತ್ತಿರದ ಒದಗಿಸುವವರು" },
  "Nearest Match": { en: "Nearest Match", hi: "निकटतम मिलान", mr: "जवळचे जुळणारे", kn: "ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ" },
  "Service Area / Address": { en: "Service Area / Address", hi: "सेवा क्षेत्र / पता", mr: "सेवा क्षेत्र / पत्ता", kn: "ಸೇವಾ ಪ್ರದೇಶ / ವಿಳಾಸ" },
  "No preference (auto assign nearest)": { en: "No preference (auto assign nearest)", hi: "कोई प्राथमिकता नहीं (निकटतम स्वतः असाइन करें)", mr: "कोणतीही पसंती नाही (सर्वात जवळचा ऑटो असाइन करा)", kn: "ಯಾವುದೇ ಆದ್ಯತೆ ಇಲ್ಲ (ಹತ್ತಿರದ ಸ್ವಯಂ ನಿಯೋಜಿಸಿ)" },
  "Nearest providers updated": { en: "Nearest providers updated", hi: "निकटतम प्रदाता अपडेट किए गए", mr: "सर्वात जवळचे पुरवठादार अपडेट केले", kn: "ಹತ್ತಿರದ ಒದಗಿಸುವವರನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ" }
};

let transContent = readFileSync('../client/src/utils/translations.js', 'utf8');

for (const lang of ['en', 'hi', 'mr', 'kn']) {
  let langEntries = '';
  for (const [key, valObj] of Object.entries(pincodeTranslations)) {
    const k = JSON.stringify(key);
    const v = JSON.stringify(valObj[lang] || key);
    langEntries += `        ${k}: ${v},\n`;
  }
  const pattern = new RegExp(`(${lang}:\\s*\\{[\\s\\S]*?)(\\n\\s*\\},)`);
  transContent = transContent.replace(pattern, `$1\n${langEntries}$2`);
}

writeFileSync('../client/src/utils/translations.js', transContent);
console.log('Successfully injected pincode translations into translations.js!');
