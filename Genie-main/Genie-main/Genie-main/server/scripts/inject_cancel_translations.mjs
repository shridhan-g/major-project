import { readFileSync, writeFileSync } from 'fs';

const cancelTranslations = {
  "Cancel Booking": { en: "Cancel Booking", hi: "बुकिंग रद्द करें", mr: "बुकिंग रद्द करा", kn: "ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಿ" },
  "Decline / Cancel Booking": { en: "Decline / Cancel Booking", hi: "अस्वीकार / रद्द करें", mr: "नाकारा / रद्द करा", kn: "ತಿರಸ್ಕರಿಸಿ / ರದ್ದುಮಾಡಿ" },
  "Are you sure you want to cancel this booking?": { en: "Are you sure you want to cancel this booking?", hi: "क्या आप वाकई यह बुकिंग रद्द करना चाहते हैं?", mr: "तुम्हाला खरोखर ही बुकिंग रद्द करायची आहे का?", kn: "ನೀವು ನಿಜವಾಗಿಯೂ ಈ ಬುಕಿಂಗ್ ಅನ್ನು ರದ್ದುಗೊಳಿಸಲು ಬಯಸುವಿರಾ?" },
  "Reason for cancellation (optional)": { en: "Reason for cancellation (optional)", hi: "रद्द करने का कारण (वैकल्पिक)", mr: "रद्द करण्याचे कारण (पर्यायी)", kn: "ರದ್ದುಗೊಳಿಸಲು ಕಾರಣ (ಐಚ್ಛಿಕ)" },
  "Keep Booking": { en: "Keep Booking", hi: "बुकिंग जारी रखें", mr: "बुकिंग कायम ठेवा", kn: "ಬುಕಿಂಗ್ ಮುಂದುವರಿಸಿ" },
  "Confirm Cancellation": { en: "Confirm Cancellation", hi: "रद्दीकरण की पुष्टि करें", mr: "रद्दीकरणाची पुष्टी करा", kn: "ರದ್ದತಿಯನ್ನು ದೃಢೀಕರಿಸಿ" },
  "Cancelling...": { en: "Cancelling...", hi: "रद्द हो रहा है...", mr: "रद्द होत आहे...", kn: "ರದ್ದುಗೊಳಿಸಲಾಗುತ್ತಿದೆ..." },
  "Booking Cancelled": { en: "Booking Cancelled", hi: "बुकिंग रद्द की गई", mr: "बुकिंग रद्द केली", kn: "ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಲಾಗಿದೆ" },
  "This booking has been cancelled.": { en: "This booking has been cancelled.", hi: "यह बुकिंग रद्द कर दी गई है।", mr: "ही बुकिंग रद्द करण्यात आली आहे.", kn: "ಈ ಬುಕಿಂಗ್ ಅನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ." }
};

let transContent = readFileSync('../client/src/utils/translations.js', 'utf8');

for (const lang of ['en', 'hi', 'mr', 'kn']) {
  let langEntries = '';
  for (const [key, valObj] of Object.entries(cancelTranslations)) {
    const k = JSON.stringify(key);
    const v = JSON.stringify(valObj[lang] || key);
    langEntries += `        ${k}: ${v},\n`;
  }
  const pattern = new RegExp(`(${lang}:\\s*\\{[\\s\\S]*?)(\\n\\s*\\},)`);
  transContent = transContent.replace(pattern, `$1\n${langEntries}$2`);
}

writeFileSync('../client/src/utils/translations.js', transContent);
console.log('Successfully injected cancel translations into translations.js!');
