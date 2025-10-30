"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import Waveform from "@/components/Waveform";
import type { Message } from "@/app/page";

interface VoiceRecorderProps {
  onNewMessage: (message: Message) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export default function VoiceRecorder({ onNewMessage }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Setup audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualizing
      analyzeAudio();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }

      const { text } = await transcribeResponse.json();

      if (!text || text.trim().length === 0) {
        toast.info("No speech detected");
        setIsProcessing(false);
        return;
      }

      // Add user message
      const userMessage: Message = {
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      onNewMessage(userMessage);

      // Step 2: Get AI response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Chat response failed");
      }

      const { response } = await chatResponse.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      onNewMessage(assistantMessage);

      toast.success("Response received");
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      {/* Waveform Visualization */}
      <Waveform isActive={isRecording} level={audioLevel} />

      {/* Status Text */}
      <div className="text-center">
        {isProcessing ? (
          <p className="text-lg text-muted-foreground">Processing...</p>
        ) : isRecording ? (
          <p className="text-lg font-medium">Listening...</p>
        ) : (
          <p className="text-lg text-muted-foreground">
            Click to start recording
          </p>
        )}
      </div>

      {/* Recording Button */}
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className="h-24 w-24 rounded-full"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground text-center max-w-md">
        <p>
          {isRecording
            ? "Click again to stop recording"
            : "Click the microphone to start voice recording"}
        </p>
        <p className="mt-2 text-xs">
          Your voice will be transcribed using Whisper and processed by LLaMA
          3.3
        </p>
      </div>
    </div>
  );
}
