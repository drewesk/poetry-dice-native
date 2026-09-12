import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  wasOffline: boolean;
}

export const useNetworkStatus = (onReconnect?: () => void) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: null,
    wasOffline: false,
  });
  const wasOfflineRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialCheckDone = useRef(false);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const connected = state.isConnected ?? false;
    const reachable = state.isInternetReachable;
    const isOnline = connected && reachable === true;
    
    setNetworkStatus(prev => ({
      isConnected: connected,
      isInternetReachable: reachable,
      wasOffline: prev.wasOffline || !isOnline,
    }));

    if (wasOfflineRef.current && isOnline) {
      if (__DEV__) console.log('🌐 Network restored');
      wasOfflineRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (onReconnect) onReconnect();
      }, 500);
    } else if (!isOnline && !wasOfflineRef.current) {
      wasOfflineRef.current = true;
    }
  }, [onReconnect]);

  useEffect(() => {
    const checkConnection = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const state = await NetInfo.fetch();
        handleNetworkChange(state);
        
        if (state.isInternetReachable !== null) {
          initialCheckDone.current = true;
          break;
        }
        
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      initialCheckDone.current = true;
    };
    
    checkConnection();
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleNetworkChange]);

  return networkStatus;
};
