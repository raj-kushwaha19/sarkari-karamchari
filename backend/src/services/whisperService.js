const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

const transcribeAudio = (audioFilePath) => {
  return new Promise((resolve) => {
    const outputDir = os.tmpdir();
    const cmd = `whisper "${audioFilePath}" --model base --output_format txt --output_dir "${outputDir}"`;
    
    logger.info(`[Whisper] Starting transcription: ${path.basename(audioFilePath)}`);
    
    exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
      // Clean up audio file regardless of outcome
      try { fs.unlinkSync(audioFilePath); } catch (e) { /* ignore */ }
      
      if (error) {
        if (error.message.includes('not found') || error.code === 127) {
          logger.warn('[Whisper] CLI not found. Whisper is not installed.');
          resolve({
            transcript: null,
            fallback: true,
            message: 'Voice transcription requires Whisper installed locally. Run: pip install openai-whisper then retry. See README for details.'
          });
          return;
        }
        logger.error('[Whisper] Transcription failed:', error.message);
        resolve({
          transcript: null,
          fallback: true,
          message: 'Transcription failed. Please type your complaint manually.'
        });
        return;
      }
      
      // Find the output .txt file
      const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
      const outputFile = path.join(outputDir, `${baseName}.txt`);
      
      try {
        if (fs.existsSync(outputFile)) {
          const transcript = fs.readFileSync(outputFile, 'utf8').trim();
          fs.unlinkSync(outputFile); // Clean up output file
          logger.info(`[Whisper] Transcription successful: ${transcript.length} chars`);
          resolve({ transcript, fallback: false });
        } else {
          logger.warn('[Whisper] Output file not found after transcription');
          resolve({
            transcript: null,
            fallback: true,
            message: 'Transcription output not found. Please try again or type your complaint.'
          });
        }
      } catch (readErr) {
        logger.error('[Whisper] Failed to read output file:', readErr.message);
        resolve({
          transcript: null,
          fallback: true,
          message: 'Could not read transcription output. Please type your complaint manually.'
        });
      }
    });
  });
};

module.exports = { transcribeAudio };
