import { ref, onMounted, onUnmounted } from 'vue'

export function useEcho() {
  const echo = ref<any>(null)
  const isConnected = ref(false)

  const connect = () => {
    if (typeof window !== 'undefined' && window.Echo) {
      echo.value = window.Echo
      isConnected.value = true
      // Debug logging removed for production
    } else {
      console.warn('Echo is not available. Make sure Laravel Echo is properly configured.')
    }
  }

  const disconnect = () => {
    if (echo.value && typeof echo.value.disconnect === 'function') {
      echo.value.disconnect()
      isConnected.value = false
      // Debug logging removed for production
    }
  }

  const onNotification = (callback: (notification: any) => void) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot listen for notifications.')
      return
    }

    // Listen for broadcasted notifications
    echo.value.private(`user.${window.Laravel.userId}`)
      .notification((notification: any) => {
        // Debug logging removed for production
        callback(notification)
      })
  }

  const onChannel = (channel: string, event: string, callback: (data: any) => void) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot listen for channel events.')
      return
    }

    echo.value.channel(channel)
      .listen(event, (data: any) => {
        // Debug logging removed for production
        callback(data)
      })
  }

  const joinPresenceChannel = (channel: string, callbacks: {
    here?: (users: any[]) => void
    joining?: (user: any) => void
    leaving?: (user: any) => void
    error?: (error: any) => void
  }) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot join presence channel.')
      return
    }

    const presenceChannel = echo.value.join(channel)

    if (callbacks.here) {
      presenceChannel.here((users: any[]) => {
        // Debug logging removed for production
        callbacks.here!(users)
      })
    }

    if (callbacks.joining) {
      presenceChannel.joining((user: any) => {
        // Debug logging removed for production
        callbacks.joining!(user)
      })
    }

    if (callbacks.leaving) {
      presenceChannel.leaving((user: any) => {
        // Debug logging removed for production
        callbacks.leaving!(user)
      })
    }

    if (callbacks.error) {
      presenceChannel.error((error: any) => {
        console.error('Presence channel error:', error)
        callbacks.error!(error)
      })
    }
  }

  const leaveChannel = (channel: string) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot leave channel.')
      return
    }

    echo.value.leave(channel)
    // Debug logging removed for production
  }

  const getPresenceUsers = (channel: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!echo.value || !isConnected.value) {
        reject(new Error('Echo is not connected'))
        return
      }

      echo.value.join(channel)
        .here((users: any[]) => {
          resolve(users)
        })
        .error((error: any) => {
          reject(error)
        })
    })
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Auto-disconnect on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    echo,
    isConnected,
    connect,
    disconnect,
    onNotification,
    onChannel,
    joinPresenceChannel,
    leaveChannel,
    getPresenceUsers
  }
}