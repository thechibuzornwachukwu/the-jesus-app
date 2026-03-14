'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiCallScreenProps {
  roomName: string;
  displayName: string;
  avatarUrl?: string;
  onLeave: () => void;
  onAutoEnd?: () => void;
}

export default function JitsiCallScreen({ roomName, displayName, onLeave, onAutoEnd }: JitsiCallScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        userInfo={{ displayName, email: '' }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          toolbarButtons: ['microphone', 'camera', 'hangup'],
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        }}
        onReadyToClose={onLeave}
        onApiReady={(externalApi) => {
          if (!onAutoEnd) return;
          externalApi.addEventListeners({
            participantLeft: () => {
              // If only the local user remains, auto-end for everyone
              if (externalApi.getNumberOfParticipants() <= 1) {
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
