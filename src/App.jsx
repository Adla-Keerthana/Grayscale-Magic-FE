import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import ReactPlayer from "react-player";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [authError, setAuthError] = useState("");

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

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/token",
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      setToken(response.data.access_token);
      setIsAuthenticated(true);
      setAuthError(""); // Clear previous error messages
    } catch (error) {
      setAuthError("Invalid details. Please try again.");
      console.error("Error logging in:", error);
    }
  };

  const handleRegister = async (username, password, email, full_name) => {
    try {
      await axios.post("http://localhost:8000/auth/register", {
        username,
        password,
        email,
        full_name,
      });
      alert("Registration successful. Please log in.");
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  return (
    <Router>
      <div className="App">
        <h1>Black and White Image/Video Converter</h1>
        <nav>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Sign Up</Link>
        </nav>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <LoginForm onLogin={handleLogin} authError={authError} />
              )
            }
          />
          <Route
            path="/register"
            element={<RegisterForm onRegister={handleRegister} />}
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <div>
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
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

const LoginForm = ({ onLogin, authError }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      {authError && <p className="error">{authError}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="form-button">Login</button>
      </form>
    </div>
  );
};

const RegisterForm = ({ onRegister }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(username, password, email, fullName);
  };

  return (
    <div className="form-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="form-button">Sign Up</button>
      </form>
    </div>
  );
};

export default App;
