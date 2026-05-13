package com.remotify.app

import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.sign
import com.remotify.app.proto.RemoteMessage
import com.remotify.app.proto.RemotePointerInject
import com.remotify.app.proto.PointerDirection

object PointerManager {
    private const val TAG = "PointerManager"

    // Events arrive from React
    data class PointerEvent(val deltaX: Float, val deltaY: Float, val direction: String)

    private val eventChannel = Channel<PointerEvent>(Channel.UNLIMITED)
    private const val FRAME_DELAY_MS = 16L // ~60 FPS

    fun initialize(scope: CoroutineScope, sendPayload: (RemoteMessage) -> Unit) {
        scope.launch(Dispatchers.IO) {
            while (isActive) {
                // Wait for the first event
                val firstEvent = eventChannel.receive()
                var dx = firstEvent.deltaX
                var dy = firstEvent.deltaY
                var direction = firstEvent.direction

                var stateChanged = (direction != "MOVE")

                // Drain any pending events in the channel immediately if they are of the same type
                while (true) {
                    val nextEvent = eventChannel.tryReceive().getOrNull() ?: break
                    if (nextEvent.direction == "MOVE" && !stateChanged) {
                        dx += nextEvent.deltaX
                        dy += nextEvent.deltaY
                    } else if (nextEvent.direction == "MOVE" && stateChanged) {
                        // Ignore move events that come in the same batch right after a state change (e.g. DOWN)
                    } else {
                        dx = nextEvent.deltaX
                        dy = nextEvent.deltaY
                        direction = nextEvent.direction
                        stateChanged = true
                    }
                }

                // Apply ballistic scaling / acceleration
                val scaledDx = applyVelocityScaling(dx)
                val scaledDy = applyVelocityScaling(dy)

                if (scaledDx != 0 || scaledDy != 0 || stateChanged) {
                    try {
                        val dirEnum = when (direction) {
                            "DOWN" -> PointerDirection.DOWN
                            "UP" -> PointerDirection.UP
                            "MOVE" -> PointerDirection.MOVE
                            else -> PointerDirection.UNKNOWN_POINTER_DIRECTION
                        }

                        val pointerInject = RemotePointerInject.newBuilder()
                            .setDirection(dirEnum)
                            .setX(scaledDx)
                            .setY(scaledDy)
                            .build()

                        val message = RemoteMessage.newBuilder()
                            .setRemotePointerInject(pointerInject)
                            .build()

                        sendPayload(message)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed sending pointer data", e)
                    }
                }

                delay(FRAME_DELAY_MS)
            }
        }
    }

    private fun applyVelocityScaling(delta: Float): Int {
        if (delta == 0f) return 0
        
        val absDelta = abs(delta)
        val baseSensitivity = 1.2f
        
        val accelerated = if (absDelta < 5f) {
            absDelta * baseSensitivity
        } else {
            (absDelta.toDouble().pow(1.2).toFloat()) * baseSensitivity
        }
        
        return (accelerated * sign(delta)).toInt()
    }

    fun enqueuePointerEvent(deltaX: Float, deltaY: Float, direction: String) {
        val event = PointerEvent(deltaX, deltaY, direction)
        eventChannel.trySend(event)
    }
}
