import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceVerification({ onVerified }) {
  const videoRef = useRef();
  const streamRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    loadModels();

    // Cleanup: stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectFace = async () => {
    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (detection) {
      stopCamera(); // Stop camera immediately after verification
      onVerified();
    } else {
      setError("No face detected. Please look at the camera.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        style={{ borderRadius: "10px" }}
      />

      <br />
      <button onClick={detectFace}>Verify Human</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
