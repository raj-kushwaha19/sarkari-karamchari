const logger = require('../utils/logger');

const extractTextFromImage = async (imageBuffer) => {
  try {
    // Dynamically import tesseract.js
    const { createWorker } = require('tesseract.js');
    
    logger.info('[OCR] Starting image text extraction');
    const start = Date.now();
    
    const worker = await createWorker('eng+hin');
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    const latency = Date.now() - start;
    logger.info(`[OCR] Extraction complete: ${text.length} chars | latency: ${latency}ms`);
    
    return text.trim();
  } catch (err) {
    logger.error('[OCR] Image text extraction failed:', err.message);
    return ''; // Return empty string on failure
  }
};

module.exports = { extractTextFromImage };
