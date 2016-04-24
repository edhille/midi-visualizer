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
| player | <code>[AudioPlayer](#AudioPlayer)</code> | audio player used for audio playback we are syncing to |
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



<a name="module_DataTypes"></a>

## DataTypes

* [DataTypes](#module_DataTypes)
    * [~MidiVisualizerState](#module_DataTypes..MidiVisualizerState)
        * [new MidiVisualizerState(params)](#new_module_DataTypes..MidiVisualizerState_new)
    * [~RendererState](#module_DataTypes..RendererState)
        * [new RendererState(params)](#new_module_DataTypes..RendererState_new)
    * [~D3RendererState](#module_DataTypes..D3RendererState) ⇐ <code>RendererState</code>
        * [new D3RendererState()](#new_module_DataTypes..D3RendererState_new)
    * [~ThreeJsRendererState](#module_DataTypes..ThreeJsRendererState) ⇐ <code>RendererState</code>
        * [new ThreeJsRendererState()](#new_module_DataTypes..ThreeJsRendererState_new)
    * [~AnimEvent](#module_DataTypes..AnimEvent)
        * [new AnimEvent([id])](#new_module_DataTypes..AnimEvent_new)
    * [~RenderEvent](#module_DataTypes..RenderEvent)
        * [new RenderEvent()](#new_module_DataTypes..RenderEvent_new)
    * [~D3RenderEvent](#module_DataTypes..D3RenderEvent) ⇐ <code>RenderEvent</code>
        * [new D3RenderEvent()](#new_module_DataTypes..D3RenderEvent_new)
    * [~ThreeJsRenderEvent](#module_DataTypes..ThreeJsRenderEvent) ⇐ <code>RenderEvent</code>
        * [new ThreeJsRenderEvent()](#new_module_DataTypes..ThreeJsRenderEvent_new)

<a name="module_DataTypes..MidiVisualizerState"></a>

### DataTypes~MidiVisualizerState
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
<a name="new_module_DataTypes..MidiVisualizerState_new"></a>

#### new MidiVisualizerState(params)
top-level data type representing state of MidiVisualizer

**Returns**: MidiVisualizerState  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | <code>object</code> |  | properties to set |
| params.audioPlayer | <code>[AudioPlayer](#AudioPlayer)</code> |  | AudioPlayer instance managing audio to sync with |
| params.renderer | <code>Renderer</code> |  | Renderer used to draw visualization |
| [params.animEventsByTimeMs] | <code>object</code> | <code>{}</code> | AnimEvent to render, grouped by millisecond-based mark where they should be rendered |
| [params.isPlaying] | <code>boolean</code> | <code>false</code> | flag indicating whether currently playing |

<a name="module_DataTypes..RendererState"></a>

### DataTypes~RendererState
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
<a name="new_module_DataTypes..RendererState_new"></a>

#### new RendererState(params)
top-level data type representing state of Renderer

**Returns**: RendererState  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | <code>object</code> |  | properties to set |
| params.id | <code>string</code> |  | unique identifier for renderer |
| params.root | <code>HTMLElement</code> |  | HTMLElement to use as root node for renderer canvas placement |
| params.window | <code>Window</code> |  | Window we are rendering in (note, Window must have a 'document') |
| [params.width] | <code>number</code> | <code>0</code> | width for rendering canvas |
| [params.height] | <code>number</code> | <code>0</code> | height for rendering canvas |
| [param.renderEvents] | <code>Array.&lt;RenderEvents&gt;</code> | <code>[]</code> | RenderEvents to render |
| [params.scales] | <code>Array.&lt;object&gt;</code> | <code>[]</code> | Scales for normalizing position/sizing |
| [params.isPlaying] | <code>boolean</code> | <code>false</code> | flag indicating whether currently playing |

<a name="module_DataTypes..D3RendererState"></a>

### DataTypes~D3RendererState ⇐ <code>RendererState</code>
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
**Extends:** <code>RendererState</code>  
<a name="new_module_DataTypes..D3RendererState_new"></a>

#### new D3RendererState()
data type representing state of Renderer that uses D3

**Returns**: D3RendererState  

| Param | Type | Description |
| --- | --- | --- |
| params.svg | <code>SVGElement</code> | SVGElement for renderering |

<a name="module_DataTypes..ThreeJsRendererState"></a>

### DataTypes~ThreeJsRendererState ⇐ <code>RendererState</code>
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
**Extends:** <code>RendererState</code>  
<a name="new_module_DataTypes..ThreeJsRendererState_new"></a>

#### new ThreeJsRendererState()
data type representing state of Renderer that uses D3

**Returns**: ThreeJsRendererState  

| Param | Type | Description |
| --- | --- | --- |
| params.THREE | <code>THREEJS</code> | ThreeJs object |
| params.camera | <code>Camera</code> | ThreeJs Camera to use |
| params.scene | <code>Scene</code> | ThreeJs Scene to use |
| params.renderer | <code>Renderer</code> | Renderer monad to use |

<a name="module_DataTypes..AnimEvent"></a>

### DataTypes~AnimEvent
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
<a name="new_module_DataTypes..AnimEvent_new"></a>

#### new AnimEvent([id])
data type representing individual animation event

**Returns**: AnimEvent  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params.event | <code>MidiEvent</code> |  | MidiEvent being renderered |
| [params.track] | <code>number</code> | <code>0</code> | index of midi track event belongs to |
| [params.startTimeMicroSec] | <code>number</code> | <code>0</code> | offset in microseconds from beginning of song when event starts |
| [params.lengthMicroSec] | <code>number</code> | <code>0</code> | length of event in microseconds |
| [params.microSecPerBeat] | <code>number</code> | <code>500000</code> | number of microseconds per beat |
| [id] | <code>string</code> | <code>&quot;&lt;track&gt;-&lt;event.note || startTimeInMicroSec&gt;&quot;</code> | unique ID of event |

<a name="module_DataTypes..RenderEvent"></a>

### DataTypes~RenderEvent
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
<a name="new_module_DataTypes..RenderEvent_new"></a>

#### new RenderEvent()
base data type representing individual render event

**Returns**: RenderEvent  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params.id | <code>id</code> |  | unique string identifier for event |
| params.track | <code>number</code> |  | index of midi track event belongs to |
| params.subtype | <code>string</code> |  | midi event subtype |
| params.x | <code>number</code> |  | x position for element |
| params.y | <code>number</code> |  | y position for element |
| params.lengthMicroSec | <code>number</code> |  | length of event in microseconds |
| params.microSecPerBeat | <code>number</code> |  | number of microseconds per beat |
| [params.z] | <code>number</code> | <code>0</code> | z position for element |
| [params.microSecPerBeat] | <code>number</code> | <code>500000</code> | number of microseconds per beat |
| [params.color] | <code>string</code> | <code>&quot;&#x27;#FFFFFF&#x27;&quot;</code> | color of element to render |

<a name="module_DataTypes..D3RenderEvent"></a>

### DataTypes~D3RenderEvent ⇐ <code>RenderEvent</code>
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
**Extends:** <code>RenderEvent</code>  
<a name="new_module_DataTypes..D3RenderEvent_new"></a>

#### new D3RenderEvent()
data type representing individual render event using D3

**Returns**: D3RenderEvent  

| Param | Type | Description |
| --- | --- | --- |
| [params.path] | <code>string</code> | SVG path string (required if no 'radius' given) |
| [params.radius] | <code>number</code> | radius to use for rendering circle (required if no 'path' given) |
| [params.scale] | <code>d3.Scale</code> | D3.Scale (required if 'path' is given) |

<a name="module_DataTypes..ThreeJsRenderEvent"></a>

### DataTypes~ThreeJsRenderEvent ⇐ <code>RenderEvent</code>
**Kind**: inner class of <code>[DataTypes](#module_DataTypes)</code>  
**Extends:** <code>RenderEvent</code>  
<a name="new_module_DataTypes..ThreeJsRenderEvent_new"></a>

#### new ThreeJsRenderEvent()
data type representing individual render event using ThreeJS

**Returns**: ThreeJsRenderEvent  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params.scale] | <code>number</code> | <code>1</code> | scaling factor |
| [params.zRot] | <code>number</code> | <code>0</code> | z-rotation |
| [params.xRot] | <code>number</code> | <code>0</code> | x-rotation |
| [params.yRot] | <code>number</code> | <code>0</code> | y-rotation |
| [params.note] | <code>number</code> |  | midi note value (0-127) |
| [params.shape] | <code>number</code> |  | ??? |



<a name="AudioPlayer"></a>

## AudioPlayer
**Kind**: global class  

* [AudioPlayer](#AudioPlayer)
    * [new AudioPlayer(params)](#new_AudioPlayer_new)
    * _instance_
        * [.getPlayheadTime()](#AudioPlayer+getPlayheadTime) ⇒
        * [.play([startTimeOffset], [playheadSec])](#AudioPlayer+play)
        * [.pause(stopAfter)](#AudioPlayer+pause)
    * _static_
        * [.getAudioContextFromWindow(window)](#AudioPlayer.getAudioContextFromWindow) ⇒
    * _inner_
        * [~loadDataCallback](#AudioPlayer..loadDataCallback) : <code>function</code>

<a name="new_AudioPlayer_new"></a>

### new AudioPlayer(params)
manages audio playback

**Returns**: AudioPlayer  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | settings for audio player |
| params.window | <code>Window</code> | Window used to retrieve AudioContext |

<a name="AudioPlayer+getPlayheadTime"></a>

### audioPlayer.getPlayheadTime() ⇒
gets the playhead time in milliseconds

**Kind**: instance method of <code>[AudioPlayer](#AudioPlayer)</code>  
**Returns**: playheadTimeMs  
<a name="AudioPlayer+play"></a>

### audioPlayer.play([startTimeOffset], [playheadSec])
initiates playing of audio

**Kind**: instance method of <code>[AudioPlayer](#AudioPlayer)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [startTimeOffset] | <code>number</code> | <code>0</code> | offset in seconds to wait before playing |
| [playheadSec] | <code>number</code> | <code>0</code> | where to start playback within audio in seconds |

<a name="AudioPlayer+pause"></a>

### audioPlayer.pause(stopAfter)
pauses playing of audio

**Kind**: instance method of <code>[AudioPlayer](#AudioPlayer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| stopAfter | <code>number</code> | number of seconds to wait before stopping |

<a name="AudioPlayer.getAudioContextFromWindow"></a>

### AudioPlayer.getAudioContextFromWindow(window) ⇒
cross-browser fetch of AudioContext from given window

**Kind**: static method of <code>[AudioPlayer](#AudioPlayer)</code>  
**Returns**: AudioContext  

| Param | Type | Description |
| --- | --- | --- |
| window | <code>Window</code> | Window to fetch AudioContext from |

<a name="AudioPlayer..loadDataCallback"></a>

### AudioPlayer~loadDataCallback : <code>function</code>
loads given audio data and invokes callback when done

**Kind**: inner typedef of <code>[AudioPlayer](#AudioPlayer)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| audioData | <code>ArrayBuffer</code> |  | ArrayBuffer of data for audio to play |
| callback | <code>[loadDataCallback](#AudioPlayer..loadDataCallback)</code> |  | callback to invoke when audioData is finished loading |
| [err] | <code>string</code> | <code>null</code> | string of error message (null if no error) |
| [self] | <code>[AudioPlayer](#AudioPlayer)</code> |  | ref to AudioPlayer instance if loading successful (undefined otherwise) |


