import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceVerification({ onVerified }) {
  const videoRef = useRef();
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    loadModels();
  }, []);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch {
      setError("Camera access denied");
    }
  };

  const detectFace = async () => {
    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (detection) {
      onVerified(); // ✅ HUMAN VERIFIED
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
