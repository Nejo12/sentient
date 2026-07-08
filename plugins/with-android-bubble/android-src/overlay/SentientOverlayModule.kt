package com.gee1216.sentient.overlay

import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SentientOverlayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SentientOverlay"

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
    }

    @ReactMethod
    fun startBubble(promise: Promise) {
        val context = reactApplicationContext
        if (!Settings.canDrawOverlays(context)) {
            promise.reject("OVERLAY_DENIED", "Overlay permission is not granted")
            return
        }

        val intent = Intent(context, BubbleOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun stopBubble(promise: Promise) {
        val context = reactApplicationContext
        context.stopService(Intent(context, BubbleOverlayService::class.java))
        promise.resolve(null)
    }

    @ReactMethod
    fun isBubbleRunning(promise: Promise) {
        promise.resolve(BubbleOverlayService.isRunning)
    }
}
