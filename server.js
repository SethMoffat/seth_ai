const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const ffmpegPath = require('ffmpeg-static'); // Import ffmpeg-static

const app = express();
const port = 5000;

const inputDirectoryPath = path.join(__dirname, 'unfinishedVideos');
const outputDirectoryPath = path.join(__dirname, 'finishedVideos');

// Ensure the output directory exists
if (!fs.existsSync(outputDirectoryPath)) {
  fs.mkdirSync(outputDirectoryPath);
}

app.use(cors());
app.use(express.json());

app.post('/make-video', (req, res) => {
  // Check if the input directory exists
  if (!fs.existsSync(inputDirectoryPath)) {
    return res.status(400).json({ message: 'Input directory does not exist.' });
  }

  // Read the directory and get all .mkv files
  fs.readdir(inputDirectoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Unable to scan directory: ' + err });
    }

    const mkvFiles = files.filter(file => path.extname(file) === '.mkv');
    if (mkvFiles.length === 0) {
      return res.status(400).json({ message: 'No .mkv files found in the directory.' });
    }

    // Create a temporary file listing all .mkv files
    const tempFilePath = path.join(__dirname, `filelist-${uuidv4()}.txt`);
    const fileListContent = mkvFiles.map(file => `file '${path.join(inputDirectoryPath, file)}'`).join('\n');
    fs.writeFileSync(tempFilePath, fileListContent);

    // Generate a unique output file path
    const outputFilePath = path.join(outputDirectoryPath, `output-${uuidv4()}.mp4`);

    // Log the ffmpeg path for debugging
    console.log(`Using ffmpeg binary at: ${ffmpegPath}`);

    // Use ffmpeg to concatenate the files
    const ffmpegCommand = `"${ffmpegPath}" -f concat -safe 0 -i "${tempFilePath}" -c copy "${outputFilePath}"`;
    exec(ffmpegCommand, (error, stdout, stderr) => {
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);

      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ message: `Error: ${error.message}` });
      }
      if (stderr) {
        console.log(`Stderr: ${stderr}`);
      }
      console.log(`Stdout: ${stdout}`);
      console.log('Concatenation complete.');

      res.status(200).json({ message: 'Video concatenation complete.', outputFilePath });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});