import React, { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import ReactPlayer from "react-player";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const [stream, setStream] = useState(null);

  const onDrop = (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    setFile(URL.createObjectURL(selectedFile));

    if (selectedFile.type.startsWith("image")) {
      setIsImage(true);
      setIsVideo(false);
    } else if (selectedFile.type.startsWith("video")) {
      setIsImage(false);
      setIsVideo(true);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*,video/*",
  });

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    setStream(stream);

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setVideoURL(URL.createObjectURL(blob));
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const applyBlackAndWhite = () => {
    setIsFilterApplied(true);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="App">
      <h1>Black and White Image/Video Converter</h1>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & Drop or Click to Select an Image/Video</p>
      </div>

      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>

      {videoURL && (
        <div>
          <video
            src={videoURL}
            controls
            style={{
              filter: isFilterApplied ? "grayscale(100%)" : "none",
            }}
          />
        </div>
      )}

      {file && (
        <div>
          {isImage && (
            <img
              src={file}
              alt="Uploaded"
              style={{
                filter: isFilterApplied ? "grayscale(100%)" : "none",
              }}
            />
          )}

          {isVideo && (
            <ReactPlayer
              url={file}
              playing
              controls
              style={{
                filter: isFilterApplied ? "grayscale(100%)" : "none",
              }}
            />
          )}
        </div>
      )}

      <div>
        <h2>Live Camera Stream</h2>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            filter: isFilterApplied ? "grayscale(100%)" : "none",
          }}
        />
        {!isFilterApplied && (
          <button onClick={applyBlackAndWhite}>Apply Black & White Filter</button>
        )}
      </div>

      <footer>
        <p>
          This application allows you to convert images/videos to black and white, 
          record live streams, and upload files for grayscale conversion.
        </p>
      </footer>
    </div>
  );
}

export default App;
