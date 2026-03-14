'use client';

import { useEffect, useRef, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface JitsiCallScreenProps {
  roomName: string;
  displayName: string;
  avatarUrl?: string;
  cellName: string;
  channelName: string;
  userRole: 'admin' | 'member';
  onLeave: () => void;
  onAutoEnd?: () => void;
}

export default function JitsiCallScreen({
  roomName,
  displayName,
  cellName,
  channelName,
  userRole,
  onLeave,
  onAutoEnd,
}: JitsiCallScreenProps) {
  const apiRef = useRef<ReturnType<typeof Object.create> | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Call timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const toggleMic = () => {
    apiRef.current?.executeCommand('toggleAudio');
    setMuted((v) => !v);
  };

  const toggleVideo = () => {
    apiRef.current?.executeCommand('toggleVideo');
    setVideoOff((v) => !v);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#0a0a0f',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Custom header ── */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(10,10,15,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left: cell + channel */}
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f5f7f7', fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
            {cellName}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,247,247,0.45)', fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
            #{channelName} · {formatTime(elapsed)}
          </p>
        </div>

        {/* Right: mic / video / hang-up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleVideo}
            title={videoOff ? 'Turn camera on' : 'Turn camera off'}
            style={btnStyle(videoOff)}
          >
            {videoOff ? <VideoOff size={16} /> : <Video size={16} />}
          </button>
          <button
            onClick={toggleMic}
            title={muted ? 'Unmute' : 'Mute'}
            style={btnStyle(muted)}
          >
            {muted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={onLeave}
            title="Leave call"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>

      {/* ── Jitsi iframe ── */}
      <JitsiMeeting
        domain={process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si'}
        roomName={roomName}
        userInfo={{ displayName, email: '' }}
        configOverwrite={{
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          // Strip Jitsi branding
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          disableThirdPartyRequests: true,
          // Moderator: on public meet.jit.si the room creator is auto-moderator;
          // startAsModerator is honoured by self-hosted instances.
          startAsModerator: userRole === 'admin',
          // Minimal toolbar — we provide our own controls above
          toolbarButtons: [] as string[],
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_FOOTER: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_FOCUS_INDICATOR: true,
          MOBILE_APP_PROMO: false,
        }}
        onReadyToClose={onLeave}
        onApiReady={(externalApi) => {
          apiRef.current = externalApi;

          // Sync mute/video state from Jitsi events
          externalApi.addEventListeners({
            audioMuteStatusChanged: ({ muted: m }: { muted: boolean }) => setMuted(m),
            videoMuteStatusChanged: ({ muted: m }: { muted: boolean }) => setVideoOff(m),
            participantLeft: () => {
              if (onAutoEnd && externalApi.getNumberOfParticipants() <= 1) {
                onAutoEnd();
              }
            },
          });
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.width = '100%';
          iframeRef.style.height = '100%';
          iframeRef.style.border = 'none';
          iframeRef.style.flex = '1';
        }}
      />
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: active ? 'rgba(244,117,33,0.2)' : 'rgba(255,255,255,0.08)',
    color: active ? '#f47521' : 'rgba(245,247,247,0.7)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  };
}
