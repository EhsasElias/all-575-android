import React from 'react';

export default function NotificationsPage({
    lang,
    notifications,
    unreadCount,
    notificationsLoading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    showToast,
    go,
}) {
    const isArabic =
        lang === 'ar';

    function formatDate(value) {
        if (!value) {
            return '';
        }

        return new Date(value)
            .toLocaleString(
                isArabic
                    ? 'ar-SA'
                    : 'en-US'
            );
    }

    async function handleMarkRead(
        notification
    ) {
        if (
            notification.isRead
        ) {
            return;
        }

        const success =
            await markNotificationAsRead(
                notification.id
            );

        if (!success) {
            showToast(
                isArabic
                    ? 'تعذر تحديث الإشعار'
                    : 'Could not update notification'
            );
        }
    }

    async function handleMarkAll() {
        if (
            unreadCount === 0
        ) {
            return;
        }

        const success =
            await markAllNotificationsAsRead();

        showToast(
            success
                ? (
                    isArabic
                        ? 'تم تحديد جميع الإشعارات كمقروءة'
                        : 'All notifications marked as read'
                )
                : (
                    isArabic
                        ? 'تعذر تحديث الإشعارات'
                        : 'Could not update notifications'
                )
        );
    }

    async function handleDelete(id) {
        const success =
            await deleteNotification(
                id
            );

        showToast(
            success
                ? (
                    isArabic
                        ? 'تم حذف الإشعار'
                        : 'Notification deleted'
                )
                : (
                    isArabic
                        ? 'تعذر حذف الإشعار'
                        : 'Could not delete notification'
                )
        );
    }

    if (notificationsLoading) {
        return (
            <main
                style={{
                    maxWidth: 620,
                    margin: '0 auto',
                    padding:
                        '24px 16px 140px',
                    textAlign:
                        'center',
                }}
            >
                {isArabic
                    ? 'جاري تحميل الإشعارات...'
                    : 'Loading notifications...'}
            </main>
        );
    }

    return (
        <main
            dir={
                isArabic
                    ? 'rtl'
                    : 'ltr'
            }
            style={{
                maxWidth: 620,
                margin: '0 auto',
                padding:
                    '22px 16px 140px',
            }}
        >
            {/* Header */}

            <div
                style={{
                    display: 'flex',
                    alignItems:
                        'center',
                    justifyContent:
                        'space-between',
                    gap: 12,
                    marginBottom: 18,
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 24,
                        }}
                    >
                        {isArabic
                            ? 'الإشعارات'
                            : 'Notifications'}
                    </h1>

                    <div
                        style={{
                            marginTop: 5,
                            opacity: 0.6,
                            fontSize: 13,
                        }}
                    >
                        {isArabic
                            ? `${unreadCount} غير مقروء`
                            : `${unreadCount} unread`}
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={
                            handleMarkAll
                        }
                        style={{
                            border: 0,
                            background:
                                'transparent',
                            color:
                                '#10985f',
                            font:
                                'inherit',
                            fontWeight:
                                800,
                            cursor:
                                'pointer',
                        }}
                    >
                        {isArabic
                            ? 'قراءة الكل'
                            : 'Mark all read'}
                    </button>
                )}
            </div>

            {/* Empty */}

            {notifications.length ===
                0 && (
                    <div
                        style={{
                            padding:
                                '50px 20px',
                            textAlign:
                                'center',
                            opacity:
                                0.65,
                        }}
                    >
                        <div
                            style={{
                                fontSize:
                                    36,
                                marginBottom:
                                    10,
                            }}
                        >
                            🔔
                        </div>

                        <strong>
                            {isArabic
                                ? 'لا توجد إشعارات'
                                : 'No notifications'}
                        </strong>
                    </div>
                )}

            {/* Notifications */}

            <div
                style={{
                    display:
                        'grid',
                    gap:
                        12,
                }}
            >
                {notifications.map(
                    (
                        notification
                    ) => (
                        <article
                            key={
                                notification.id
                            }
                            onClick={() =>
                                handleMarkRead(
                                    notification
                                )
                            }
                            style={{
                                position:
                                    'relative',

                                padding:
                                    16,

                                borderRadius:
                                    18,

                                cursor:
                                    notification.isRead
                                        ? 'default'
                                        : 'pointer',

                                border:
                                    notification.isRead
                                        ? '1px solid rgba(0,0,0,.07)'
                                        : '1px solid rgba(16,152,95,.25)',

                                background:
                                    notification.isRead
                                        ? 'var(--card, #fff)'
                                        : 'rgba(16,152,95,.055)',

                                boxShadow:
                                    '0 8px 24px rgba(0,0,0,.04)',
                            }}
                        >
                            {/* unread dot */}

                            {!notification
                                .isRead && (
                                    <span
                                        style={{
                                            position:
                                                'absolute',

                                            top:
                                                16,

                                            insetInlineStart:
                                                16,

                                            width:
                                                9,

                                            height:
                                                9,

                                            borderRadius:
                                                '50%',

                                            background:
                                                '#10985f',
                                        }}
                                    />
                                )}

                            <div
                                style={{
                                    paddingInlineStart:
                                        notification.isRead
                                            ? 0
                                            : 18,
                                }}
                            >
                                <strong
                                    style={{
                                        display:
                                            'block',

                                        fontSize:
                                            15,

                                        lineHeight:
                                            1.5,
                                    }}
                                >
                                    {isArabic
                                        ? (
                                            notification.titleAr ||
                                            notification.titleEn
                                        )
                                        : (
                                            notification.titleEn ||
                                            notification.titleAr
                                        )}
                                </strong>

                                {(
                                    notification.messageAr ||
                                    notification.messageEn
                                ) && (
                                        <p
                                            style={{
                                                margin: '7px 0 0',
                                                opacity: 0.68,
                                                fontSize: 13,
                                                lineHeight: 1.7,
                                            }}
                                        >
                                            {isArabic
                                                ? (
                                                    notification.messageAr ||
                                                    notification.messageEn
                                                )
                                                : (
                                                    notification.messageEn ||
                                                    notification.messageAr
                                                )}
                                        </p>
                                    )}

                                <div
                                    style={{
                                        marginTop:
                                            10,

                                        fontSize:
                                            11,

                                        opacity:
                                            0.45,
                                    }}
                                >
                                    {formatDate(
                                        notification
                                            .createdAt
                                    )}
                                </div>
                            </div>

                            {/* Actions */}

                            <div
                                style={{
                                    display:
                                        'flex',

                                    gap:
                                        8,

                                    marginTop:
                                        13,
                                }}
                            >
                                {!notification
                                    .isRead && (
                                        <button
                                            type="button"

                                            onClick={
                                                async (
                                                    event
                                                ) => {
                                                    event
                                                        .stopPropagation();

                                                    await handleMarkRead(
                                                        notification
                                                    );
                                                }
                                            }

                                            style={{
                                                border:
                                                    '1px solid rgba(16,152,95,.22)',

                                                background:
                                                    'rgba(16,152,95,.07)',

                                                color:
                                                    '#10985f',

                                                borderRadius:
                                                    11,

                                                minHeight:
                                                    36,

                                                padding:
                                                    '0 12px',

                                                font:
                                                    'inherit',

                                                fontSize:
                                                    12,

                                                fontWeight:
                                                    800,

                                                cursor:
                                                    'pointer',
                                            }}
                                        >
                                            {isArabic
                                                ? 'تحديد كمقروء'
                                                : 'Mark as read'}
                                        </button>
                                    )}

                                <button
                                    type="button"

                                    onClick={
                                        async (
                                            event
                                        ) => {
                                            event
                                                .stopPropagation();

                                            await handleDelete(
                                                notification.id
                                            );
                                        }
                                    }

                                    style={{
                                        border:
                                            '1px solid rgba(220,38,38,.18)',

                                        background:
                                            'rgba(220,38,38,.05)',

                                        color:
                                            '#dc2626',

                                        borderRadius:
                                            11,

                                        minHeight:
                                            36,

                                        padding:
                                            '0 12px',

                                        font:
                                            'inherit',

                                        fontSize:
                                            12,

                                        fontWeight:
                                            800,

                                        cursor:
                                            'pointer',
                                    }}
                                >
                                    {isArabic
                                        ? 'حذف'
                                        : 'Delete'}
                                </button>
                            </div>
                        </article>
                    )
                )}
            </div>
        </main>
    );
}