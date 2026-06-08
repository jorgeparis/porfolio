// hooks/useAudioMeter.js
import { useCallback, useRef, useState } from "react";

export function useAudioMeter() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState(new Float32Array(1024));
  const [isMicActive, setIsMicActive] = useState(false);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startAudio = useCallback(async (deviceId) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });

      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      setIsMicActive(true);

      const dataArray = new Float32Array(analyser.frequencyBinCount);

      function updateMeter() {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        let db = rms > 0 ? 20 * Math.log10(rms) : -100;
        db = Math.max(db, -60);
        const normalizedLevel = (db + 60) / 60;
        setAudioLevel(Math.min(1, Math.max(0, normalizedLevel)));
        setWaveformData(dataArray.slice());

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      }

      updateMeter();
    } catch (err) {
      console.error("Failed to start audio:", err);
      setIsMicActive(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsMicActive(false);
    setAudioLevel(0);
    setWaveformData(new Float32Array(1024));
  }, []);

  return { audioLevel, waveformData, isMicActive, startAudio, stopAudio };
}
