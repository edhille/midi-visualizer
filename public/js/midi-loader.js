var oReq = new XMLHttpRequest();
oReq.open("GET", "/vunder.mid", true);
oReq.responseType = "arraybuffer";

oReq.onload = function (oEvent) {
  var arrayBuffer = oReq.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var midi = new Midi({midiByteArray: byteArray});

    console.log(midi);
  }
};

oReq.send(null);
