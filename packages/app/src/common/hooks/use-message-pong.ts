import { useEffect, useCallback } from 'react';
// import { useSelector } from 'react-redux';
// import { selectAuthRequest } from '@store/onboarding/selectors';
import { getEventSourceWindow } from '@common/utils';

export const useMessagePong = () => {
  const sendMessage = useCallback((event: MessageEvent) => {
    if (event.data.method === 'ping') {
      console.log('ping!');
      const source = getEventSourceWindow(event);
      source?.postMessage(
        {
          method: 'pong',
          authRequest: event.data.authRequest,
          source: 'blockstack-app',
        },
        event.origin
      );
    }
  }, []);

  const deregister = () => {
    console.log('deregistering');
    window.removeEventListener('message', sendMessage);
  };

  useEffect(() => {
    window.addEventListener('message', sendMessage);
    return deregister;
  }, []);
};
