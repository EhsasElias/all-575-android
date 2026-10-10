import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export default function useNotifications({
  api,
  currentUser,
}) {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [
    notificationsError,
    setNotificationsError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Parse notification data
  |--------------------------------------------------------------------------
  */

  function parseData(data) {
    if (!data) {
      return {};
    }

    if (
      typeof data === 'object'
    ) {
      return data;
    }

    if (
      typeof data === 'string'
    ) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error(
          'Notification data parse error:',
          error
        );

        return {};
      }
    }

    return {};
  }

  /*
  |--------------------------------------------------------------------------
  | Extract list safely
  |--------------------------------------------------------------------------
  */

  function extractList(response) {
    if (
      Array.isArray(response)
    ) {
      return response;
    }

    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Laravel pagination
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        response?.data?.data
      )
    ) {
      return response.data.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Other common response structures
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        response?.notifications
      )
    ) {
      return response.notifications;
    }

    if (
      Array.isArray(
        response?.data?.notifications
      )
    ) {
      return response.data.notifications;
    }

    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize notification
  |--------------------------------------------------------------------------
  */

  function normalizeNotification(
    notification
  ) {
    const data =
      parseData(
        notification.data
      );

    return {
      ...notification,

      data,

      id:
        notification.id,

      type:
        data.type ||
        notification.type ||
        null,

      orderId:
        data.order_id ||
        notification.order_id ||
        null,

      orderNumber:
        data.order_number ||
        notification.order_number ||
        null,

      status:
        data.status ||
        notification.status ||
        null,

      note:
        data.note ||
        notification.note ||
        null,

      /*
      |--------------------------------------------------------------------------
      | Arabic / English content
      |--------------------------------------------------------------------------
      */

      titleAr:
        data.title_ar ||
        notification.title_ar ||
        '',

      titleEn:
        data.title_en ||
        notification.title_en ||
        '',

      messageAr:
        data.message_ar ||
        notification.message_ar ||
        '',

      messageEn:
        data.message_en ||
        notification.message_en ||
        '',

      /*
      |--------------------------------------------------------------------------
      | Generic fallback
      |--------------------------------------------------------------------------
      */

      title:
        notification.title ||
        data.title ||
        data.title_en ||
        data.title_ar ||
        '',

      message:
        notification.message ||
        data.message ||
        data.message_en ||
        data.message_ar ||
        '',

      readAt:
        notification.read_at ||
        null,

      createdAt:
        notification.created_at ||
        null,

      updatedAt:
        notification.updated_at ||
        null,

      isRead:
        Boolean(
          notification.read_at
        ),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Load all notifications
  |--------------------------------------------------------------------------
  */

  const loadNotifications =
    useCallback(async () => {
      if (!currentUser) {
        setNotifications(
          []
        );

        return;
      }

      setNotificationsLoading(
        true
      );

      setNotificationsError(
        ''
      );

      try {
        const response =
          await api.getNotifications();

        const list =
          extractList(
            response
          );

        setNotifications(
          list.map(
            normalizeNotification
          )
        );
      } catch (error) {
        console.error(
          'Notifications load error:',
          error
        );

        setNotifications(
          []
        );

        setNotificationsError(
          error?.message ||
          'Could not load notifications'
        );
      } finally {
        setNotificationsLoading(
          false
        );
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Load unread notifications
  |--------------------------------------------------------------------------
  */

  const loadUnreadNotifications =
    useCallback(async () => {
      if (!currentUser) {
        setUnreadNotifications(
          []
        );

        return;
      }

      try {
        const response =
          await api
            .getUnreadNotifications();

        const list =
          extractList(
            response
          );

        setUnreadNotifications(
          list.map(
            normalizeNotification
          )
        );
      } catch (error) {
        console.error(
          'Unread notifications load error:',
          error
        );

        setUnreadNotifications(
          []
        );
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!currentUser) {
      setNotifications(
        []
      );

      setUnreadNotifications(
        []
      );

      return;
    }

    loadNotifications();

    loadUnreadNotifications();
  }, [
    currentUser,
    loadNotifications,
    loadUnreadNotifications,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Mark one notification as read
  |--------------------------------------------------------------------------
  */

  async function markNotificationAsRead(
    id
  ) {
    try {
      await api
        .markNotificationAsRead(
          id
        );

      const now =
        new Date()
          .toISOString();

      setNotifications(
        (current) =>
          current.map(
            (
              notification
            ) =>
              String(
                notification.id
              ) ===
              String(id)
                ? {
                    ...notification,

                    read_at:
                      now,

                    readAt:
                      now,

                    isRead:
                      true,
                  }
                : notification
          )
      );

      setUnreadNotifications(
        (current) =>
          current.filter(
            (
              notification
            ) =>
              String(
                notification.id
              ) !==
              String(id)
          )
      );

      return true;
    } catch (error) {
      console.error(
        'Mark notification read error:',
        error
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Mark all notifications as read
  |--------------------------------------------------------------------------
  */

  async function markAllNotificationsAsRead() {
    try {
      await api
        .markAllNotificationsAsRead();

      const now =
        new Date()
          .toISOString();

      setNotifications(
        (current) =>
          current.map(
            (
              notification
            ) => ({
              ...notification,

              read_at:
                notification.read_at ||
                now,

              readAt:
                notification.readAt ||
                now,

              isRead:
                true,
            })
          )
      );

      setUnreadNotifications(
        []
      );

      return true;
    } catch (error) {
      console.error(
        'Mark all notifications read error:',
        error
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete notification
  |--------------------------------------------------------------------------
  */

  async function deleteNotification(
    id
  ) {
    try {
      await api.deleteNotification(
        id
      );

      setNotifications(
        (current) =>
          current.filter(
            (
              notification
            ) =>
              String(
                notification.id
              ) !==
              String(id)
          )
      );

      setUnreadNotifications(
        (current) =>
          current.filter(
            (
              notification
            ) =>
              String(
                notification.id
              ) !==
              String(id)
          )
      );

      return true;
    } catch (error) {
      console.error(
        'Delete notification error:',
        error
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  async function refreshNotifications() {
    await Promise.all([
      loadNotifications(),
      loadUnreadNotifications(),
    ]);
  }

  const unreadCount =
    unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    unreadCount,

    notificationsLoading,
    notificationsError,

    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,

    reloadNotifications:
      loadNotifications,

    reloadUnreadNotifications:
      loadUnreadNotifications,

    refreshNotifications,
  };
}