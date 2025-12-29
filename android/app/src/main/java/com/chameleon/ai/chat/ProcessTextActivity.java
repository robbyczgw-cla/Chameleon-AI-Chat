package com.chameleon.ai.chat;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

/**
 * ProcessTextActivity - Handles "Ask Chameleon" text selection action
 *
 * When users select text in any app and tap "Ask Chameleon" from the
 * text selection menu, this activity receives the text and opens the
 * main app with the selected text pre-filled in the chat input.
 *
 * Requires Android 6.0+ (API 23+)
 */
public class ProcessTextActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get the selected text from the intent
        CharSequence selectedText = getSelectedText();

        if (selectedText != null && selectedText.length() > 0) {
            // Launch MainActivity with the selected text
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // Pass the text as a deep link with query parameter
            String encodedText = Uri.encode(selectedText.toString());
            mainIntent.setData(Uri.parse("chameleon-ai://ask?text=" + encodedText));
            mainIntent.putExtra("action", "process_text");
            mainIntent.putExtra("selected_text", selectedText.toString());

            startActivity(mainIntent);
        }

        // Close this transparent activity
        finish();
    }

    /**
     * Extract the selected text from the intent
     */
    private CharSequence getSelectedText() {
        Intent intent = getIntent();

        // Android 6.0+ PROCESS_TEXT action
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Intent.ACTION_PROCESS_TEXT.equals(intent.getAction())) {
                return intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            }
        }

        // Fallback: SEND action (share menu)
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            String type = intent.getType();
            if ("text/plain".equals(type)) {
                return intent.getStringExtra(Intent.EXTRA_TEXT);
            }
        }

        return null;
    }
}
