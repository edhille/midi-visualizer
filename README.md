# midi-visualizer

A simple, functional-based midi visualization library

## API Reference

<a name="module_RenderUtils"></a>

## RenderUtils
<a name="module_RenderUtils..play"></a>

### RenderUtils~play(renderFn, state, playheadTimeMs) ⇒ <code>RendererState</code>
Put visualizer in "play" state (where audio player is playing and animations are running)

**Kind**: inner method of <code>[RenderUtils](#module_RenderUtils)</code>  
**Returns**: <code>RendererState</code> - - new monad state  

| Param | Type | Description |
| --- | --- | --- |
| renderFn | <code>RenderUtils~render</code> | callback for actual rendering |
| state | <code>RendererState</code> | current monad state |
| playheadTimeMs | <code>number</code> | current playhead place in milliseconds |


