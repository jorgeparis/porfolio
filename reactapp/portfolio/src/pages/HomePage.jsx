// pages/HomePage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import AudioInterface from "../components/AudioInterface";
import MonitorPanel from "../components/MonitorPanel";
import Navbar from "../components/Navbar";
import ServerConfig from "../components/ServerConfig";
import { useAudioMeter } from "../hooks/useAudioMeter";
import "../styles/HomePage.css"; // Add this at the top


function HomePage() {
  // Server Configuration State
  const [protocol, setProtocol] = useState("icecast");
  const [serverConfig, setServerConfig] = useState({
    host: "stream.example.com",
    port: "8000",
    mount: "/live",
    username: "source",
    password: "hackme",
    station: "Radio Alpha FM",
    genre: "Electronic",
    url: "https://radioalpha.fm"
  });

  // Codec/Bitrate State
  const [codecConfig, setCodecConfig] = useState({
    codec: "MP3",
    bitrate: "128k"
  });

  // Audio Devices State
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [timer, setTimer] = useState("00:00:00");
  const [listeners, setListeners] = useState("—");
  const [dropped, setDropped] = useState("—");
  const [latency, setLatency] = useState("—");

  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Audio Meter Hook
  const { audioLevel, waveformData, isMicActive, startAudio, stopAudio } =
    useAudioMeter();

  // Scan Audio Devices
  const scanAudioDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter((device) => device.kind === "audioinput")
        .map((device, idx) => ({
          id: device.deviceId,
          name: device.label || `Audio Input ${idx + 1}`
        }));
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].id);
      }
    } catch (err) {
      console.error("Microphone permission denied", err);
      setDevices([]);
    }
  }, [selectedDeviceId]);

  // Start audio when device is selected
  useEffect(() => {
    if (selectedDeviceId) {
      startAudio(selectedDeviceId);
    }
    return () => {
      stopAudio();
    };
  }, [selectedDeviceId, startAudio, stopAudio]);

  // Initial device scan
  useEffect(() => {
    scanAudioDevices();
  }, [scanAudioDevices]);

  // Timer Management
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(
        2,
        "0"
      );
      const seconds = String(elapsed % 60).padStart(2, "0");
      setTimer(`${hours}:${minutes}:${seconds}`);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
    setTimer("00:00:00");
  }, []);

  // Test Server Connection
  const testConnection = useCallback(async () => {
    try {
      const response = await fetch(
        `http://${serverConfig.host}:${serverConfig.port}/status-json.xsl`
      );
      return response.ok;
    } catch {
      return false;
    }
  }, [serverConfig.host, serverConfig.port]);

  // Simulate listener updates when live
  useEffect(() => {
    let listenerInterval = null;
    if (connectionStatus === "live") {
      listenerInterval = setInterval(() => {
        setListeners(Math.floor(Math.random() * 150).toString());
        setLatency(`${Math.floor(Math.random() * 50 + 10)}ms`);
        setDropped(Math.floor(Math.random() * 5).toString());
      }, 5000);
    }
    return () => {
      if (listenerInterval) clearInterval(listenerInterval);
    };
  }, [connectionStatus]);

  // Connect/Disconnect Handler
  const toggleConnect = useCallback(async () => {
    if (connectionStatus === "live") {
      setConnectionStatus("idle");
      stopTimer();
    } else {
      if (!serverConfig.username || !serverConfig.password) {
        alert("Username e Password são obrigatórios");
        return;
      }

      setConnectionStatus("connecting");

      try {
        const isAvailable = await testConnection();
        if (!isAvailable) {
          setConnectionStatus("idle");
          alert("Servidor indisponível");
          return;
        }

        setConnectionStatus("live");
        startTimer();
      } catch (err) {
        console.error("Connection failed", err);
        setConnectionStatus("idle");
      }
    }
  }, [connectionStatus, serverConfig, testConnection, startTimer, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Helper displays
  const getServerDisplay = () => `${serverConfig.host}:${serverConfig.port}`;
  const getCodecDisplay = () => `${codecConfig.codec} · ${codecConfig.bitrate}`;

  return (
    <div className="home-page">
      <Navbar />
      <div className="shell">
        {/* Top Bar */}
        <div className="topbar">
          <div className="logo">
            <div className="logo-icon">⬡</div>
            <div>
              <div className="logo-text">
                Jorge<span>STREAM</span>
              </div>
              <div className="logo-sub">BROADCAST STUDIO</div>
            </div>
          </div>
          <div className="badge">v2.4.1 · BUILD 2026</div>
        </div>

        {/* Main Grid */}
        <div className="grid">
          <ServerConfig
            serverConfig={serverConfig}
            onServerConfigChange={setServerConfig}
            protocol={protocol}
            onProtocolChange={setProtocol}
            codecConfig={codecConfig}
            onCodecConfigChange={setCodecConfig}
          />

          <AudioInterface
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            onScanDevices={scanAudioDevices}
          />

          <MonitorPanel
            connectionStatus={connectionStatus}
            serverDisplay={getServerDisplay()}
            protocol={protocol}
            codecDisplay={getCodecDisplay()}
            listeners={listeners}
            dropped={dropped}
            latency={latency}
            audioLevel={audioLevel}
            waveformData={waveformData}
            timer={timer}
            onConnect={toggleConnect}
            onTestConnection={testConnection}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
