# midi-visualizer

A simple, functional-based midi visualization library

## API Reference

<a name="module_RenderUtils"></a>

## RenderUtils

* [RenderUtils](#module_RenderUtils)
    * [~MAX_RAF_DELTA_MS](#module_RenderUtils..MAX_RAF_DELTA_MS) : <code>number</code>
    * [~play(state, player, renderFn, resumeFn)](#module_RenderUtils..play) ⇒ <code>RendererState</code>
    * [~pause(state)](#module_RenderUtils..pause) ⇒ <code>RendererState</code>
    * [~stop(state)](#module_RenderUtils..stop) ⇒ <code>RendererState</code>
    * [~transformEvents(state, trackTransforms, animEvents)](#module_RenderUtils..transformEvents) ⇒ <code>Array.&lt;RenderEvent&gt;</code>
    * [~mapEvents(state, midi, config)](#module_RenderUtils..mapEvents) ⇒ <code>RendererState</code>
    * [~maxNote(currentMaxNote, event)](#module_RenderUtils..maxNote) ⇒ <code>number</code>
    * [~minNote(currentMinNote, event)](#module_RenderUtils..minNote) ⇒ <code>number</code>
    * [~isNoteToggleEvent(event)](#module_RenderUtils..isNoteToggleEvent) ⇒ <code>boolean</code>
    * [~isNoteOnEvent(event)](#module_RenderUtils..isNoteOnEvent) ⇒ <code>boolean</code>
    * [~render(state, cleanupFn, rafFn, currentRunningEvents, renderEvents, nowMs)](#module_RenderUtils..render) ⇒ <code>Array.&lt;RenderEvent&gt;</code>

<a name="module_RenderUtils..MAX_RAF_DELTA_MS"></a>

### RenderUtils~MAX_RAF_DELTA_MS : <code>number</code>
**Kind**: inner constant of <code>[RenderUtils](#module_RenderUtils)</code>  
<a name="module_RenderUtils..play"></a>

### RenderUtils~play(state, player, renderFn, resumeFn) ⇒ <code>RendererState</code>
Put visualizer in "play" state (where audio player is playing and animations are running)

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>RendererState</code> - - new monad state  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | current monad state |
| player | <code>AudioPlayer</code> | audio player used for audio playback we are syncing to |
| renderFn | <code>RenderUtils~render</code> | callback for actual rendering |
| resumeFn | <code>RenderUtils~resume</code> | callback for resuming playback after stopping |

<a name="module_RenderUtils..pause"></a>

### RenderUtils~pause(state) ⇒ <code>RendererState</code>
Put visualizer in "paused" state (where audio player is paused and animations are not running)

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>RendererState</code> - - new monad state  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | current monad state |

<a name="module_RenderUtils..stop"></a>

### RenderUtils~stop(state) ⇒ <code>RendererState</code>
Put visualizer in "stopped" state (where audio player is stopped and animations are not running)

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>RendererState</code> - - new monad state  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | current monad state |

<a name="module_RenderUtils..transformEvents"></a>

### RenderUtils~transformEvents(state, trackTransforms, animEvents) ⇒ <code>Array.&lt;RenderEvent&gt;</code>
Applies given track transforms to animation events

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>Array.&lt;RenderEvent&gt;</code> - array of transformed renderEvents  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | state monad |
| trackTransforms | <code>Array.&lt;function()&gt;</code> | callback functions (TODO: document) |
| animEvents | <code>Array.&lt;AnimEvent&gt;</code> | given animation events to transform |

<a name="module_RenderUtils..mapEvents"></a>

### RenderUtils~mapEvents(state, midi, config) ⇒ <code>RendererState</code>
Map over given Midi data, transforming MidiEvents into RenderEvents

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>RendererState</code> - - new monad state  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | current monad state |
| midi | <code>Midi</code> | midi data to map to RenderEvents |
| config | <code>object</code> | configuration data |

<a name="module_RenderUtils..maxNote"></a>

### RenderUtils~maxNote(currentMaxNote, event) ⇒ <code>number</code>
Compare given note with note in given RenderEvent, returning whichever is larger

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>number</code> - - largest of two notes  

| Param | Type | Description |
| --- | --- | --- |
| currentMaxNote | <code>number</code> | value of current "max" note |
| event | <code>RenderEvent</code> | RenderEvent containing note to compare |

<a name="module_RenderUtils..minNote"></a>

### RenderUtils~minNote(currentMinNote, event) ⇒ <code>number</code>
Compare given note with note in given RenderEvent, returning whichever is smaller

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>number</code> - - smallest of two notes  

| Param | Type | Description |
| --- | --- | --- |
| currentMinNote | <code>number</code> | value of current "min" note |
| event | <code>RenderEvent</code> | RenderEvent containing note to compare |

<a name="module_RenderUtils..isNoteToggleEvent"></a>

### RenderUtils~isNoteToggleEvent(event) ⇒ <code>boolean</code>
Predicate to test whether given RenderEvent is for a note on/off event

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>boolean</code> - - is it a note on/off event  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>RenderEvent</code> | RenderEvent to test |

<a name="module_RenderUtils..isNoteOnEvent"></a>

### RenderUtils~isNoteOnEvent(event) ⇒ <code>boolean</code>
Predicate to test whether given RenderEvent is for a note on event

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>boolean</code> - - is it a note on event  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>RenderEvent</code> | RenderEvent to test |

<a name="module_RenderUtils..render"></a>

### RenderUtils~render(state, cleanupFn, rafFn, currentRunningEvents, renderEvents, nowMs) ⇒ <code>Array.&lt;RenderEvent&gt;</code>
render function

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>Array.&lt;RenderEvent&gt;</code> - - active running render events for this render call  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>RendererState</code> | monad state |
| cleanupFn | <code>function</code> | callback to remove expired animation artifacts |
| rafFn | <code>function</code> | RAF callback to do actual animation |
| currentRunningEvents | <code>Array.&lt;RenderEvent&gt;</code> | RenderEvents currently being animated |
| renderEvents | <code>Array.&lt;RenderEvent&gt;</code> | new RenderEvents to animate |
| nowMs | <code>number</code> | current time in milliseconds |


