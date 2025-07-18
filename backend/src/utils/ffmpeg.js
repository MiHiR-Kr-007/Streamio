import { execFile } from "child_process";
import ffprobePath from "ffprobe-static";

const getVideoDuration = (videoPath) => {
    return new Promise((resolve, reject) => {
        execFile(ffprobePath.path, [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            videoPath
        ], (err, stdout) => {
            if (err) {
                reject("Error extracting video duration");
            } else {
                resolve(parseFloat(stdout.trim()));
            }
        });
    });
};

export default getVideoDuration;
