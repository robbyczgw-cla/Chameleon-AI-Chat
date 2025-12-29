package com.chameleon.ai.chat;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Chameleon AI Home Screen Widget
 *
 * Features:
 * - Quick "New Chat" button
 * - Quick "Voice Input" button
 * - Shows app branding
 * - Tapping anywhere opens the app
 */
public class ChameleonWidget extends AppWidgetProvider {

    private static final String PREFS_NAME = "ChameleonWidgetPrefs";
    private static final String PREF_LAST_CHAT_TITLE = "last_chat_title";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Update each widget instance
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Create the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_chameleon);

        // Intent to open the app (main activity)
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            context,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Intent to start a new chat
        Intent newChatIntent = new Intent(context, MainActivity.class);
        newChatIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        newChatIntent.setData(Uri.parse("chameleon-ai://new-chat"));
        newChatIntent.putExtra("action", "new_chat");
        PendingIntent newChatPendingIntent = PendingIntent.getActivity(
            context,
            1,
            newChatIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Intent to start voice input
        Intent voiceIntent = new Intent(context, MainActivity.class);
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        voiceIntent.setData(Uri.parse("chameleon-ai://voice"));
        voiceIntent.putExtra("action", "voice_input");
        PendingIntent voicePendingIntent = PendingIntent.getActivity(
            context,
            2,
            voiceIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Set click handlers
        views.setOnClickPendingIntent(R.id.widget_container, openAppPendingIntent);
        views.setOnClickPendingIntent(R.id.btn_new_chat, newChatPendingIntent);
        views.setOnClickPendingIntent(R.id.btn_voice, voicePendingIntent);

        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onEnabled(Context context) {
        // Called when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Called when the last widget is removed
    }

    /**
     * Update the widget with the last chat title (called from MainActivity)
     */
    public static void updateLastChat(Context context, String chatTitle) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(PREF_LAST_CHAT_TITLE, chatTitle).apply();

        // Trigger widget update
        Intent intent = new Intent(context, ChameleonWidget.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        context.sendBroadcast(intent);
    }
}
