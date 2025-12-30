package com.chameleon.ai.chat;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.PathInterpolator;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import java.util.List;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity for Chameleon AI Chat
 * SOTA Implementation for Android 13-16 with:
 * - Edge-to-edge display (Android 15+ requirement)
 * - Predictive back gesture support (Android 16)
 * - Optimized WebView configuration
 * - Share intent handling
 * - Deep link support
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "ChameleonAI";
    private boolean isReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install splash screen before super.onCreate()
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep splash screen visible until app is ready
        splashScreen.setKeepOnScreenCondition(() -> !isReady);

        // Enable edge-to-edge display for Android 15+ compliance
        EdgeToEdge.enable(this);

        super.onCreate(savedInstanceState);

        // Configure window for immersive experience
        configureWindow();

        // Configure WebView for optimal performance
        configureWebView();

        // Setup predictive back gesture for Android 16+
        setupPredictiveBackGesture();

        // Handle incoming intents (share targets, deep links)
        handleIntent(getIntent());

        // Defer bridge-dependent setup to ensure it's ready
        // This fixes crash on first launch after fresh install
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> {
                // Setup smooth keyboard animations (Android 11+)
                setupKeyboardAnimation();
                isReady = true;
            });
        } else {
            // Fallback: post to main thread with delay
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                setupKeyboardAnimation();
                isReady = true;
            }, 500);
        }
    }

    /**
     * Configure window for edge-to-edge and dark theme
     */
    private void configureWindow() {
        Window window = getWindow();

        // Enable drawing behind system bars
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Set system bars to dark theme
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(false);
        }

        // Transparent system bars for edge-to-edge
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // CRITICAL: Set window background to match app theme
        // This prevents black showing through during keyboard animation
        window.getDecorView().setBackgroundColor(Color.parseColor("#0a0a0a"));

        // Handle window insets for proper layout
        View rootView = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());

            // Pass insets to WebView via JavaScript
            // IMPORTANT: Set bottom to 0 because adjustResize handles keyboard positioning
            // Setting it to insets.bottom causes a black bar when keyboard opens
            bridge.getWebView().post(() -> {
                String js = String.format(
                    "document.documentElement.style.setProperty('--safe-area-top', '%dpx');" +
                    "document.documentElement.style.setProperty('--safe-area-bottom', '0px');" +
                    "document.documentElement.style.setProperty('--safe-area-left', '%dpx');" +
                    "document.documentElement.style.setProperty('--safe-area-right', '%dpx');",
                    pxToDp(insets.top),
                    pxToDp(insets.left),
                    pxToDp(insets.right)
                );
                bridge.getWebView().evaluateJavascript(js, null);
            });

            return windowInsets;
        });

        // Keep screen on during long AI responses (optional, controlled by web)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    /**
     * Configure WebView for optimal performance
     */
    private void configureWebView() {
        WebView webView = bridge.getWebView();
        if (webView == null) return;

        // CRITICAL: Set WebView background to match app theme
        // This prevents black bar appearing during keyboard animation
        webView.setBackgroundColor(Color.parseColor("#0a0a0a")); // Dark theme background

        WebSettings settings = webView.getSettings();

        // Enable modern web features
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // CRITICAL: Enable keyboard predictions and autocomplete
        // This allows the keyboard to show word suggestions
        settings.setSaveFormData(true);  // Enable form data saving (helps with autocomplete)

        // Enable autofill for Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
        }

        // Performance optimizations
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);

        // Enable hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Modern rendering
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            settings.setForceDark(WebSettings.FORCE_DARK_ON);
        }

        // Enable media playback (for TTS)
        settings.setMediaPlaybackRequiresUserGesture(false);

        // File access for uploads
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Enable mixed content for development
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Optimize scrolling
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        // Memory optimization
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);

        // User agent identification
        String defaultUserAgent = settings.getUserAgentString();
        settings.setUserAgentString(defaultUserAgent + " ChameleonAI/1.0.0");
    }

    /**
     * Setup predictive back gesture for Android 16+
     */
    private void setupPredictiveBackGesture() {
        // Register back pressed callback for custom handling
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = bridge.getWebView();
                if (webView != null && webView.canGoBack()) {
                    // Navigate back in web history
                    webView.goBack();
                } else {
                    // Let the web app handle it via JavaScript
                    webView.evaluateJavascript(
                        "if (typeof window.__handleNativeBack === 'function') { " +
                        "  window.__handleNativeBack(); " +
                        "} else { " +
                        "  window.dispatchEvent(new CustomEvent('chameleon:back-pressed')); " +
                        "}",
                        result -> {
                            // If no handler, use default behavior
                            if ("false".equals(result) || result == null || result.isEmpty()) {
                                setEnabled(false);
                                getOnBackPressedDispatcher().onBackPressed();
                                setEnabled(true);
                            }
                        }
                    );
                }
            }
        });
    }

    /**
     * Handle incoming intents (share targets, deep links)
     */
    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String type = intent.getType();

        // Check for widget/text selection actions from extras
        String extraAction = intent.getStringExtra("action");
        if (extraAction != null) {
            handleWidgetAction(intent, extraAction);
            return;
        }

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            handleShareIntent(intent, type);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            handleMultipleShareIntent(intent);
        } else if (Intent.ACTION_VIEW.equals(action)) {
            handleDeepLink(intent);
        }
    }

    /**
     * Handle widget and text selection actions
     * Uses delayed dispatch to ensure web app is ready to receive events
     */
    private void handleWidgetAction(Intent intent, String action) {
        switch (action) {
            case "new_chat":
                // Start a new chat - delay to ensure web app is ready
                dispatchEventWithRetry("window.dispatchEvent(new CustomEvent('chameleon:new-chat'));", 3);
                break;

            case "voice_input":
                // Start voice input
                dispatchEventWithRetry("window.dispatchEvent(new CustomEvent('chameleon:voice-input'));", 3);
                break;

            case "process_text":
                // Text selected from another app - "Ask Chameleon"
                String selectedText = intent.getStringExtra("selected_text");
                if (selectedText != null && !selectedText.isEmpty()) {
                    String js = String.format(
                        "window.dispatchEvent(new CustomEvent('chameleon:ask', { " +
                        "  detail: { text: '%s' } " +
                        "}));",
                        escapeJs(selectedText)
                    );
                    dispatchEventWithRetry(js, 5); // More retries for text selection
                }
                break;
        }
    }

    /**
     * Dispatch JavaScript event with retry mechanism
     * Ensures the web app has time to initialize before receiving events
     */
    private void dispatchEventWithRetry(String js, int maxRetries) {
        final int[] retryCount = {0};
        final long initialDelay = 500; // Wait 500ms initially for page load
        final long retryDelay = 300;   // Then retry every 300ms

        bridge.getWebView().postDelayed(new Runnable() {
            @Override
            public void run() {
                // Check if web app is ready by looking for our initialization flag
                bridge.getWebView().evaluateJavascript(
                    "(function() { return window.__chameleonReady === true; })()",
                    result -> {
                        if ("true".equals(result)) {
                            // Web app is ready, dispatch the event
                            bridge.getWebView().evaluateJavascript(js, null);
                        } else if (retryCount[0] < maxRetries) {
                            // Retry after delay
                            retryCount[0]++;
                            bridge.getWebView().postDelayed(this, retryDelay);
                        } else {
                            // Max retries reached, try dispatching anyway
                            bridge.getWebView().evaluateJavascript(js, null);
                        }
                    }
                );
            }
        }, initialDelay);
    }

    /**
     * Handle single item share intent
     */
    private void handleShareIntent(Intent intent, String type) {
        if (type.startsWith("text/")) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            String sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT);
            if (sharedText != null) {
                passShareToWeb("text", sharedText, sharedTitle);
            }
        } else if (type.startsWith("image/")) {
            Uri imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (imageUri != null) {
                passShareToWeb("image", imageUri.toString(), null);
            }
        } else if (type.equals("application/pdf")) {
            Uri pdfUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (pdfUri != null) {
                passShareToWeb("pdf", pdfUri.toString(), null);
            }
        }
    }

    /**
     * Handle multiple items share intent
     */
    private void handleMultipleShareIntent(Intent intent) {
        java.util.ArrayList<Uri> imageUris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
        if (imageUris != null && !imageUris.isEmpty()) {
            StringBuilder uris = new StringBuilder("[");
            for (int i = 0; i < imageUris.size(); i++) {
                if (i > 0) uris.append(",");
                uris.append("\"").append(imageUris.get(i).toString()).append("\"");
            }
            uris.append("]");
            passShareToWeb("images", uris.toString(), null);
        }
    }

    /**
     * Pass share data to web app
     */
    private void passShareToWeb(String type, String data, String title) {
        bridge.getWebView().post(() -> {
            String js = String.format(
                "window.dispatchEvent(new CustomEvent('chameleon:share-received', { " +
                "  detail: { type: '%s', data: %s, title: %s } " +
                "}));",
                type,
                type.equals("images") ? data : "'" + escapeJs(data) + "'",
                title != null ? "'" + escapeJs(title) + "'" : "null"
            );
            bridge.getWebView().evaluateJavascript(js, null);
        });
    }

    /**
     * Handle deep links
     */
    private void handleDeepLink(Intent intent) {
        Uri data = intent.getData();
        if (data != null) {
            String url = data.toString();
            bridge.getWebView().post(() -> {
                String js = String.format(
                    "window.dispatchEvent(new CustomEvent('chameleon:deep-link', { " +
                    "  detail: { url: '%s' } " +
                    "}));",
                    escapeJs(url)
                );
                bridge.getWebView().evaluateJavascript(js, null);
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Notify web app of configuration changes
        bridge.getWebView().post(() -> {
            String js = String.format(
                "window.dispatchEvent(new CustomEvent('chameleon:config-changed', { " +
                "  detail: { orientation: '%s', uiMode: '%s' } " +
                "}));",
                newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE ? "landscape" : "portrait",
                (newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES ? "dark" : "light"
            );
            bridge.getWebView().evaluateJavascript(js, null);
        });
    }

    /**
     * Convert pixels to density-independent pixels
     */
    private int pxToDp(int px) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(px / density);
    }

    /**
     * Escape JavaScript string
     */
    private String escapeJs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("'", "\\'")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r");
    }

    /**
     * Setup smooth keyboard animations (Android 11+)
     * Uses WindowInsetsAnimationCompat for synchronized keyboard animations
     */
    private void setupKeyboardAnimation() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            // WindowInsetsAnimation requires Android 11+
            return;
        }

        // Ensure bridge is ready (fixes crash on fresh install)
        if (bridge == null) return;

        WebView webView = bridge.getWebView();
        if (webView == null) return;

        // Create a callback to sync content with keyboard animation
        WindowInsetsAnimationCompat.Callback animationCallback = new WindowInsetsAnimationCompat.Callback(
            WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_STOP
        ) {
            private int startBottom = 0;
            private int endBottom = 0;

            @Override
            public void onPrepare(WindowInsetsAnimationCompat animation) {
                // Called before animation starts
                super.onPrepare(animation);
            }

            @Override
            public WindowInsetsAnimationCompat.BoundsCompat onStart(
                WindowInsetsAnimationCompat animation,
                WindowInsetsAnimationCompat.BoundsCompat bounds
            ) {
                // Capture the start and end keyboard heights
                startBottom = bounds.getLowerBound().bottom;
                endBottom = bounds.getUpperBound().bottom;

                // Notify web app that keyboard animation is starting
                String js = String.format(
                    "document.documentElement.classList.add('keyboard-animating');" +
                    "document.documentElement.style.setProperty('--keyboard-height-start', '%dpx');" +
                    "document.documentElement.style.setProperty('--keyboard-height-end', '%dpx');",
                    pxToDp(startBottom),
                    pxToDp(endBottom)
                );
                webView.evaluateJavascript(js, null);

                return bounds;
            }

            @Override
            public WindowInsetsCompat onProgress(
                WindowInsetsCompat insets,
                List<WindowInsetsAnimationCompat> runningAnimations
            ) {
                // Find the IME animation
                WindowInsetsAnimationCompat imeAnimation = null;
                for (WindowInsetsAnimationCompat animation : runningAnimations) {
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) {
                        imeAnimation = animation;
                        break;
                    }
                }

                if (imeAnimation != null) {
                    // Get the current progress (0.0 to 1.0)
                    float progress = imeAnimation.getInterpolatedFraction();

                    // Calculate current keyboard height
                    Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());
                    int currentHeight = imeInsets.bottom;

                    // Update CSS variable for smooth transition
                    String js = String.format(
                        "document.documentElement.style.setProperty('--keyboard-height', '%dpx');" +
                        "document.documentElement.style.setProperty('--keyboard-progress', '%.3f');",
                        pxToDp(currentHeight),
                        progress
                    );
                    webView.evaluateJavascript(js, null);
                }

                return insets;
            }

            @Override
            public void onEnd(WindowInsetsAnimationCompat animation) {
                // Notify web app that keyboard animation ended
                String js = "document.documentElement.classList.remove('keyboard-animating');";
                webView.evaluateJavascript(js, null);

                super.onEnd(animation);
            }
        };

        // Apply the animation callback to the WebView
        ViewCompat.setWindowInsetsAnimationCallback(webView, animationCallback);
    }
}
