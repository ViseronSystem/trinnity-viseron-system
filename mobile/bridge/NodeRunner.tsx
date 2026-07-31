import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import nodejs from 'nodejs-mobile-react-native';

let nodeStarted = false;

export function useNodeJsServer() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || nodeStarted) return;
    startedRef.current = true;

    if (Platform.OS !== 'android') {
      console.log('[NodeRunner] nodejs-mobile only available on Android');
      return;
    }

    try {
      nodejs.start('server.js');
      nodeStarted = true;
      console.log('[NodeRunner] TVS Node.js server started on localhost:3000');

      nodejs.channel.addListener('message', (msg: any) => {
        console.log('[NodeRunner] Node:', msg);
      });
    } catch (err) {
      console.error('[NodeRunner] Failed to start Node.js:', err);
    }
  }, []);
}

export function isNodeRunning(): boolean {
  return nodeStarted;
}
